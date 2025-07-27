package com.github.asoee.cursorlessjetbrains.javet

import com.caoccao.javet.interop.V8Host
import com.caoccao.javet.interop.V8Runtime
import com.caoccao.javet.interop.options.NodeRuntimeOptions
import com.caoccao.javet.javenode.JNEventLoop
import com.caoccao.javet.javenode.enums.JNModuleType
import com.caoccao.javet.values.V8Value
import com.caoccao.javet.values.primitive.V8ValueString
import com.caoccao.javet.values.reference.IV8ValuePromise
import com.caoccao.javet.values.reference.V8ValueError
import com.caoccao.javet.values.reference.V8ValuePromise
import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessCallback
import com.github.asoee.cursorlessjetbrains.cursorless.DEFAULT_CONFIGURATION
import com.github.asoee.cursorlessjetbrains.cursorless.TreesitterCallback
import com.github.asoee.cursorlessjetbrains.sync.EditorState
import com.intellij.openapi.application.PathManager
import com.intellij.openapi.diagnostic.logger
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import java.io.File
import kotlin.io.path.absolutePathString


private const val PLUGIN_ID = "cursorless-jetbrains"

open class JavetDriver {

    private val logger = logger<JavetDriver>()
    private val ideClientCallback = IdeClientCallback()
    val runtime: V8Runtime
    val eventLoop: JNEventLoop

    init {
        initIcuDataDir()

        val nodeOptions = NodeRuntimeOptions().apply {
            setConsoleArguments(arrayOf("--experimental-vm-modules"))
        }
        runtime = V8Host.getNodeI18nInstance()
            .createV8Runtime(nodeOptions)
        eventLoop = JNEventLoop(runtime)
    }

    private fun initIcuDataDir() {
        val pluginsDir = PathManager.getPluginsDir()
        logger.debug("idea.plugins.path: ${pluginsDir.absolutePathString()}")
        val icuDataDir = pluginsDir
            .resolve(PLUGIN_ID)
            .resolve("extra/icu")
            .toFile()
        logger.debug("icuDataDir: $icuDataDir")
        if (!icuDataDir.exists()) {
            logger.warn("icu data dir does not exist: $icuDataDir")
        }
        NodeRuntimeOptions.NODE_FLAGS.setIcuDataDir(icuDataDir.absolutePath)
    }

    private class ClassPathQueryLoader : TreesitterCallback {
        val queryPrefix = "/cursorless/queries/"
        override fun readQuery(fileName: String): String? {
            val queryContents = javaClass.getResource(queryPrefix + fileName)?.readText()
            return queryContents
        }
    }

