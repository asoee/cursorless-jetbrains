package com.github.asoee.cursorlessjetbrains.commands

import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessRange
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.editor.CaretState
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.project.Project
import com.intellij.psi.codeStyle.CodeStyleManager


class InsertLineAfterCommand(project: Project, val editor: Editor, val lineRanges: Array<LineRange>) :
    VcCommand(project) {

    companion object {

        fun fromRanges(project: Project, editor: Editor, ranges: List<CursorlessRange>): InsertLineAfterCommand {
            val lineRanges = ranges.map {
                LineRange(it.start.line, it.end.line)
            }.toTypedArray()
            return InsertLineAfterCommand(project, editor, lineRanges)
        }
    }

    override fun executionMode(): ExecutionMode {
        return ExecutionMode.WRITE
    }

    override fun execute(context: CommandContext): String {
        val carets: MutableList<CaretState> = mutableListOf()
        for (lineRange in lineRanges) {
            val startLine = lineRange.startLine
            val endLine = lineRange.endLine
            thisLogger().info("Insert line after $endLine")
            val document = editor.document
            val endOffset: Int = document.getLineEndOffset(endLine)
            // add newline
            document.insertString(endOffset, "\n")
            // find end of the new line and indent accoring to code style
            val newlineOffset: Int = document.getLineEndOffset(endLine + 1)
            CodeStyleManager.getInstance(project).adjustLineIndent(editor.document, newlineOffset)
            // move caret to the end of the new line
            val indentedLineEndOffset: Int = document.getLineEndOffset(endLine + 1)
            val newPos = editor.offsetToLogicalPosition(indentedLineEndOffset)
            carets.add(CaretState(newPos, newPos, newPos))
        }
        editor.caretModel.caretsAndSelections = carets
        return "OK"
    }

}
