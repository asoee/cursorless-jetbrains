package com.github.asoee.cursorlessjetbrains.cursorless

import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.LogicalPosition
import kotlinx.serialization.Serializable

@Serializable
class CursorlessPosition(
    val line: Int,// raw character position, not the logical position (different with tab indentation)
    val character: Int
) {

    companion object {
        fun fromLogicalPosition(editor: Editor, logicalPosition: LogicalPosition): CursorlessPosition {
            val positionOffset = editor.logicalPositionToOffset(logicalPosition)
            val lineStartOffset = editor.document.getLineStartOffset(logicalPosition.line)
            return CursorlessPosition(
                logicalPosition.line,
                positionOffset - lineStartOffset
            )
        }
    }

    override fun toString(): String {
        return "CursorlessPosition(line=$line, character=$character)"
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as CursorlessPosition

        if (line != other.line) return false
        if (character != other.character) return false

        return true
    }

    override fun hashCode(): Int {
        var result = line
        result = 31 * result + character
        return result
    }

    fun before(start: CursorlessPosition): Boolean {
        return line < start.line || (line == start.line && character < start.character)
    }

    fun after(start: CursorlessPosition): Boolean {
        return line > start.line || (line == start.line && character > start.character)
    }


}
