package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.editor.LogicalPosition
import com.intellij.openapi.editor.ScrollType
import com.intellij.openapi.wm.IdeFocusManager
import kotlin.math.max
import kotlin.math.min

class ExtendCommand(private val line: Int) : VcCommand() {

    companion object {
        fun fromArgs(args: List<String>): ExtendCommand {
            val line = args[0].toInt()
            return ExtendCommand(line)
        }
    }

    private val targetLine = line - 1

    override fun readonly(): Boolean {
        return false
    }

    override fun execute(context: CommandContext): String {
        val e = context.editor
        val selection = e!!.selectionModel
        val current = e.caretModel.logicalPosition

        val startLine = min(current.line.toDouble(), targetLine.toDouble()).toInt()
        val endLine = max(current.line.toDouble(), targetLine.toDouble()).toInt()

        e.caretModel.moveToLogicalPosition(LogicalPosition(startLine, 0))
        val startOffset = e.caretModel.offset
        e.caretModel.moveToLogicalPosition(LogicalPosition(endLine + 1, 0))
        val endOffset = e.caretModel.offset - 1
        selection.setSelection(startOffset, endOffset)
        e.scrollingModel.scrollToCaret(ScrollType.CENTER)
        IdeFocusManager.getGlobalInstance().requestFocus(e.contentComponent, true)

        return "OK"
    }
}
