package com.github.asoee.cursorlessjetbrains.cursorless

import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.LogicalPosition
import kotlinx.serialization.Serializable

@Serializable
class CursorlessRange(val start: CursorlessPosition, val end: CursorlessPosition) {

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
}
