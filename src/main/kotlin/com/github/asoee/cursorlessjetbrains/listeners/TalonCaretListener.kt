package com.github.asoee.cursorlessjetbrains.listeners

import com.github.asoee.cursorlessjetbrains.services.EditorManager
import com.intellij.openapi.Disposable
import com.intellij.openapi.editor.event.CaretEvent
import com.intellij.openapi.editor.event.CaretListener

class TalonCaretListener(val editorManager: EditorManager) : CaretListener, Disposable {

    override fun caretPositionChanged(event: CaretEvent) {
        super.caretPositionChanged(event)
        editorManager.editorChanged(event.editor)
    }

    // TODO(pcohen):
    override fun dispose() {
    }

    override fun caretAdded(event: CaretEvent) {
        super.caretAdded(event)
        editorManager.editorChanged(event.editor)
    }

    override fun caretRemoved(event: CaretEvent) {
        super.caretRemoved(event)
        editorManager.editorChanged(event.editor)
    }
}
