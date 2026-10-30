package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.project.Project

/**
 * Accepts a command Talon sends for bookkeeping only, e.g. cursorless.documentationOpened, so it doesn't fail as unknown.
 */
class NoOpCommand(project: Project) : VcCommand(project) {

    companion object {
        fun fromArgs(project: Project, @Suppress("UNUSED_PARAMETER") args: List<String>): NoOpCommand {
            return NoOpCommand(project)
        }
    }

    override fun executionMode(): ExecutionMode {
        return ExecutionMode.BACKGROUND
    }

    override fun execute(context: CommandContext): String {
        return "OK"
    }
}
