package com.github.asoee.cursorlessjetbrains.javet

import com.caoccao.javet.interop.V8Host
import com.caoccao.javet.interop.V8Runtime
import com.caoccao.javet.interop.options.NodeRuntimeOptions
import com.caoccao.javet.javenode.JNEventLoop
import com.caoccao.javet.javenode.enums.JNModuleType
import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessCallback
import com.github.asoee.cursorlessjetbrains.cursorless.DEFAULT_CONFIGURATION
import com.github.asoee.cursorlessjetbrains.cursorless.TreesitterCallback
import com.github.asoee.cursorlessjetbrains.sync.EditorState
import com.intellij.openapi.diagnostic.logger
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import java.io.File
import java.nio.file.Files


open class JavetDriver {

    private val logger = logger<JavetDriver>()
    private val ideClientCallback = IdeClientCallback()
    val runtime: V8Runtime
    val eventLoop: JNEventLoop
    private val wasmDir: File = Files.createTempDirectory("cursorless-treesitter-wasm").toFile()

    init {
        val icuDataDir = Files.createTempDirectory("cursorless-icu").toFile()
        logger.debug("icuDataDir: $icuDataDir")
        icuDataDir.deleteOnExit()
        val outFile = File(icuDataDir, "icudtl.dat")
        outFile.outputStream().use { out ->
            javaClass.getResourceAsStream("/icu/icudtl.dat")?.copyTo(out)
                ?: throw IllegalArgumentException("Resource not found: /icu/icudtl.dat")
        }

        NodeRuntimeOptions.NODE_FLAGS.setIcuDataDir(icuDataDir.absolutePath)
        runtime = V8Host.getNodeI18nInstance()
            .createV8Runtime()
        eventLoop = JNEventLoop(runtime)
    }

    private fun loadTreesitterLanguages(): File {

        saveFileFromClasspath("/cursorless/wasm/tree-sitter.wasm", File(wasmDir, "tree-sitter.wasm"))

        val languages =
            listOf(
                "agda",
                "c",
                "c-sharp",
                "clojure",
                "cpp",
                "css",
                "dart",
                "elixir",
                "elm",
                "gleam",
                "go",
                "haskell",
                "hcl",
                "html",
                "java",
                "javascript",
                "json",
                "julia",
                "kotlin",
                "latex",
                "lua",
                "markdown",
                "nix",
                "perl",
                "php",
                "python",
                "query",
                "regex",
                "ruby",
                "rust",
                "scala",
                "scss",
                "sparql",
                "swift",
                "talon",
                "tsx",
                "typescript",
                "xml",
                "yaml"
            )
        languages.forEach { language ->
            saveFileFromClasspath(
                "/cursorless/wasm/tree-sitter-$language.wasm",
                File(wasmDir, "tree-sitter-$language.wasm")
            )
        }
        return wasmDir
    }

    private fun saveFileFromClasspath(resourcePath: String, outputFile: File) {
        val inputStream = javaClass.getResourceAsStream(resourcePath)
            ?: throw IllegalArgumentException("Resource not found: $resourcePath")
        inputStream.use { input ->
            Files.copy(input, outputFile.toPath())
        }
        println("ASOEE: saved file: ${outputFile.absolutePath}")
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

        val wasmDir = loadTreesitterLanguages()
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
            |   globalThis.ide = globalThis.createIDE(ideClient, globalThis.configuration);
            |   console.log("Cursorless/JS: ide created");
            |   globalThis.plugin = createPlugin(ideClient, ide);
            |   console.log("Cursorless/JS: plugin created");
            |   globalThis.engine = await globalThis.activate(plugin, "$wasmPath");
            |   console.log("Cursorless/JS: plugin activated");
            | })();
            | """.trimMargin()
        logger.debug(activateJs)
        runtime.getExecutor(activateJs)
            .executeVoid()
        eventLoop.await()

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
        val v8SharedMemoryStatistics = runtime.v8SharedMemoryStatistics
        println("v8SharedMemoryStatistics: $v8SharedMemoryStatistics")

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
            |       engine.commandApi.runCommand(${json});
            |     } catch (e) {                      
            |       console.error("error in runCommand - " + e);
            | //      throw e;
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

            runtime.getExecutor(js)
                .executeVoid()
            eventLoop.await()
        } catch (e: Throwable) {
            logger.debug("error in execute - $e")
            return ExecutionResult(false, null, e.toString())
        }
        if (ideClientCallback.unhandledRejections.isNotEmpty()) {
            val joinedCause = ideClientCallback.unhandledRejections.joinToString(",")
            ideClientCallback.unhandledRejections.clear()
            return ExecutionResult(false, null, joinedCause)
        }
        return ExecutionResult(true, null, null)

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
    val returnValue: String?,
    val error: String?
)
