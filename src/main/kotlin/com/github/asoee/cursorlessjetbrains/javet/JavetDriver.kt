package com.github.asoee.cursorlessjetbrains.javet

import com.caoccao.javet.interop.V8Host
import com.caoccao.javet.interop.V8Runtime
import com.caoccao.javet.interop.options.NodeRuntimeOptions
import com.caoccao.javet.javenode.JNEventLoop
import com.caoccao.javet.javenode.enums.JNModuleType
import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessCallback
import com.github.asoee.cursorlessjetbrains.cursorless.DEFAULT_CIONFIGURATION
import com.github.asoee.cursorlessjetbrains.cursorless.TreesitterCallback
import com.github.asoee.cursorlessjetbrains.sync.EditorState
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import java.io.File
import java.nio.file.Files


class JavetDriver {

    private val ideClientCallback = IdeClientCallback()
    val runtime: V8Runtime
    val eventLoop: JNEventLoop
    val wasmDir = Files.createTempDirectory("cursorless-treesitter-wasm").toFile()

    init {
        println("ASOEE: JavetDriver create")
        val icuDataDir = Files.createTempDirectory("cursorless-icu").toFile()
        println("icuDataDir: " + icuDataDir)
        icuDataDir.deleteOnExit()
        val outFile = File(icuDataDir, "icudtl.dat")
        outFile.outputStream().use { out ->
            javaClass.getResourceAsStream("/icu/icudtl.dat").copyTo(out)
        }

        NodeRuntimeOptions.NODE_FLAGS.setIcuDataDir(icuDataDir.absolutePath)
        runtime = V8Host.getNodeI18nInstance()
            .createV8Runtime<V8Runtime>()
        eventLoop = JNEventLoop(runtime)
    }

