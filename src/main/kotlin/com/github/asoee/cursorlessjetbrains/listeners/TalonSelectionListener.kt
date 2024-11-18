package com.github.asoee.cursorlessjetbrains.listeners

import com.intellij.openapi.Disposable
import com.intellij.openapi.editor.event.SelectionEvent
import com.intellij.openapi.editor.event.SelectionListener

class TalonSelectionListener : SelectionListener, Disposable {

    override fun selectionChanged(e: SelectionEvent) {
        super.selectionChanged(e)
        println("Selection changed " + e.toString())
//        markEditorChange("selection listener -> selection changed")
    }

    // TODO(pcohen):
    override fun dispose() {
    }
}
