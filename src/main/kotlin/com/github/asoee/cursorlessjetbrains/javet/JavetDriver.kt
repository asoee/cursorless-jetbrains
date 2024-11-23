package com.github.asoee.cursorlessjetbrains.javet

import com.caoccao.javet.interop.V8Host
import com.caoccao.javet.interop.V8Runtime
import com.caoccao.javet.interop.options.NodeRuntimeOptions
import com.caoccao.javet.javenode.JNEventLoop
import com.caoccao.javet.javenode.enums.JNModuleType
import com.caoccao.javet.utils.JavetOSUtils
import com.github.asoee.cursorlessjetbrains.cursorless.HatUpdateCallback
import com.github.asoee.cursorlessjetbrains.sync.EditorState
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File


class JavetDriver() {

    private val ideClientCallback = IdeClientCallback()
    public val runtime: V8Runtime
    val eventLoop : JNEventLoop


    init {
        println("ASOEE: JavetDriver create")
        val icuDataDir: File = File(JavetOSUtils.WORKING_DIRECTORY)
            .toPath()
            .resolve("./icu")
            .normalize()
            .toFile()
        println("icuDataDir: " + icuDataDir)
        NodeRuntimeOptions.NODE_FLAGS.setIcuDataDir(icuDataDir.getAbsolutePath());
        runtime = V8Host.getNodeI18nInstance()
            .createV8Runtime<V8Runtime>()
        eventLoop = JNEventLoop(runtime)
    }

    public fun loadCursorless() {

        runtime.createV8ValueObject().use { v8ValueObject ->
            runtime.getGlobalObject().set("ideClient", v8ValueObject)
            v8ValueObject.bind(ideClientCallback)
        }

        eventLoop.loadStaticModules(JNModuleType.Console, JNModuleType.Timers);

        val cursorlessJs = javaClass.getResource("/cursorless/cursorless.js").readText()
        val module = runtime.getExecutor(cursorlessJs)
            .setResourceName("./cursorless.js")
            .compileV8Module()
        module.executeVoid();
        if (runtime.containsV8Module("./cursorless.js")) {
            System.out.println("./cursorless.js is registered as a module.");
        }

        val importJs = """
            import { activate, createPlugin, createIDE } from './cursorless.js'; 
            console.log("activate: " + activate);
            console.log("ideClient: " + ideClient);
            globalThis.activate = activate;
            globalThis.createPlugin = createPlugin;
            globalThis.createIDE = createIDE;
            """.trimIndent()
        runtime.getExecutor(importJs)
            .setModule(true)
            .setResourceName("./import.js")
            .executeVoid();
        eventLoop.await();

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
            | })();
            | ideClient.log("ASOEE/JS: after async");
            | """.trimMargin()
        runtime.getExecutor(activateJs)
            .executeVoid();
        eventLoop.await();

    }


    fun editorChanged(editorState: EditorState) {
        val json = Json.encodeToString(editorState).toString()
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
            .executeVoid();
        eventLoop.await();

    }

    fun setHatUpdateCallback(callback: HatUpdateCallback) {
        ideClientCallback.hatUpdateCallback = callback
    }

}
