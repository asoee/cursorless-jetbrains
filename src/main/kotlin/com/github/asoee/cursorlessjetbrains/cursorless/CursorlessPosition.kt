package com.github.asoee.cursorlessjetbrains.cursorless

import kotlinx.serialization.Serializable

@Serializable
class CursorlessPosition {

    var line = 0
    var character = 0  // raw character position, not the logical position (different with tab indentation)

}
