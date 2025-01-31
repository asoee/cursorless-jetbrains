package com.github.asoee.cursorlessjetbrains.services

import com.github.asoee.cursorlessjetbrains.commandserver.http.HttpCommandServer
import com.intellij.openapi.Disposable
import com.intellij.openapi.components.Service

@Service(Service.Level.APP)
class HttpCommandServerService : Disposable {

    val commandServer = HttpCommandServer()

    init {
        commandServer.start()
    }

    override fun dispose() {
        commandServer.stop()
    }
}
