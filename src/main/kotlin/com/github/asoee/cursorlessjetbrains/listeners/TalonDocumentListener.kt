package com.github.asoee.cursorlessjetbrains.listeners

import com.github.asoee.cursorlessjetbrains.services.EditorManager
import com.intellij.openapi.editor.event.DocumentEvent
import com.intellij.openapi.editor.event.DocumentListener

class TalonDocumentListener(val editorManager: EditorManager) : DocumentListener {

    override fun documentChanged(event: DocumentEvent) {
        super.documentChanged(event)

        editorManager.documentChanged(event.document)

    }
}
