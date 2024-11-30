package com.github.asoee.cursorlessjetbrains.listeners

import com.github.asoee.cursorlessjetbrains.services.EditorManager
import com.intellij.openapi.editor.event.DocumentEvent
import com.intellij.openapi.editor.event.DocumentListener

class TalonDocumentListener(val editorManager: EditorManager) : DocumentListener {

    override fun documentChanged(event: DocumentEvent) {
        super.documentChanged(event)

        getCursorlessContainers()
            .filter { c -> c.editor.document == event.document }
            .forEach { c -> c.addLocalOffset(event.offset, event.newLength - event.oldLength) }

        editorManager.documentChanged(event.document)

//        markEditorChange("document listener -> document area changed (offset = ${event.offset}, old length = ${event.oldLength}, new length = ${event.newLength}")
    }
}
