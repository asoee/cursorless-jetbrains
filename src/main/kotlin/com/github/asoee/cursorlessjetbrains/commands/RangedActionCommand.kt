package com.github.asoee.cursorlessjetbrains.commands

import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessRange
import com.intellij.openapi.editor.CaretState
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.project.Project


class RangedActionCommand(
    project: Project,
    val editor: Editor,
    val ranges: Array<CursorlessRange>,
    val singleRange: Boolean,
    val restoreSelection: Boolean,
    val ideCommandId: String
) : VcCommand(project) {


    override fun execute(context: CommandContext): String {
        context.editor = editor
        val carets = ranges.map { range ->
            val startPos = range.logicalStartPosition(editor)
            val endPos = range.logicalEndPosition(editor)
            CaretState(endPos, startPos, endPos)
        }
        editor.caretModel.caretsAndSelections = carets
        IDEActionCommand.fromArgs(project, listOf(ideCommandId)).execute(context)

        return "OK"
    }

}
