package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.editor.LogicalPosition
import com.intellij.openapi.editor.ScrollType
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.IdeFocusManager

class LineRangeCommand(project: Project, private val startLine: Int, private val endLine: Int) : VcCommand(project) {

    companion object {
        fun fromArgs(project: Project, args: List<String>): LineRangeCommand {
            val startLine = args[0].toInt()
            val endLine = if (args.size == 1) {
                args[0].toInt()
            } else {
                args[1].toInt()
            }
            return LineRangeCommand(project, startLine, endLine)
        }
    }

    override fun execute(context: CommandContext): String {
        val e = context.editor!!
        val selection = e.selectionModel

        val startOffset: Int = e.logicalPositionToOffset(LogicalPosition(startLine - 1, 0))
        val endOffset: Int = e.logicalPositionToOffset(LogicalPosition(endLine, 0)) - 1
        selection.setSelection(startOffset, endOffset)
        e.caretModel.moveToOffset(endOffset)

        e.scrollingModel.scrollToCaret(ScrollType.CENTER)
        IdeFocusManager.getGlobalInstance().requestFocus(e.contentComponent, true)

        return "OK"
    }

}