    @Synchronized
    fun loadCursorless() {

        val wasmDir = resolveWasmDir()
        this.ideClientCallback.treesitterCallback = ClassPathQueryLoader()

        runtime.createV8ValueObject().use { v8ValueObject ->
            runtime.globalObject.set("ideClient", v8ValueObject)
            v8ValueObject.bind(ideClientCallback)
        }

        eventLoop.loadStaticModules(JNModuleType.Console)

        runtime.getExecutor(
            "globalThis.setTimeout = (callback, _delay) => {\n" +
                    "  callback();\n" +
                    "};"
        ).executeVoid()

        // Override WASM loading to use direct ByteArray approach
        runtime.getExecutor(
            "globalThis.readFileSync = function(filePath) {\n" +
                    "  console.log('readFileSync called for:', filePath);\n" +
                    "  return ideClient.readWasmFile(filePath);\n" +
                    "};\n" +
                    "// Override WebAssembly methods to use direct byte loading\n" +
                    "const originalInstantiateStreaming = globalThis.WebAssembly.instantiateStreaming;\n" +
                    "const originalCompileStreaming = globalThis.WebAssembly.compileStreaming; const originalInstantiate = globalThis.WebAssembly.instantiate; globalThis.WebAssembly.instantiate = function(module, imports) { const wasmImports = { env: { emscripten_get_now: globalThis.emscripten_get_now, ...((imports && imports.env) || {}) }, ...(imports || {}) }; return originalInstantiate(module, wasmImports); };\n" +
                    "globalThis.WebAssembly.instantiateStreaming = async function(source, imports) {\n" +
                    "  console.log('WebAssembly.instantiateStreaming called');\n" +
                    "  if (typeof source === 'string' && source.includes('.wasm')) {\n" +
                    "    const data = ideClient.readWasmFile(source);\n" +
                    "    const wasmImports = { env: { emscripten_get_now: globalThis.emscripten_get_now, ...((imports && imports.env) || {}) }, ...(imports || {}) }; return globalThis.WebAssembly.instantiate(data, wasmImports);\n" +
                    "  } else if (source && typeof source.then === 'function') {\n" +
                    "    const response = await source;\n" +
                    "    if (response && response.arrayBuffer) {\n" +
                    "      const buffer = await response.arrayBuffer();\n" +
                    "      const wasmImports2 = { env: { emscripten_get_now: globalThis.emscripten_get_now, ...((imports && imports.env) || {}) }, ...(imports || {}) }; return globalThis.WebAssembly.instantiate(buffer, wasmImports2);\n" +
                    "    }\n" +
                    "  }\n" +
                    "  return originalInstantiateStreaming(source, imports);\n" +
                    "};\n" +
                    "globalThis.WebAssembly.compileStreaming = async function(source) {\n" +
                    "  console.log('WebAssembly.compileStreaming called');\n" +
                    "  if (typeof source === 'string' && source.includes('.wasm')) {\n" +
                    "    const data = ideClient.readWasmFile(source);\n" +
                    "    return globalThis.WebAssembly.compile(data);\n" +
                    "  } else if (source && typeof source.then === 'function') {\n" +
                    "    const response = await source;\n" +
                    "    if (response && response.arrayBuffer) {\n" +
                    "      const buffer = await response.arrayBuffer();\n" +
                    "      return globalThis.WebAssembly.compile(buffer);\n" +
                    "    }\n" +
                    "  }\n" +
                    "  return originalCompileStreaming(source);\n" +
                    "};\n" +
                    "globalThis.fetch = async function(url) {\n" +
                    "  console.log('fetch called for:', url);\n" +
                    "  if (url.includes('.wasm')) {\n" +
                    "    const data = ideClient.readWasmFile(url);\n" +
                    "    return {\n" +
                    "      ok: true,\n" +
                    "      arrayBuffer: () => Promise.resolve(data)\n" +
                    "    };\n" +
                    "  }\n" +
                    "  throw new Error('fetch not implemented for non-WASM files');\n" +
                    "};"
        ).executeVoid()



        // Setup minimal process object for compatibility
        runtime.getExecutor(
            "globalThis.process = { \n" +
                    "  on: function() {}, \n" +
                    "  versions: undefined,\n" +
                    "  env: { NODE_ENV: 'production' }\n" +
                    "};\n" +
                    "globalThis.ENVIRONMENT_IS_NODE = false;\n" +
                    "// Provide Emscripten runtime functions\n" +
                    "globalThis.emscripten_get_now = function() {\n" +
                    "  return performance.now ? performance.now() : Date.now();\n" +
                    "};\n" +
                    "// Ensure performance.now exists\n" +
                    "if (!globalThis.performance) {\n" +
                    "  globalThis.performance = { now: () => Date.now() };\n" +
                    "};"
        ).executeVoid()

        runtime.getExecutor(
            "process.on('unhandledRejection', (reason, promise) => {\n" +
                    "    console.error('Unhandled Rejection at:'+ promise+ 'reason:'+ reason);\n" +
                    "    ideClient.unhandledRejection('' + reason);\n" +
                    "});"
        ).executeVoid()

        val cursorlessJs = javaClass.getResource("/cursorless/cursorless.js")?.readText()
        val module = runtime.getExecutor(cursorlessJs)
            .setResourceName("./cursorless.js")
            .compileV8Module()
        module.executeVoid()
        if (runtime.containsV8Module("./cursorless.js")) {
            logger.debug("./cursorless.js is registered as a module.")
        }

        val importJs = """
            import { activate, createPlugin, createIDE, createJetbrainsConfiguration } from './cursorless.js'; 
            console.log("activate: " + activate);
            console.log("ideClient: " + ideClient);
            globalThis.activate = activate;
            globalThis.createPlugin = createPlugin;
            globalThis.createIDE = createIDE;
            globalThis.createJetbrainsConfiguration = createJetbrainsConfiguration;
            """.trimIndent()
        runtime.getExecutor(importJs)
            .setModule(true)
            .setResourceName("./import.js")
            .executeVoid()
        eventLoop.await()


        val configuration = DEFAULT_CONFIGURATION
        val configurationJson = Json.encodeToString(configuration)
        val wasmPath = escapeString(wasmDir.absolutePath)

        val activateJs = """
            | ideClient.log("Cursorless/JS: activating plugin 1 with wasm path : " + '$wasmPath');
            | (async () => {    
            |   console.log("Cursorless/JS: activating plugin async");
            |   globalThis.configuration = globalThis.createJetbrainsConfiguration($configurationJson);
            |   console.log("Cursorless/JS: configuration created");
            |   globalThis.ide = globalThis.createIDE(ideClient, globalThis.configuration);
            |   console.log("Cursorless/JS: ide created");
            |   globalThis.plugin = createPlugin(ideClient, ide);
            |   console.log("Cursorless/JS: plugin created");
            |   // Provide WASM binary directly to avoid file loading issues
            |   const wasmBinary = ideClient.readWasmFile("$wasmPath/tree-sitter.wasm");
            |   console.log("Cursorless/JS: loaded WASM binary, size:", wasmBinary.length);
            |   if (typeof Parser !== 'undefined' && Parser.init) {
            |     await Parser.init({ wasmBinary: wasmBinary });
            |     console.log("Cursorless/JS: Parser initialized with direct WASM binary");
            |   }
            |   globalThis.engine = await globalThis.activate(plugin, "$wasmPath");
            |   console.log("Cursorless/JS: engine activated with WASM");
            | })();
            | """.trimMargin()
        logger.debug(activateJs)
        runtime.getExecutor(activateJs)
            .executeVoid()
        eventLoop.await()

    }

