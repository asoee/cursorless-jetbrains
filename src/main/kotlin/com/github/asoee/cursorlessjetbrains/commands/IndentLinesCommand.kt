package com.github.asoee.cursorlessjetbrains.commands

import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessRange
import com.intellij.openapi.actionSystem.ActionManager
import com.intellij.openapi.actionSystem.ActionPlaces
import com.intellij.openapi.actionSystem.IdeActions
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.playback.commands.ActionCommand


class IndentLinesCommand(
    project: Project,
    val editor: Editor,
    val directionIn: Boolean,
    val lineRanges: Array<LineRange>
) : VcCommand(project) {

    companion object {

        fun fromRanges(
            project: Project,
            editor: Editor,
            directionIn: Boolean,
            ranges: List<CursorlessRange>
        ): IndentLinesCommand {
            val lineRanges = ranges.map {
                LineRange(it.start.line, it.end.line)
            }.toTypedArray()
            return IndentLinesCommand(project, editor, directionIn, lineRanges)
        }
    }

    override fun readonly(): Boolean {
        return false
    }

    override fun execute(context: CommandContext): String {
        val e = context.editor!!
        val selection = e.selectionModel
        val origStart = e.selectionModel.selectionStart
        val origEnd = e.selectionModel.selectionEnd
        val origStartLine = e.document.getLineNumber(origStart)
        val origEndLine = e.document.getLineNumber(origEnd)
        val origStartLineEndOffset = e.document.getLineEndOffset(origStartLine)
        val origEndLineEndOffset = e.document.getLineEndOffset(origEndLine)
        e.selectionModel.removeSelection()


        val actionId = if (directionIn) {
            IdeActions.ACTION_EDITOR_INDENT_SELECTION
        } else {
            IdeActions.ACTION_EDITOR_UNINDENT_SELECTION
        }

        val event = ActionCommand.getInputEvent(
            actionId
        )

        for (lineRange in lineRanges) {
            val startLine = lineRange.startLine
            val endLine = lineRange.endLine
            thisLogger().info("Indenting lines $startLine to $endLine")
            val document = editor.document
            val startOffset: Int = document.getLineStartOffset(startLine)
            val endOffset: Int = document.getLineEndOffset(endLine)
            selection.setSelection(startOffset, endOffset)

            val action = ActionManager.getInstance().getAction(actionId)

            ActionManager.getInstance()
                .tryToExecute(action, event, editor.component, ActionPlaces.UNKNOWN, true)
        }
        selection.removeSelection()
        val afterStartLineEndOffset = e.document.getLineEndOffset(origStartLine)
        val startDisplacement = afterStartLineEndOffset - origStartLineEndOffset
        val afterEndLineEndOffset = e.document.getLineEndOffset(origEndLine)
        val endDisplacement = afterEndLineEndOffset - origEndLineEndOffset

        selection.setSelection(origStart + startDisplacement, origEnd + endDisplacement)
        return "OK"
    }

}
