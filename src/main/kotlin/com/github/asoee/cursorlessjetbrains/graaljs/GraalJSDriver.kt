package com.github.asoee.cursorlessjetbrains.graaljs

import com.github.asoee.cursorlessjetbrains.services.Console
import com.oracle.truffle.js.lang.JavaScriptLanguage
import org.graalvm.polyglot.Context
import org.graalvm.polyglot.Source
import org.graalvm.polyglot.Value
import org.graalvm.polyglot.io.IOAccess

class GraalJSDriver() {

    private val context: Context
    private val ideClientCallback = IdeClientCallback()
    private val commandServerCallback = CommandServerCallback()

    init {
        val context = Context.newBuilder("js")
            .allowIO(IOAccess.ALL)
            .allowExperimentalOptions(true)
            .option("js.esm-eval-returns-exports", "true")
            .build()

        val talonJs = javaClass.getResource("/cursorless/cursorless.js").readText()

        val globalassignment = """
                | globalThis.activate = activate;
                | globalThis.createPlugin = createPlugin;
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
        context.getBindings("js").putMember("commandServer", commandServerCallback)
//        context.getBindings("js").putMember("console", Console())

        val activateJs = """
                | (async () => {
                |   var plugin = createPlugin(ideClient, commandServer)
                |   globalThis.engine = await globalThis.activate(plugin)
                | });
                | """.trimMargin()

        val activate = Source.newBuilder("js", activateJs, "eval.js")
            .build()
        val result3 = context.eval(activate)

        return null
    }

    suspend fun evaluate(js: String): Value? {
        val source = Source.newBuilder("js", js, "eval.js").build()
        val result = context.eval(source)
        return result
    }


}