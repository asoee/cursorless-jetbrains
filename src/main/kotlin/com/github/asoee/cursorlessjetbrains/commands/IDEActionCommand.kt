package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.actionSystem.*
import com.intellij.openapi.actionSystem.ex.ActionUtil
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.playback.commands.ActionCommand
import com.intellij.openapi.wm.ToolWindow
import java.awt.Component


class IDEActionCommand(project: Project, private val actionId: String) : VcCommand(project) {

    companion object {
        fun fromArgs(project: Project, args: List<String>): IDEActionCommand {
            val actionId = args[0]
            return IDEActionCommand(project, actionId)
        }

        val readonlyActions = listOf(IdeActions.ACTION_SHOW_INTENTION_ACTIONS)
        val writeActions = listOf<String>()
    }

    val action: AnAction

    init {
        action = ActionManager.getInstance().getAction(actionId)
    }

    override fun executionMode(): ExecutionMode {
        if (readonlyActions.contains(actionId)) {
            return ExecutionMode.READ
        } else if (writeActions.contains(actionId)) {
            return ExecutionMode.WRITE
        } else {
            return ExecutionMode.EDT
        }
    }

    private fun findComponent(context: CommandContext): Component? {
        val e: ToolWindow? = context.toolWindow
        var component: Component? = null
        if (e != null) {
            component = e.component
        }
        if (component == null) {
            component = context.editor?.contentComponent
        }
        return component
    }

    override fun execute(context: CommandContext): String {
        val component = findComponent(context)

        ActionManager.getInstance()
            .tryToExecute(action, null, component, ActionPlaces.UNKNOWN, true)
        return "OK"
    }
}
