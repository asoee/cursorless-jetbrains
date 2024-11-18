package com.github.asoee.cursorlessjetbrains.cursorless

import com.intellij.openapi.editor.LogicalPosition
import kotlinx.serialization.Serializable

@Serializable
class CursorlessPosition {
    var line = 0
    var character = 0

    fun toLogicalPosition(): LogicalPosition = LogicalPosition(line, character)
}
