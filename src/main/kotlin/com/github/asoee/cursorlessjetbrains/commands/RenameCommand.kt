package com.github.asoee.cursorlessjetbrains.commands

import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessRange
import com.intellij.openapi.actionSystem.IdeActions
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.editor.CaretState
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.project.Project


class RenameCommand(project: Project, val editor: Editor, val range: CursorlessRange) : VcCommand(project) {

    companion object {

        fun fromRange(project: Project, editor: Editor, range: CursorlessRange): RenameCommand {
            return RenameCommand(project, editor, range)
        }
    }

    override fun execute(context: CommandContext): String {
        context.editor = editor
        val startOffset = range.startOffset(editor)
        val endOffset = range.endOffset(editor)
        val startPos = range.logicalStartPosition(editor)
        val endPos = range.logicalEndPosition(editor)
//        editor.selectionModel.setSelection(startOffset, endOffset)
        editor.caretModel.caretsAndSelections = listOf(
            CaretState(endPos, startPos, endPos),
        )

        val command = IDEActionCommand.fromArgs(project, listOf(IdeActions.ACTION_RENAME))
        if (command != null) {
            command.execute(context)
            return "OK"
        } else {
            thisLogger().warn("IDEActionCommand not found: ${IdeActions.ACTION_RENAME}")
            return "ERROR"
        }
    }

}
