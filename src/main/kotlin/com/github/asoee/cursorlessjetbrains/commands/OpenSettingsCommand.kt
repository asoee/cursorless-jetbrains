package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.options.ShowSettingsUtil
import com.intellij.openapi.project.Project

class OpenSettingsCommand(project: Project, private val configurableId: String? = null) : VcCommand(project) {

    companion object {
        fun fromArgs(project: Project, args: List<String>): OpenSettingsCommand? {
            val configurableId = if (args.isNotEmpty()) args[0] else null
            return OpenSettingsCommand(project, configurableId)
        }
    }

    override fun executionMode(): ExecutionMode {
        return ExecutionMode.EDT
    }

    override fun invokeOnly(): Boolean {
        return true
    }

    override fun execute(context: CommandContext): String {
        if (configurableId != null) {
            ShowSettingsUtil.getInstance().showSettingsDialog(project, configurableId)
        } else {
            ShowSettingsUtil.getInstance().showSettingsDialog(project)
        }
        return "OK"
    }

    override fun toString(): String {
        return "OpenSettingsCommand(configurableId=$configurableId)"
    }


}