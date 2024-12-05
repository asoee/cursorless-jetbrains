package com.github.asoee.cursorlessjetbrains.listeners

import com.github.asoee.cursorlessjetbrains.services.EditorManager
import com.intellij.openapi.Disposable
import com.intellij.openapi.editor.event.SelectionEvent
import com.intellij.openapi.editor.event.SelectionListener

class TalonSelectionListener(private val editorManager: EditorManager) : SelectionListener, Disposable {

    override fun selectionChanged(e: SelectionEvent) {
        super.selectionChanged(e)
//        println("Selection changed " + e.toString())
        editorManager.editorChanged(e.editor)
    }

    // TODO(pcohen):
    override fun dispose() {
    }
}