    private fun resolveWasmDir(): File {
        val pluginsDir = PathManager.getPluginsDir()
        logger.debug("idea.plugins.path: ${pluginsDir.absolutePathString()}")
        val wasmDir = pluginsDir
            .resolve(PLUGIN_ID)
            .resolve("extra/treesitter/wasm")
            .toFile()
        logger.debug("wasmDir: $wasmDir")
        if (!wasmDir.exists()) {
            logger.warn("wasmDir data dir does not exist: $wasmDir")
        }
        return wasmDir
    }

    private fun escapeString(rawString: String): String {
        return rawString
            .replace("\\", "\\\\")
            .replace("\n", "\\n")
            .replace("\t", "\\t")
            .replace("\"", "\\\"")
            .replace("\'", "\\'")
    }

    @Synchronized
    fun editorChanged(editorState: EditorState) {
        val json = Json.encodeToString(editorState)
        val js = """
            | (async () => {
            |   const ide = await globalThis.ide;
            |   if (ide) {
            |     try {
            |       ide.documentChanged(${json});
            |     } catch (e) {                      
            |       console.error("error in document changed - " + e);
            |       throw e;
            |     }
            |   } else {
            |     console.log("ide not available");
            |   }
            | })();
            | """.trimMargin()

        runtime.getExecutor(js)
            .executeVoid()
        eventLoop.await()

    }

    public fun dumpMemoryInfo() {
//        val v8SharedMemoryStatistics = runtime.v8SharedMemoryStatistics
//        println("v8SharedMemoryStatistics: $v8SharedMemoryStatistics")

        println("ref count: " + runtime.referenceCount)
        val v8HeapStatisticsFuture =
            runtime.getV8HeapStatistics()
        val v8HeapStatistics = v8HeapStatisticsFuture.join()
        val detailString = v8HeapStatistics.toString()
        System.out.printf("%s: %s%n", "1", detailString);
    }

