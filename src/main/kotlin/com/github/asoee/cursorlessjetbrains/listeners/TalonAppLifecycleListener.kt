package com.github.asoee.cursorlessjetbrains.listeners

import com.dokar.quickjs.QuickJs
import com.dokar.quickjs.binding.define
import com.github.asoee.cursorlessjetbrains.graaljs.GraalJSDriver
import com.github.asoee.cursorlessjetbrains.services.Console
import com.github.asoee.cursorlessjetbrains.services.IdeClient
import com.intellij.ide.AppLifecycleListener
import com.intellij.openapi.diagnostic.thisLogger
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking

class TalonAppLifecycleListener : AppLifecycleListener {


    private var jsDriver: GraalJSDriver? = null

    override fun appFrameCreated(commandLineArgs: List<String>) {
        super.appFrameCreated(commandLineArgs)
        println("PHIL: appFrameCreated...")
    }

    override fun appStarted() {
        super.appStarted()
        println("PHIL: app started, loading quickjs...")
        this.jsDriver = GraalJSDriver()
        println("PHIL: app started...")
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
