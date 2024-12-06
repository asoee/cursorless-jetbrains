package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.actionSystem.ActionManager
import com.intellij.openapi.actionSystem.ActionPlaces
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.IdeActions
import com.intellij.openapi.ui.playback.commands.ActionCommand
import com.intellij.openapi.wm.ToolWindow
import java.awt.Component


class IDEActionCommand(private val actionId: String) : VcCommand() {

    companion object {
        fun fromArgs(args: List<String>): IDEActionCommand {
            val actionId = args[0]
            return IDEActionCommand(actionId)
        }

        val readonlyActions = listOf(IdeActions.ACTION_SHOW_INTENTION_ACTIONS)
    }

    val action: AnAction

    init {
        action = ActionManager.getInstance().getAction(actionId)
    }

    override fun readonly(): Boolean {
        if (readonlyActions.contains(actionId)) {
            return true
        } else {
            return false
        }
    }

    override fun execute(context: CommandContext): String {
        val event = ActionCommand.getInputEvent(
            actionId
        )
        val e: ToolWindow? = context.toolWindow
        var component: Component? = null
        if (e != null) {
            component = e.component
        }
        if (component == null) {
            component = context.editor?.contentComponent
        }
        ActionManager.getInstance()
            .tryToExecute(action, event, component, ActionPlaces.UNKNOWN, true)
        return "OK"
    }
}
