package com.github.asoee.cursorlessjetbrains.listeners

import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.ex.FocusChangeListener
import java.awt.event.FocusEvent

class TalonFocusChangeListener : FocusChangeListener {
    override fun focusGained(editor: Editor) {
        println("focus gained: $editor")
    }

    override fun focusGained(editor: Editor, event: FocusEvent) {
        println("focus gained: $editor $event")
    }

    override fun focusLost(editor: Editor) {
        println("focus lost: $editor")
    }

    override fun focusLost(editor: Editor, event: FocusEvent) {
        println("focus lost: $editor $event")
    }
}
