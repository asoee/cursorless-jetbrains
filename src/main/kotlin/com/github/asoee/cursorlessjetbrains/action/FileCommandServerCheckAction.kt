package com.github.asoee.cursorlessjetbrains.action

import com.github.asoee.cursorlessjetbrains.services.FileCommandServerService
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.components.service
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.progress.runBackgroundableTask
import com.intellij.openapi.project.Project
import com.intellij.openapi.project.ProjectManager
import com.intellij.openapi.wm.IdeFocusManager

class FileCommandServerCheckAction : AnAction() {

    private val logger = thisLogger()

    init {
        // Talon presses this action's shortcut for every command, so it must also run while a popup or dialog has
        // focus (e.g. a hover's documentation popup), as VS Code's command server does
        isEnabledInModalContext = true
    }

    override fun actionPerformed(e: AnActionEvent) {
        logger.info("FileCommandServerCheckAction triggered")
        // A popup's data context may have no project; fall back to the window it belongs to
        val project = e.project ?: lastFocusedProject()
        if (project == null) {
            logger.info("No project found command server check action")
            return
        }
        runBackgroundableTask("Talon command server", project) {
            service<FileCommandServerService>().commandServer.checkAndHandleFileRquest(project)
        }
    }

    private fun lastFocusedProject(): Project? {
        return IdeFocusManager.getGlobalInstance().lastFocusedFrame?.project
            ?: ProjectManager.getInstance().openProjects.singleOrNull()
    }
}
