package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.editor.LogicalPosition
import com.intellij.openapi.editor.ScrollType
import com.intellij.openapi.wm.IdeFocusManager
import kotlin.math.max

class GotoCommand(line: Int, column: Int) : VcCommand() {

    companion object {
        fun fromArgs(args: List<String>): GotoCommand {
            val line = args[0].toInt()
            val column = args[1].toInt()
            return GotoCommand(line, column)
        }
    }

    // Both count from 0, so adjust.
    private val line = max((line - 1).toDouble(), 0.0).toInt()
    private val column = max((column - 1).toDouble(), 0.0).toInt()

    override fun readonly(): Boolean {
        return true
    }

    override fun execute(context: CommandContext): String? {
        val pos = LogicalPosition(line, column)
        val e = context.editor
        e!!.caretModel.removeSecondaryCarets()
        e.caretModel.moveToLogicalPosition(pos)
        e.scrollingModel.scrollToCaret(ScrollType.CENTER)
        e.selectionModel.removeSelection()
        IdeFocusManager.getGlobalInstance().requestFocus(e.contentComponent, true)
        return "OK"
    }
}
