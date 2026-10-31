package com.github.asoee.cursorlessjetbrains.commands

import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessRange
import com.intellij.codeInsight.hint.HintManager
import com.intellij.openapi.actionSystem.ActionManager
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.editor.CaretState
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.popup.JBPopupFactory
import com.intellij.openapi.wm.WindowManager


class RangedActionCommand(
    project: Project,
    val editor: Editor,
    val ranges: Array<CursorlessRange>,
    val singleRange: Boolean,
    val restoreSelection: Boolean,
    val ideCommandId: String
) : VcCommand(project) {


    companion object {
        // Popups these open are left open by the IDE when the action runs again; VS Code replaces its hover instead
        private val hoverActions = setOf("QuickJavaDoc", "QuickEvaluateExpression")
    }

    override fun execute(context: CommandContext): String {
        context.editor = editor
        if (ideCommandId in hoverActions) {
            // Close popups anywhere in the project's window, not just this editor, so a hover in another editor
            // doesn't leave the last one open
            val window = WindowManager.getInstance().getIdeFrame(project)?.component ?: editor.component
            JBPopupFactory.getInstance().getChildPopups(window).forEach { it.cancel() }
            HintManager.getInstance().hideAllHints()
        }
        val carets = ranges.map { range ->
            val startPos = range.logicalStartPosition(editor)
            val endPos = range.logicalEndPosition(editor)
            CaretState(endPos, startPos, endPos)
        }
        // No ranges (e.g. "git stage" on a whole file) leaves the carets as they are; the IDE rejects an empty list
        if (carets.isNotEmpty()) {
            editor.caretModel.caretsAndSelections = carets
        }
        if (ActionManager.getInstance().getAction(ideCommandId) == null) {
            thisLogger().warn("IDEActionCommand not found: $ideCommandId")
            return "ERROR"
        }
        // Run it on this editor, not wherever focus is: focus may still be in a popup closed above
        IDEActionCommand(project, ideCommandId, editor).execute(context)
        return "OK"
    }

    override fun toString(): String {
        return "RangedActionCommand(ranges=${ranges.contentToString()}, ideCommandId='$ideCommandId')"
    }

}
