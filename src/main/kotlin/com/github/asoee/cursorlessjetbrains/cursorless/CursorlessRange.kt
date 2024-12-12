package com.github.asoee.cursorlessjetbrains.cursorless

import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.LogicalPosition
import kotlinx.serialization.Serializable

@Serializable
class CursorlessRange(val start: CursorlessPosition, val end: CursorlessPosition) {

    companion object {

        fun fromOffsets(editor: Editor, startOffset: Int, endOffset: Int): CursorlessRange {
            val startPosition = editor.offsetToLogicalPosition(startOffset)
            val endPosition = editor.offsetToLogicalPosition(endOffset)
            return fromLogicalPositions(editor, startPosition, endPosition)
        }

        fun fromLogicalPositions(
            editor: Editor,
            startLine: Int,
            startColumn: Int,
            endLine: Int,
            endColumn: Int
        ): CursorlessRange {
            return fromLogicalPositions(
                editor,
                LogicalPosition(startLine, startColumn),
                LogicalPosition(endLine, endColumn)
            )
        }

        fun fromLogicalPositions(
            editor: Editor,
            startPosition: LogicalPosition,
            endPosition: LogicalPosition
        ): CursorlessRange {
            return CursorlessRange(
                CursorlessPosition.fromLogicalPosition(editor, startPosition),
                CursorlessPosition.fromLogicalPosition(editor, endPosition)
            )
        }
    }

    fun startOffset(editor: Editor): Int {
        return editor.logicalPositionToOffset(LogicalPosition(start.line, 0)) + start.character
    }

    fun endOffset(editor: Editor): Int {
        return editor.logicalPositionToOffset(LogicalPosition(end.line, 0)) + end.character
    }

    fun logicalStartPosition(editor: Editor): LogicalPosition {
        val startOffset = startOffset(editor)
        return editor.offsetToLogicalPosition(startOffset)
    }

    fun logicalEndPosition(editor: Editor): LogicalPosition {
        val endOffset = endOffset(editor)
        return editor.offsetToLogicalPosition(endOffset)
    }

    fun toLogicalRange(editor: Editor): LogicalRange {
        return LogicalRange(logicalStartPosition(editor), logicalEndPosition(editor))
    }


    override fun toString(): String {
        return "CursorlessRange(start=$start, end=$end)"
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as CursorlessRange

        if (start != other.start) return false
        if (end != other.end) return false

        return true
    }

    override fun hashCode(): Int {
        var result = start.hashCode()
        result = 31 * result + end.hashCode()
        return result
    }

    fun contains(range: CursorlessRange): Boolean {
        if (range.start.before(start) || range.end.after(end)) {
            return false
        } else {
            return true
        }
    }


}