    fun loadTreesitterLanguages(): File {

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

    fun saveFileFromClasspath(resourcePath: String, outputFile: File) {
        val inputStream = javaClass.getResourceAsStream(resourcePath)
            ?: throw IllegalArgumentException("Resource not found: $resourcePath")
        inputStream.use { input ->
            Files.copy(input, outputFile.toPath())
        }
        println("ASOEE: saved file: ${outputFile.absolutePath}")
    }

    private class ClassPathQuerLoader : TreesitterCallback {
        val queryPrefix = "/cursorless/queries/"
        override fun readQuery(fileName: String): String? {
            val queryContents = javaClass.getResource(queryPrefix + fileName)?.readText()
            return queryContents
        }
    }

    fun loadCursorless() {

        val wasmDir = loadTreesitterLanguages()
        this.ideClientCallback.treesitterCallback = ClassPathQuerLoader()

        runtime.createV8ValueObject().use { v8ValueObject ->
            runtime.globalObject.set("ideClient", v8ValueObject)
            v8ValueObject.bind(ideClientCallback)
        }

        eventLoop.loadStaticModules(JNModuleType.Console, JNModuleType.Timers)

        runtime.getExecutor(
            "process.on('unhandledRejection', (reason, promise) => {\n" +
                    "    console.error('Unhandled Rejection at:'+ promise+ 'reason:'+ reason);\n" +
                    "    ideClient.unhandledRejection('' + reason);\n" +
                    "});"
        ).executeVoid()

        val cursorlessJs = javaClass.getResource("/cursorless/cursorless.js").readText()
        val module = runtime.getExecutor(cursorlessJs)
            .setResourceName("./cursorless.js")
            .compileV8Module()
        module.executeVoid()
        if (runtime.containsV8Module("./cursorless.js")) {
            System.out.println("./cursorless.js is registered as a module.")
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

        val configuration = DEFAULT_CIONFIGURATION
        val configurationJson = Json.encodeToString(configuration)
        val wasmPath = wasmDir.absolutePath

        val activateJs = """
            | ideClient.log("ASOEE/JS: activating plugin 1");
            | (async () => {    
            |   console.log("ASOEE/JS: activating plugin async");
            |   globalThis.configuration = globalThis.createJetbrainsConfiguration($configurationJson);
            |   globalThis.ide = globalThis.createIDE(ideClient, globalThis.configuration);
            |   console.log("ASOEE/JS: ide created");
            |   globalThis.plugin = createPlugin(ideClient, ide);
            |   console.log("ASOEE/JS: plugin created");
            |   globalThis.engine = await globalThis.activate(plugin, "$wasmPath/");
            |   console.log("ASOEE/JS: plugin activated");
            | })();
            | ideClient.log("ASOEE/JS: after async");
            | """.trimMargin()
        runtime.getExecutor(activateJs)
            .executeVoid()
        eventLoop.await()

    }


    fun editorChanged(editorState: EditorState) {
        val json = Json.encodeToString(editorState)
        val js = """
            | console.log("ASOEE/JS: call document changed");
            | (async () => {
            |   console.log("ASOEE/JS: async document changed");
            |   const ide = await globalThis.ide;
            |   if (ide) {
            |     console.log("ASOEE/JS: ide document changed");
            |     try {
            |       ide.documentChanged(${json});
            |       console.log("ASOEE/JS: async document change completed");
            |     } catch (e) {                      
            |       console.error("ASOEE/JS: error in document changed - " + e);
            |       throw e;
            |     }
            |   } else {
            |     console.log("ASOEE/JS: ide not available");
            |   }
            | })();
            | """.trimMargin()

        runtime.getExecutor(js)
            .executeVoid()
        eventLoop.await()

    }

    fun setCursorlessCallback(callback: CursorlessCallback) {
        ideClientCallback.cursorlessCallback = callback
    }

    fun execute(commands: List<JsonObject?>): ExecutionResult {

        try {

            val json = Json.encodeToString(commands[0]).toString()
            val js = """
            | console.log("ASOEE/JS: call runCommand");
            | try {
            | (async () => {
            |   console.log("ASOEE/JS: async runCommand");
            |   const engine = await globalThis.engine;
            |   if (ide) {
            |     console.log("ASOEE/JS: ide document changed");
            |     try {
            |       engine.commandApi.runCommand(${json});
            |       console.log("ASOEE/JS: async runCommand completed");
            |     } catch (e) {                      
            |       console.error("ASOEE/JS: error in runCommand - " + e);
            | //      throw e;
            |     }
            |   } else {
            |     console.log("ASOEE/JS: engine not available");
            |   }
            | })();
            | } catch (e) {                      
            |   console.error("ASOEE/JS: error in async runCommand - " + e);
            | //      throw e;
            | }
            | """.trimMargin()

            runtime.getExecutor(js)
                .executeVoid()
            eventLoop.await()
        } catch (e: Throwable) {
            println("ASOEE/JS: error in execute - " + e)
            return ExecutionResult(false, null, e.toString())
        }
        if (!ideClientCallback.unhandledRejections.isEmpty()) {
            val joinedCause = ideClientCallback.unhandledRejections.joinToString(",")
            ideClientCallback.unhandledRejections.clear()
            return ExecutionResult(false, null, joinedCause)
        }
        return ExecutionResult(true, null, null)

    }

    fun close() {
        try {
            runtime.close(false)
        } catch (e: Throwable) {
            println("ASOEE/JS: error in close - " + e)
        }
    }

    fun editorClosed(editorId: String) {
        val js = """
            | (async () => {
            |   const ide = await globalThis.ide;
            |   if (ide) {
            |     console.log("ASOEE/JS: ide document closed");
            |     try {
            |       ide.documentClosed("${editorId}");
            |       console.log("ASOEE/JS: async document closed completed");
            |     } catch (e) {                      
            |       console.error("ASOEE/JS: error in document closed - " + e);
            |       throw e;
            |     }
            |   } else {
            |     console.log("ASOEE/JS: ide not available");
            |   }
            | })();
            | """.trimMargin()
        runtime.getExecutor(js)
            .executeVoid()
        eventLoop.await()

    }

    fun editorCreated(editorState: EditorState) {
        val json = Json.encodeToString(editorState)
        val js = """
            | (async () => {
            |   const ide = await globalThis.ide;
            |   if (ide) {
            |     try {
            |       ide.documentCreated(${json});
            |     } catch (e) {                      
            |       console.error("ASOEE/JS: error in document changed - " + e);
            |       throw e;
            |     }
            |   } else {
            |     console.log("ASOEE/JS: ide not available");
            |   }
            | })();
            | """.trimMargin()

        runtime.getExecutor(js)
            .executeVoid()
        eventLoop.await()

    }

}

data class ExecutionResult(
    val success: Boolean,
    val returnValue: String?,
    val error: String?
)

data class CommandV7(
    val version: Int = 7,
    val spokenFormat: String?,
    val usePrePhraseSnapshot: Boolean,
    val action: ActionDescriptor
)


sealed interface ActionDescriptor

data class SimpleActionDescriptor(
    val name: SimpleActionName,
    val target: PartialTargetDescriptor
) : ActionDescriptor


typealias SimpleActionName = String

val setSelection: SimpleActionName = "setSelection"

sealed interface PartialTargetDescriptor

data class PartialPrimitiveTargetDescriptor(
    val type: String = "primitive",
//    val mark: PartialMark?,
//    val modifiers: Modifier[]?;
)