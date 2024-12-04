package com.github.asoee.cursorlessjetbrains.listeners

import com.github.asoee.cursorlessjetbrains.commands.CommandRegistryService
import com.github.asoee.cursorlessjetbrains.commandserver.http.HttpCommandServer
import com.github.asoee.cursorlessjetbrains.services.FileCommandServerService
import com.intellij.ide.AppLifecycleListener
import com.intellij.openapi.components.service

class TalonAppLifecycleListener : AppLifecycleListener {


    override fun appFrameCreated(commandLineArgs: List<String>) {
        super.appFrameCreated(commandLineArgs)
        println("PHIL: appFrameCreated...")
    }

    private val httpCommandServer: HttpCommandServer
        get() {
            val httpCommandServer = HttpCommandServer()
            return httpCommandServer
        }

    override fun appStarted() {
        super.appStarted()
        println("PHIL: app started")

        httpCommandServer.start()
        val registry = service<CommandRegistryService>()
        registry.registerInternalCommands()

        val fileCommandServerService = service<FileCommandServerService>()
        if (fileCommandServerService != null ) {
            println("File command server service ready...")
        }

        println("PHIL: app started...")
    }


    override fun appClosing() {
        println("PHIL: app closing...")
        super.appClosing()
        httpCommandServer.stop()
    }

    override fun appWillBeClosed(isRestart: Boolean) {
        println("PHIL: app closed...")
        super.appWillBeClosed(isRestart)
    }
}
