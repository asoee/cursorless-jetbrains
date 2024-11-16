package com.github.asoee.cursorlessjetbrains.listeners

import com.dokar.quickjs.QuickJs
import com.dokar.quickjs.binding.define
import com.github.asoee.cursorlessjetbrains.services.Console
import com.github.asoee.cursorlessjetbrains.services.IdeClient
import com.intellij.ide.AppLifecycleListener
import com.intellij.openapi.diagnostic.thisLogger
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking

class TalonAppLifecycleListener : AppLifecycleListener {


    private var quickJs: QuickJs? = null

    override fun appFrameCreated(commandLineArgs: List<String>) {
        super.appFrameCreated(commandLineArgs)
        println("PHIL: appFrameCreated...")
    }

    override fun appStarted() {
        super.appStarted()
        println("PHIL: app started, loading quickjs...")
        val quickJs =  QuickJs.create(Dispatchers.Default)
        runBlocking {
            initCursorless(quickJs)
        }
        this.quickJs = quickJs
        println("PHIL: app started...")
    }

    private suspend fun initCursorless(quickJs: QuickJs) {
//        val nodeShimJs = javaClass.getResource("/cursorless/node-shim.js").readText()
//        thisLogger().warn("compile...")

//        thisLogger().warn("evaluate (node-shim)...")
//        quickJs.evaluate<Void>(code = nodeShimJs, asModule = false, )

        val talonJs = javaClass.getResource("/cursorless/cursorless.js").readText()
        thisLogger().warn("talon js script size: " + talonJs.length)

        val cursorlessBc = quickJs.compile(talonJs, "cursorless.js", true)
        thisLogger().warn("addmodule (cursorless)...")
        quickJs.addModule(bytecode = cursorlessBc)
//        quickJs.evaluate<Void>(cursorlessBc)

        quickJs.define<Console>("console", Console())
        quickJs.define<IdeClient>("ideClient", IdeClient())

//        thisLogger().warn("import entry")
        quickJs.evaluate<Void>(code = "const {activate, createPlugin} = await import('./cursorless.js');")
        thisLogger().warn("create plugin")
        quickJs.evaluate<Any>(code = "const plugin = createPlugin(ideClient);")
        thisLogger().warn("exec activate")
        quickJs.evaluate<Any>(code = "const { commandApi, injectIde, hatTokenMap, storedTargets } = await activate(plugin);")
        thisLogger().warn("exec activated")
        quickJs.evaluate<Any>(code = "console.log('' + (injectIde === null));")
        thisLogger().warn("done")
    }


    override fun appClosing() {
        println("PHIL: app closing...")
        super.appClosing()
    }

    override fun appWillBeClosed(isRestart: Boolean) {
        println("PHIL: app closed...")
        super.appWillBeClosed(isRestart)
    }
}