    @Synchronized
    fun setCursorlessCallback(callback: CursorlessCallback) {
        ideClientCallback.cursorlessCallback = callback
    }

    @Synchronized
    fun execute(commands: List<JsonObject?>): ExecutionResult {
        var returnValue: JsonElement? = null
        var success = false
        var error: String? = null

        try {
            val json = Json.encodeToString(commands[0])
            logger.debug("command json $json")
            val js = """
            | console.log("Cursorless/JS: call runCommand");
            | try {
            | (async () => {
            |   const engine = await globalThis.engine;
            |   if (ide) {
            |     try {
            |       const response = await engine.commandApi.runCommand(${json});
            |       if (response.returnValue) {
            |         const respJson = JSON.stringify(response.returnValue);
            |         console.log("Cursorless/JS: response: " + respJson);
            |         return respJson;
            |       } else {
            |         return "";
            |       }
            |     } catch (e) {                      
            |       console.error("error in runCommand - " + e);
            |       throw e;
            |     }
            |   } else {
            |     console.log("cursorless engine not available");
            |   }
            | })();
            | } catch (e) {                      
            |   console.error("error in async runCommand - " + e);
            | //      throw e;
            | }
            | """.trimMargin()

            val callback = PromiseCallback()
            runtime.getExecutor(js)
                .execute<V8ValuePromise>().use { promise ->
                    promise.register(callback)
                    eventLoop.await()
                    success = callback.success
                    returnValue = callback.result
                    error = callback.error
                }
        } catch (e: Throwable) {
            logger.debug("error in execute - $e")
            return ExecutionResult(false, null, e.toString())
        }
        if (ideClientCallback.unhandledRejections.isNotEmpty()) {
            val joinedCause = ideClientCallback.unhandledRejections.joinToString(",")
            ideClientCallback.unhandledRejections.clear()
            return ExecutionResult(false, null, joinedCause)
        }
        logger.debug("returnValue: $returnValue")
        gc()
        dumpMemoryInfo()
        return ExecutionResult(success, returnValue, error)
    }

    @Synchronized
    fun close() {
        try {
            runtime.close(true)
        } catch (e: Throwable) {
            logger.info("error in close - $e")
        }
    }

    @Synchronized
    fun editorClosed(editorId: String) {
        if (runtime.isClosed) {
            return
        }
        val js = """
            | (async () => {
            |   const ide = await globalThis.ide;
            |   if (ide) {
            |     try {
            |       ide.documentClosed("$editorId");
            |     } catch (e) {                      
            |       console.error("error in document closed - " + e);
            |       throw e;
            |     }
            |   } else {
            |     console.log("ide not available");
            |   }
            | })();
            | """.trimMargin()
        runtime.getExecutor(js)
            .executeVoid()
        eventLoop.await()

    }

    @Synchronized
    fun editorCreated(editorState: EditorState) {
        val json = Json.encodeToString(editorState)
        val js = """
            | (async () => {
            |   const ide = await globalThis.ide;
            |   if (ide) {
            |     try {
            |       ide.documentCreated(${json});
            |     } catch (e) {                      
            |       console.error("Cursorless/JS: error in document changed - " + e);
            |       throw e;
            |     }
            |   } else {
            |     console.log("Cursorless/JS: ide not available");
            |   }
            | })();
            | """.trimMargin()

        runtime.getExecutor(js)
            .executeVoid()
        eventLoop.await()

    }

