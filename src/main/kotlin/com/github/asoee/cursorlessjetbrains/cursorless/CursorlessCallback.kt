package com.github.asoee.cursorlessjetbrains.cursorless

import com.github.asoee.cursorlessjetbrains.sync.HatRange

interface CursorlessCallback {

    fun onHatUpdate(hatRanges: Array<HatRange>)

    fun setSelection(editorId: String, selections: Array<CursorlessRange>)

    fun documentUpdated(editorId: String, edit: CursorlessEditorEdit)

    fun clipboardCopy(editorId: String, selections: Array<CursorlessRange>)

    fun clipboardPaste(editorId: String)
}