package com.github.asoee.cursorlessjetbrains.cursorless

import kotlinx.serialization.Serializable

@Serializable
class CursorlessEditorEdit {
    var text = ""
    var changes = emptyList<CursorlessEditorChange>()
}

@Serializable
class CursorlessEditorChange {
    var text = ""
    var rangeOffset = 0
    var rangeLength = 0
}
