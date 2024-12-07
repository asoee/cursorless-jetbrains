package com.github.asoee.cursorlessjetbrains.cursorless

import kotlinx.serialization.Serializable

@Serializable
class CursorlessEditorCommand {
    var ranges = emptyList<CursorlessRange>()
    var singleRange = false
    var restoreSelection = false
    var ideCommand = ""
}
