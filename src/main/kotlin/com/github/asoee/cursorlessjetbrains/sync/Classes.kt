package com.github.asoee.cursorlessjetbrains.sync

import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessRange
import com.intellij.openapi.editor.CaretState
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.LogicalPosition
import kotlinx.serialization.Serializable

/**
 * Represents the overall state of the editor.
 */
@Serializable
data class OverallState(
    val pid: Long,
    val serial: Long,
    val ideProduct: String,
    val ideVersion: String,
    val pluginVersion: String?,

    // TODO(pcohen): deprecate this; caller should just read find the editor with active=True
    val activeEditor: EditorState?,

    val editors: List<EditorState>,

    val recentProjects: Map<String, String>

//    val allEditors: List<FileEditorState>?
)

/**
 * Represents the state of the primary editor (the one focused).
 */
@Serializable
data class EditorState(
    val id: String,
    val path: String?,
    val text: String?,
    val active: Boolean,
    val languageId: String,
    val firstVisibleLine: Int,
    val lastVisibleLine : Int,
    val cursors: List<Cursor>,
    val selections: List<Selection>,
    val visible: Boolean,
    val editable: Boolean,
    val writable: Boolean,
    )


/**
 * Represents a single cursor.
 */
@Serializable
data class Cursor(
    val line: Int,
    val column: Int
)


/**
 * Represents a single selection.
 */
@Serializable
data class Selection(
    val start: Cursor?,
    val end: Cursor?,

    // NOTE(pcohen): unlike VS Code, there's no requirement that the cursor position is either the
    // start or end of the selection
    var cursorPosition: Cursor?,

    // NOTE(pcohen): these are provided for convenience for VS Code logic
    val active: Cursor?,
    val anchor: Cursor?
)

@Serializable
data class HatRange (
    val styleName: String,
    val editorId: String,
    val range: CursorlessRange,
)

fun cursorFromLogicalPosition(editor: Editor, logicalPosition: LogicalPosition): Cursor {
    val positionOffset = editor.logicalPositionToOffset(logicalPosition)
    val lineStartOffset = editor.document.getLineStartOffset(logicalPosition.line)
    return Cursor(
        logicalPosition.line,
        positionOffset - lineStartOffset
    )
}

fun selectionFromCaretState(editor: Editor, lp: CaretState): Selection {
    val start = lp.selectionStart?.let { cursorFromLogicalPosition(editor, it) }
    val end = lp.selectionEnd?.let { cursorFromLogicalPosition(editor, it) }
    val cursor = lp.caretPosition?.let { cursorFromLogicalPosition(editor, it) }

    // provide the "anchor" and "active" for ease of implementation inside of Visual Studio Code
    // note - if the cursor isn't either of these, will return null
    var active: Cursor? = null
    var anchor: Cursor? = null
    if (start == cursor) {
        active = start
        anchor = end
    } else if (end == cursor) {
        active = end
        anchor = start
    } else {
        active = end
        anchor = start
    }

    return Selection(
        start,
        end,
        cursor,
        active,
        anchor
    )
}
