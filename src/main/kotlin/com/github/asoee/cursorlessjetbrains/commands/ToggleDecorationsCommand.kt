package com.github.asoee.cursorlessjetbrains.commands

import com.github.asoee.cursorlessjetbrains.settings.HatsToggle
import com.intellij.openapi.project.Project

/**
 * VS Code's cursorless.toggleDecorations: turns the hats off in every editor, or back on, for this session. The engine
 * drops the hats too, so a hidden hat can't be used.
 */
class ToggleDecorationsCommand(project: Project) : VcCommand(project) {

    companion object {
        fun fromArgs(project: Project, @Suppress("UNUSED_PARAMETER") args: List<String>): ToggleDecorationsCommand {
            return ToggleDecorationsCommand(project)
        }
    }

    override fun execute(context: CommandContext): String {
        HatsToggle.toggle()
        return "OK"
    }
}
