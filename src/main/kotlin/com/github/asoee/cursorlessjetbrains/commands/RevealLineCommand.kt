package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.LogicalPosition
import com.intellij.openapi.editor.ScrollType
import com.intellij.openapi.project.Project
import java.awt.Point


class RevealLineCommand(project: Project, val editor: Editor, val line: Int, val revealAt: String) :
    VcCommand(project) {

    override fun readonly(): Boolean {
        return false
    }

    override fun execute(context: CommandContext): String {

        val scrollPos = scrollPosFromType(revealAt)
        thisLogger().info("Centering line $scrollPos")
        editor.scrollingModel.scrollTo(scrollPos, ScrollType.CENTER)
        editor.scrollingModel.scrollTo(LogicalPosition(line, 0), ScrollType.RELATIVE)
        return "OK"
    }

    fun scrollPosFromType(revealAt: String): LogicalPosition {

        val ve = editor.scrollingModel.visibleArea
        val firstLine = editor.xyToLogicalPosition(Point(ve.x, ve.y)).line
        val lastLine = editor.xyToLogicalPosition(Point(ve.x, ve.y + ve.height)).line
        thisLogger().info("Visible lines: $firstLine - $lastLine")
        val visibleLines = lastLine - firstLine
        val halfScreenOffset = visibleLines / 2 - 1

        return when (revealAt) {
            "center" -> {
                LogicalPosition(Math.max(0, line - 1), 0)
            }

            "top" -> {
                LogicalPosition(line + visibleLines, 0)
            }

            "bottom" -> {
                LogicalPosition(Math.max(0, line - visibleLines), 0)
            }

            else -> {
                thisLogger().warn("Invalid revealAt value: $revealAt")
                LogicalPosition(line, 0)
            }
        }
    }

}
