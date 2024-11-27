package com.github.asoee.cursorlessjetbrains.action

import com.github.asoee.cursorlessjetbrains.services.FileCommandServerService
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.components.service

class FileCommandServerCheckAction : AnAction() {

    override fun actionPerformed(e: AnActionEvent) {
        println("FileCommandServerCheckAction triggered")
        service<FileCommandServerService>().commandServer.checkAndHandleFileRquest()
    }
}