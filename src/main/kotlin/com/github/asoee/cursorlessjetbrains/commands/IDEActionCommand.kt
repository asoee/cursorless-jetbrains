package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.actionSystem.ActionManager
import com.intellij.openapi.actionSystem.ActionPlaces
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.IdeActions
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.IdeFocusManager
import com.intellij.openapi.wm.ToolWindow
import com.github.asoee.cursorlessjetbrains.util.isInTerminal
import com.github.asoee.cursorlessjetbrains.util.isTerminalPowerShell
import com.intellij.ide.IdeEventQueue
import java.awt.Component
import java.awt.event.KeyEvent


class IDEActionCommand @JvmOverloads constructor(
    project: Project,
    private val actionId: String,
    private val editor: Editor? = null,
) : VcCommand(project) {

    companion object {
        fun fromArgs(project: Project, args: List<String>): IDEActionCommand? {
            val actionId = args[0]
            val action = ActionManager.getInstance().getAction(actionId)
            if (action == null) {
                thisLogger().warn("Action not found: $actionId")
                return null
            }
            return IDEActionCommand(project, actionId)
        }

        val readonlyActions = listOf(IdeActions.ACTION_SHOW_INTENTION_ACTIONS)

        // The terminal's output is an editor, but the generic clipboard actions can't reach the shell
        private val terminalEquivalents = mapOf(
            "EditorPaste" to "Terminal.Paste",
            "EditorCopy" to "Terminal.CopySelectedText",
        )

        // Editing actions the terminal has no action for, so the shell gets the key instead
        private val terminalKeys = mapOf(
            "EditorBackSpace" to TerminalKey(KeyEvent.VK_BACK_SPACE, 0, '\b'),
            "EditorDelete" to TerminalKey(KeyEvent.VK_DELETE, 0, '\u007f'),
        )

        // In PowerShell, Ctrl+A selects just the current input, so "select all" / "select line" then Backspace clears
        // what was typed. Other shells have nothing like it (in bash, Ctrl+A goes to the start of the line)
        private val powerShellSelectKeys = mapOf(
            "\$SelectAll" to TerminalKey(KeyEvent.VK_A, KeyEvent.CTRL_DOWN_MASK, '\u0001'),
            "EditorSelectAll" to TerminalKey(KeyEvent.VK_A, KeyEvent.CTRL_DOWN_MASK, '\u0001'),
            "EditorSelectLine" to TerminalKey(KeyEvent.VK_A, KeyEvent.CTRL_DOWN_MASK, '\u0001'),
        )
        val invokeOnlyActions = listOf(IdeActions.ACTION_EDITOR_PASTE_FROM_HISTORY)
        val writeActions = listOf<String>()
    }

    val action: AnAction

    init {
        action = ActionManager.getInstance().getAction(actionId)
    }

    override fun invokeOnly(): Boolean {
        return invokeOnlyActions.contains(actionId)
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
        // Act where focus is, as the action's shortcut would: e.g. "paste" in the find bar or terminal pastes there,
        // not into the file editor
        val focusOwner = IdeFocusManager.getInstance(project).focusOwner
        if (focusOwner != null) {
            return focusOwner
        }
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
        if (editor != null) {
            context.editor = editor
        }
        val component = if (editor != null) editor.contentComponent else findComponent(context)
        val inTerminal = editor == null && component != null && isInTerminal(component)
        if (inTerminal && component != null) {
            val selectKey = powerShellSelectKeys[actionId]
            if (selectKey != null && !isTerminalPowerShell(project)) {
                throw IllegalStateException("Selecting in the terminal works only in PowerShell")
            }
            val key = terminalKeys[actionId] ?: selectKey
            if (key != null) {
                pressKey(component, key)
                return "OK"
            }
        }
        val actionToRun = terminalEquivalents[actionId]
            ?.takeIf { inTerminal }
            ?.let { ActionManager.getInstance().getAction(it) }
            ?: action

        ActionManager.getInstance()
            .tryToExecute(actionToRun, null, component, ActionPlaces.UNKNOWN, true)
        return "OK"
    }

    private data class TerminalKey(val keyCode: Int, val modifiers: Int, val char: Char)

    /**
     * Presses [key] in the focused terminal, which passes it to the shell, with the events a real key press makes. They
     * go through the IDE's event queue rather than the OS, so they reach this window and arrive before whatever Talon
     * runs next, e.g. the paste after "select line".
     */
    private fun pressKey(component: Component, key: TerminalKey) {
        val queue = IdeEventQueue.getInstance()
        val now = System.currentTimeMillis()
        queue.postEvent(KeyEvent(component, KeyEvent.KEY_PRESSED, now, key.modifiers, key.keyCode, key.char))
        queue.postEvent(KeyEvent(component, KeyEvent.KEY_TYPED, now, key.modifiers, KeyEvent.VK_UNDEFINED, key.char))
        queue.postEvent(KeyEvent(component, KeyEvent.KEY_RELEASED, now, key.modifiers, key.keyCode, key.char))
    }
}
