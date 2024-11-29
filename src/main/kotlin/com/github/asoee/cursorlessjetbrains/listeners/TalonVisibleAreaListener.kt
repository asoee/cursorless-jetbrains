package com.github.asoee.cursorlessjetbrains.listeners

import com.github.asoee.cursorlessjetbrains.services.EditorManager
import com.intellij.openapi.editor.event.VisibleAreaEvent
import com.intellij.openapi.editor.event.VisibleAreaListener

class TalonVisibleAreaListener(private val editorManager: EditorManager) : VisibleAreaListener {
    override fun visibleAreaChanged(e: VisibleAreaEvent) {
        println("Visible area changed " + e.toString())
        editorManager.editorChanged(e.editor)
    }
}
