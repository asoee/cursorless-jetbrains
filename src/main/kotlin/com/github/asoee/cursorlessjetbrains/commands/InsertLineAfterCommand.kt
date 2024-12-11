package com.github.asoee.cursorlessjetbrains.commands

import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessRange
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.project.Project


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

    override fun readonly(): Boolean {
        return false
    }

    override fun execute(context: CommandContext): String {
        for (lineRange in lineRanges) {
            val startLine = lineRange.startLine
            val endLine = lineRange.endLine
            thisLogger().info("Indenting lines $startLine to $endLine")
            val document = editor.document
            val endOffset: Int = document.getLineEndOffset(endLine)
            document.insertString(endOffset, "\n")
        }
        return "OK"
    }

}
