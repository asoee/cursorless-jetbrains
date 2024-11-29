package com.github.asoee.cursorlessjetbrains.listeners

import com.github.asoee.cursorlessjetbrains.services.EditorManager
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.ex.FocusChangeListener
import java.awt.event.FocusEvent

class TalonFocusChangeListener(private val editorManager: EditorManager) : FocusChangeListener {
    override fun focusGained(editor: Editor) {
        println("focus gained: $editor")
        editorManager.focusChanged(editor)
    }

    override fun focusGained(editor: Editor, event: FocusEvent) {
        println("focus gained: $editor $event")
        editorManager.focusChanged(editor)
    }

    override fun focusLost(editor: Editor) {
        println("focus lost: $editor")
        editorManager.focusChanged(editor)
    }

    override fun focusLost(editor: Editor, event: FocusEvent) {
        println("focus lost: $editor $event")
        editorManager.focusChanged(editor)
    }
}
