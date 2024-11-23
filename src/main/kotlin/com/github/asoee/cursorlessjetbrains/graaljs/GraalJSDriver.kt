package com.github.asoee.cursorlessjetbrains.graaljs

import com.github.asoee.cursorlessjetbrains.services.Console
import com.github.asoee.cursorlessjetbrains.sync.EditorState
import com.oracle.truffle.js.lang.JavaScriptLanguage
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.graalvm.polyglot.Context
import org.graalvm.polyglot.HostAccess
import org.graalvm.polyglot.Source
import org.graalvm.polyglot.Value

class GraalJSDriver() {

    private val context: Context
    private val ideClientCallback = IdeClientCallback()
    private val commandServerCallback = CommandServerCallback()

    init {
        val context = Context.newBuilder("js")
//            .allowIO(IOAccess.ALL)
            .allowHostAccess(HostAccess.ALL)
            .allowExperimentalOptions(true)
            .option("engine.WarnInterpreterOnly", "false")
            .option("js.esm-eval-returns-exports", "true")
            .option("js.unhandled-rejections", "warn")
            .option("js.v8-compat", "true")
            .build()

        val talonJs = javaClass.getResource("/cursorless/cursorless.js").readText()

        val globalassignment = """
                | globalThis.activate = activate;
                | globalThis.createPlugin = createPlugin;
                | globalThis.createIDE = createIDE;
                | """.trimMargin()

        val moduleLoad = talonJs + globalassignment
        val source = Source.newBuilder("js", moduleLoad, "cursorless.js")
            .mimeType(JavaScriptLanguage.MODULE_MIME_TYPE)
            .build()
        val result = context.eval(source)

        this.context = context
        println("ASOEE: GraalJSDriver created")

    }

    suspend fun loadCursorless(): Value? {

        context.getBindings("js").putMember("ideClient", ideClientCallback)
//        context.getBindings("js").putMember("commandServer", commandServerCallback)
        context.getBindings("js").putMember("console", Console())

        val activateJs = """
            | ideClient.log("ASOEE/JS: activating plugin 1");
            | (async () => {
            |   console.log("ASOEE/JS: activating plugin async");
            |   globalThis.ide = globalThis.createIDE(ideClient);
            |   console.log("ASOEE/JS: ide created");
            |   globalThis.plugin = createPlugin(ideClient, ide);
            |   console.log("ASOEE/JS: plugin created");
            |   globalThis.engine = await globalThis.activate(plugin);
            |   console.log("ASOEE/JS: plugin activated");
            | });
            | """.trimMargin()

        val activate = Source.newBuilder("js", activateJs, "eval.js")
            .build()
        val result3 = context.eval(activate)
        println(result3.metaObject)
        val asyncExecResult = result3.execute()
        println(asyncExecResult.metaObject)

        return null
    }

    suspend fun loadTimeout(): Value? {

        val activateJs = """
            | import { setTimeout } from "node:timers";
            | """.trimMargin()

        val activate = Source.newBuilder("js", activateJs, "eval.js")
            .mimeType(JavaScriptLanguage.MODULE_MIME_TYPE)
            .build()
        val result3 = context.eval(activate)
        println(result3.metaObject)
        val asyncExecResult = result3.execute()
        println(asyncExecResult.metaObject)

        return null
    }

    suspend fun evaluate(js: String): Value? {
        val source = Source.newBuilder("js", js, "eval.js").build()
        val promise = context.eval(source)
//        val jsPromise = context.eval(activate)
//        return result
        return promise
    }

    fun editorChanged(editorState: EditorState) {
        val json = Json.encodeToString(editorState).toString()
        val js = """
            |   console.log("ASOEE/JS: call document changed");
            | (async () => {
            |   console.log("ASOEE/JS: async document changed");
            |   const ide = await globalThis.ide;
            |   if (ide) {
            |     console.log("ASOEE/JS: ide document changed");
            |     try {
            |       ide.documentChanged(${json});
            |       console.log("ASOEE/JS: async document change completed");
            |     } catch (e) {                      
            |       console.error("ASOEE/JS: error in document changed", e);
            |     }
            |   } else {
            |     console.log("ASOEE/JS: ide not available");
            |   }
            | });
            | """.trimMargin()

        val activate = Source.newBuilder("js", js, "eval.js")
            .build()
        val jsPromise = context.eval(activate)
        jsPromise.executeVoid()

    }


}