package com.github.asoee.cursorlessjetbrains.cursorless

import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.LogicalPosition
import kotlinx.serialization.Serializable

@Serializable
class CursorlessRange {

    var start: CursorlessPosition? = null
    var end: CursorlessPosition? = null

    fun startOffset(editor: Editor): Int {
        return editor.logicalPositionToOffset(LogicalPosition(start?.line!!, 0)) + start?.character!!
    }

    fun endOffset(editor: Editor): Int {
        return editor.logicalPositionToOffset(LogicalPosition(end?.line!!, 0)) + end?.character!!
    }
}
