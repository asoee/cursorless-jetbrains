package com.github.asoee.cursorlessjetbrains.cursorless

import com.github.asoee.cursorlessjetbrains.javet.JavetDriver
import com.github.asoee.cursorlessjetbrains.sync.EditorState

class CursorlessEngine(private val driver: JavetDriver) {

    fun editorChanged(editorState: EditorState) {
        driver.editorChanged(editorState)
    }

    fun setCursorlessCallback(callback: CursorlessCallback) {
        driver.setCursorlessCallback(callback)
    }



}