package com.github.asoee.cursorlessjetbrains.commands

import com.github.asoee.cursorlessjetbrains.tutorial.CursorlessTutorial
import com.intellij.openapi.components.service
import com.intellij.openapi.project.Project

/** Talon's "bar cursorless" (cursorless.showSidebar): reveals the Cursorless tool window */
class ShowSidebarCommand(project: Project) : VcCommand(project) {

    companion object {
        fun fromArgs(project: Project, @Suppress("UNUSED_PARAMETER") args: List<String>): ShowSidebarCommand {
            return ShowSidebarCommand(project)
        }
    }

    override fun executionMode(): ExecutionMode {
        return ExecutionMode.BACKGROUND
    }

    override fun execute(context: CommandContext): String {
        project.service<CursorlessTutorial>().reveal(showTutorial = false)
        return "OK"
    }
}
