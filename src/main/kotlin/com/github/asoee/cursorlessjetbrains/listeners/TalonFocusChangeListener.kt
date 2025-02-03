package com.github.asoee.cursorlessjetbrains.listeners

import com.github.asoee.cursorlessjetbrains.services.EditorManager
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.ex.FocusChangeListener
import com.intellij.openapi.project.Project
import java.awt.event.FocusEvent

class TalonFocusChangeListener(private val editorManager: EditorManager, private val project: Project) :
    FocusChangeListener {
    override fun focusGained(editor: Editor) {
        if (editor.project != project) {
            return
        }
//        println("focus gained: $editor")
        editorManager.focusChanged(editor)
    }

    override fun focusGained(editor: Editor, event: FocusEvent) {
        if (editor.project != project) {
            return
        }
//        println("focus gained: $editor $event")
        editorManager.focusChanged(editor)
    }

    override fun focusLost(editor: Editor) {
        if (editor.project != project) {
            return
        }
//        println("focus lost: $editor")
        editorManager.focusChanged(editor)
    }

    override fun focusLost(editor: Editor, event: FocusEvent) {
        if (editor.project != project) {
            return
        }
//        println("focus lost: $editor $event")
        editorManager.focusChanged(editor)
    }
}
