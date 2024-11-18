package com.github.asoee.cursorlessjetbrains.listeners

import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessContainer
import com.github.asoee.cursorlessjetbrains.services.TalonApplicationService
import com.intellij.openapi.components.service
import com.intellij.openapi.editor.event.EditorFactoryEvent
import com.intellij.openapi.editor.event.EditorFactoryListener

var editorToContainer =
    HashMap<com.intellij.openapi.editor.Editor, CursorlessContainer>()

class TalonEditorFactoryListener : EditorFactoryListener {

    init {
        println("PHIL: TalonEditorFactoryListener listener scope")
    }

    override fun editorCreated(event: EditorFactoryEvent) {
        println("PHIL: editor created; attaching container")

        val applicationService = service<TalonApplicationService>()
        applicationService.editorCreated(event.editor)

        addCursorlessContainerToEditor(event.editor)
    }

    override fun editorReleased(event: EditorFactoryEvent) {
        println("phil: editor released")
        super.editorReleased(event)

        removeCursorlessContainerFromEditor(event.editor)
    }
}

fun addCursorlessContainerToEditor(editor: com.intellij.openapi.editor.Editor) {
    val container = CursorlessContainer(editor)
    editorToContainer[editor] = container
}

fun removeCursorlessContainerFromEditor(editor: com.intellij.openapi.editor.Editor) {
    val container = editorToContainer[editor] ?: return
    container.remove()
}

fun getCursorlessContainers() = editorToContainer.values
