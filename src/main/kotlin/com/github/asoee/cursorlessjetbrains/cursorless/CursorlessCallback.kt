package com.github.asoee.cursorlessjetbrains.cursorless

import com.github.asoee.cursorlessjetbrains.sync.HatRange

interface CursorlessCallback {

    fun onHatUpdate(hatRanges: Array<HatRange>)
    fun setSelection(editorId: String, selections: Array<CursorlessRange>)
    /** Applies the edit; returns the editor's selections afterwards as JSON, as the IDE moves carets with the text */
    fun documentUpdated(editorId: String, edit: CursorlessEditorEdit): String?
    fun clipboardCopy(editorId: String, selections: Array<CursorlessRange>)
    /** Returns the paste's edits as JSON [{rangeOffset, rangeLength, text}] */
    fun clipboardPaste(editorId: String): String?
    /** Runs it in the IDE; returns JSON {changes, selections}: the edits it made and the carets after, or null */
    fun executeCommand(editorId: String, command: String, args: Array<String>): String?
    /** Runs it in the IDE; returns JSON {changes, selections}: the edits it made and the carets after, or null */
    fun insertLineAfter(editorId: String, ranges: Array<CursorlessRange>): String?
    fun insertSnippet(editorId: String, snippet: String)
    /** Runs it in the IDE; returns JSON {changes, selections}: the edits it made and the carets after, or null */
    fun executeRangeCommand(editorId: String, rangeCommand: CursorlessEditorCommand): String?
    fun revealLine(editorId: String, line: Int, revealAt: String)
    fun revealRange(editorId: String, range: CursorlessRange)
    fun openUrl(url: String)
    fun flashRanges(flashRanges: Array<CursorlessFlashRange>)
    fun setHighlightRanges(highlightId: String?, editorId: String, ranges: Array<CursorlessGeneralizedRange>)
    fun prePhraseVersion(): String?
    fun findInDocument(editorId: String, query: String)
    fun findInWorkspace(editorId: String, query: String)
    fun focusEditor(editorId: String)
    fun getFocusedElementType(): String?
    fun keyValueGet(key: String): String?
    fun keyValueSet(key: String, valueJson: String)
    fun readTalonSpokenForms(): String?
    fun showInputBox(optionsJson: String): String?
    fun openSnippetFile(snippetName: String, directory: String): String
    fun commandHistoryAppend(fileName: String, entryJson: String)
    fun commandHistoryEntries(): String
    fun openUntitledTextDocument(content: String, language: String?): String
    fun showMessage(type: String, id: String, message: String)
    fun tutorialStateChanged(stateJson: String)
    fun scopeListChanged(scopeListJson: String)
}