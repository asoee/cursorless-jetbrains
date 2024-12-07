package com.github.asoee.cursorlessjetbrains.commands

import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessRange
import com.intellij.openapi.actionSystem.IdeActions
import com.intellij.openapi.editor.CaretState
import com.intellij.openapi.editor.Editor


class RenameCommand(val editor: Editor, val range: CursorlessRange) : VcCommand() {

    companion object {

        fun fromRange(editor: Editor, range: CursorlessRange): RenameCommand {
            return RenameCommand(editor, range)
        }
    }

    override fun readonly(): Boolean {
        return false
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

        IDEActionCommand.fromArgs(listOf(IdeActions.ACTION_RENAME)).execute(context)

        return "OK"
    }

}
