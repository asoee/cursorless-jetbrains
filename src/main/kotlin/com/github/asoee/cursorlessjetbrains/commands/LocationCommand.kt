package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.editor.Editor
import com.intellij.openapi.project.Project

class LocationCommand(project: Project) : VcCommand(project) {

    companion object {
        fun fromArgs(project: Project, args: List<String>): LocationCommand {
            return LocationCommand(project)
        }
    }

    override fun readonly(): Boolean {
        return true
    }

    override fun execute(context: CommandContext): String {
        val e = arrayOfNulls<Editor>(1)
        e[0] = context.editor
        val logicalPosition = e[0]!!.caretModel.logicalPosition
        return String.format("%d %d", logicalPosition.line + 1, logicalPosition.column + 1)
    }
}