    fun setEnabledHatShapes(enabledHatShapes: List<String>) {
        val js = """
            | (async () => {
            |   const plugin = await globalThis.plugin;
            |   if (plugin) {
            |     try {
            |       plugin.hats.setEnabledHatShapes(${Json.encodeToString(enabledHatShapes)});
            |     } catch (e) {                      
            |       console.error("Cursorless/JS: error in setEnabledHatShapes - " + e);
            |       throw e;
            |     }
            |   } else {
            |     console.log("Cursorless/JS: plugin not available");
            |   }
            | })();
            | """.trimMargin()

        runtime.getExecutor(js)
            .executeVoid()
        eventLoop.await()
    }

    fun setHatShapePenalties(penalties: Map<String, Int>) {
        val js = """
            | (async () => {
            |   const plugin = await globalThis.plugin;
            |   if (plugin) {
            |     try {
            |       plugin.hats.setHatShapePenalties(${Json.encodeToString(penalties)});
            |     } catch (e) {                      
            |       console.error("Cursorless/JS: error in setHatShapePenalties - " + e);
            |       throw e;
            |     }
            |   } else {
            |     console.log("Cursorless/JS: plugin not available");
            |   }
            | })();
            | """.trimMargin()

        runtime.getExecutor(js)
            .executeVoid()
        eventLoop.await()
    }

    fun setEnabledHatColors(enabledHatColors: List<String>) {
        val js = """
            | (async () => {
            |   const plugin = await globalThis.plugin;
            |   if (plugin) {
            |     try {
            |       plugin.hats.setEnabledHatColors(${Json.encodeToString(enabledHatColors)});
            |     } catch (e) {                      
            |       console.error("Cursorless/JS: error in setEnabledHatColors - " + e);
            |       throw e;
            |     }
            |   } else {
            |     console.log("Cursorless/JS: plugin not available");
            |   }
            | })();
            | """.trimMargin()

        runtime.getExecutor(js)
            .executeVoid()
        eventLoop.await()
    }

    fun setHatColorPenalties(penalties: Map<String, Int>) {
        val js = """
            | (async () => {
            |   const plugin = await globalThis.plugin;
            |   if (plugin) {
            |     try {
            |       plugin.hats.setHatColorPenalties(${Json.encodeToString(penalties)});
            |     } catch (e) {                      
            |       console.error("Cursorless/JS: error in setHatColorPenalties - " + e);
            |       throw e;
            |     }
            |   } else {
            |     console.log("Cursorless/JS: plugin not available");
            |   }
            | })();
            | """.trimMargin()

        runtime.getExecutor(js)
            .executeVoid()
        eventLoop.await()
    }

    fun gc() {
        runtime.lowMemoryNotification()
    }

}

@Serializable
data class ExecutionResult(
    val success: Boolean,
    val returnValue: JsonElement?,
    val error: String?
)

@Serializable
data class ActionResponse(
    val returnValue: String?,
)

class PromiseCallback : IV8ValuePromise.IListener {

    var logger = logger<PromiseCallback>()

    var success: Boolean = false
    var result: JsonElement? = null
    var error: String? = null

    override fun onCatch(v8Value: V8Value?) {
        success = false
        if (v8Value is V8ValueError) {
            val v8ValueError = v8Value as V8ValueError
            logger.warn("error in execute - $v8ValueError")
        }
    }

    override fun onFulfilled(v8Value: V8Value?) {
        success = true
        if (v8Value == null) {
            return
        } else
            if (v8Value.isNullOrUndefined) {
                result = null
            } else if (v8Value is V8ValueString) {
                val v8String = v8Value as V8ValueString
                logger.debug("v8String: $v8String")
                if (v8String.value.isEmpty()) {
                    result = null
                } else {
                    val jsonElem = Json.decodeFromString<JsonElement>(v8String.value)
                    result = jsonElem
                }
            }
    }

    override fun onRejected(v8Value: V8Value?) {
        success = false
        if (v8Value is V8ValueError) {
            val v8ValueError = v8Value as V8ValueError
            logger.warn("error in execute - $v8ValueError")
            error = v8ValueError.message
        } else if (v8Value is V8ValueString) {
            val v8ValueString = v8Value as V8ValueString
            logger.warn("error in execute - $v8ValueString")
            error = v8ValueString.value
        }
    }
}