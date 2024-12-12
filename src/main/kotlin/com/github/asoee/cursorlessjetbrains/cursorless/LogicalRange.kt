package com.github.asoee.cursorlessjetbrains.cursorless

import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.LogicalPosition
import com.intellij.openapi.util.TextRange

class LogicalRange(val start: LogicalPosition, val end: LogicalPosition) {

    fun toTextRange(editor: Editor): TextRange {
        return TextRange(
            editor.logicalPositionToOffset(start),
            editor.logicalPositionToOffset(end)
        )
    }
}