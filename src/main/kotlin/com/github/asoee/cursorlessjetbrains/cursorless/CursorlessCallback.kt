package com.github.asoee.cursorlessjetbrains.cursorless

import com.github.asoee.cursorlessjetbrains.sync.HatRange

interface CursorlessCallback {

    fun onHatUpdate(hatRanges: Array<HatRange>)
    fun setSelection(editorId: String, selections: Array<CursorlessRange>)
    fun documentUpdated(editorId: String, edit: CursorlessEditorEdit)
    fun clipboardCopy(editorId: String, selections: Array<CursorlessRange>)
    fun clipboardPaste(editorId: String)
    fun executeCommand(editorId: String, command: String, args: Array<String>)
    fun insertLineAfter(editorId: String, ranges: Array<CursorlessRange>)
    fun executeRangeCommand(editorId: String, rangeCommand: CursorlessEditorCommand)
    fun revealLine(editorId: String, line: Int, revealAt: String)
    fun flashRanges(flashRanges: Array<CursorlessFlashRange>)
}