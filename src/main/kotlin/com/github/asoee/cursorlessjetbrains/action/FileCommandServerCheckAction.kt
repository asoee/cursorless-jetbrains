package com.github.asoee.cursorlessjetbrains.action

import com.github.asoee.cursorlessjetbrains.services.FileCommandServerService
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.components.service
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.progress.runBackgroundableTask

class FileCommandServerCheckAction : AnAction() {

    val LOG = thisLogger()

    override fun actionPerformed(e: AnActionEvent) {
        LOG.info("FileCommandServerCheckAction triggered")
        runBackgroundableTask("Talon command server", e.project) {
            service<FileCommandServerService>().commandServer.checkAndHandleFileRquest()
        }
    }
}