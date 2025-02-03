package com.github.asoee.cursorlessjetbrains.action

import com.github.asoee.cursorlessjetbrains.services.FileCommandServerService
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.components.service
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.progress.runBackgroundableTask

class FileCommandServerCheckAction : AnAction() {

    private val logger = thisLogger()

    override fun actionPerformed(e: AnActionEvent) {
        logger.info("FileCommandServerCheckAction triggered")
        if (e.project == null) {
            logger.info("No project found command server check action")
            return
        }
        runBackgroundableTask("Talon command server", e.project) {
            service<FileCommandServerService>().commandServer.checkAndHandleFileRquest(e.project!!)
        }
    }
}