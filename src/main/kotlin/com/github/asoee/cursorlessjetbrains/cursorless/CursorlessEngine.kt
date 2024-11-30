package com.github.asoee.cursorlessjetbrains.cursorless

import com.github.asoee.cursorlessjetbrains.javet.DocumentUpdateCallbackFunc
import com.github.asoee.cursorlessjetbrains.javet.JavetDriver
import com.github.asoee.cursorlessjetbrains.javet.SetSelectionCallbackFunc
import com.github.asoee.cursorlessjetbrains.sync.EditorState

class CursorlessEngine(private val driver: JavetDriver) {

    fun editorChanged(editorState: EditorState) {
        driver.editorChanged(editorState)
    }

    fun AddHatUpdateListener(listener: HatUpdateCallback) {
        driver.setHatUpdateCallback(listener)
    }

    fun SetSelectionUpdateListener(listener: SetSelectionCallbackFunc) {
        driver.setSelectionUpdateCallback(listener)
    }

    fun SetDocumentUpdateListener(listener: DocumentUpdateCallbackFunc) {
        driver.setDocumentUpdateCallback(listener)
    }


}