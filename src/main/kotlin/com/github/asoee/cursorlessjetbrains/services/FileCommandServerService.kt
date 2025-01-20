package com.github.asoee.cursorlessjetbrains.services

import com.github.asoee.cursorlessjetbrains.commandserver.file.FileCommandServer
import com.intellij.openapi.Disposable

class FileCommandServerService : Disposable {

    val commandServer = FileCommandServer()

    override fun dispose() {
//        fileCommandServer.stop()
    }
}
