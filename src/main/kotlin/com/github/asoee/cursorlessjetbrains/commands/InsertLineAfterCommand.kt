package com.github.asoee.cursorlessjetbrains.commands

import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessRange
import com.intellij.application.options.CodeStyle
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.editor.CaretState
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.project.Project
import com.intellij.openapi.util.TextRange
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
            if (document.getLineStartOffset(endLine + 1) == document.getLineEndOffset(endLine + 1)) {
                // The IDE has no indenter for this language here (e.g. C++ and C# in Rider, whose indenting is in the
                // backend), so indent as VS Code does without indentation rules
                document.insertString(document.getLineStartOffset(endLine + 1), indentAfter(endLine))
            }
            // move caret to the end of the new line
            val indentedLineEndOffset: Int = document.getLineEndOffset(endLine + 1)
            val newPos = editor.offsetToLogicalPosition(indentedLineEndOffset)
            carets.add(CaretState(newPos, newPos, newPos))
        }
        editor.caretModel.caretsAndSelections = carets
        return "OK"
    }

    /** The indentation for a new line after [line]: the last non-blank line's, one level deeper after an opening bracket */
    private fun indentAfter(line: Int): String {
        val document = editor.document
        fun lineText(line: Int) = document.getText(TextRange(document.getLineStartOffset(line), document.getLineEndOffset(line)))
        var above = line
        while (above > 0 && lineText(above).isBlank()) above--
        val text = lineText(above)
        val indent = text.takeWhile { it == ' ' || it == '\t' }
        val code = text.substringBefore("//").trimEnd()
        if (code.isEmpty() || code.last() !in "{([") {
            return indent
        }
        val options = CodeStyle.getIndentOptions(project, document)
        return indent + if (options.USE_TAB_CHARACTER) "\t" else " ".repeat(options.INDENT_SIZE)
    }

}
