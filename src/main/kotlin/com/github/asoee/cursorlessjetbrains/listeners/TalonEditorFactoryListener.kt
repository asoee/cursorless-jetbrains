package com.github.asoee.cursorlessjetbrains.listeners

import com.github.asoee.cursorlessjetbrains.services.TalonApplicationService
import com.github.asoee.cursorlessjetbrains.settings.TalonSettings
import com.github.asoee.cursorlessjetbrains.ui.CursorlessContainer
import com.intellij.openapi.components.service
import com.intellij.openapi.editor.event.EditorFactoryEvent
import com.intellij.openapi.editor.event.EditorFactoryListener

var editorToContainer =
    HashMap<com.intellij.openapi.editor.Editor, CursorlessContainer>()

class TalonEditorFactoryListener : EditorFactoryListener {

    override fun editorCreated(event: EditorFactoryEvent) {

        val applicationService = service<TalonApplicationService>()
        applicationService.editorCreated(event.editor)

        addCursorlessContainerToEditor(event.editor)
    }

    override fun editorReleased(event: EditorFactoryEvent) {
        super.editorReleased(event)

        removeCursorlessContainerFromEditor(event.editor)

        val applicationService = service<TalonApplicationService>()
        applicationService.editorReleased(event.editor)
    }
}

fun addCursorlessContainerToEditor(editor: com.intellij.openapi.editor.Editor) {
    val container = CursorlessContainer(editor)
    val settings = TalonSettings.instance.state
    container.setHatsEnabled(settings.enableHats)
    container.setHatScaleFactor(settings.hatScaleFactor)
    container.setHatVerticalOffset(settings.hatVerticalOffset)
    editorToContainer[editor] = container
}

fun removeCursorlessContainerFromEditor(editor: com.intellij.openapi.editor.Editor) {
    val container = editorToContainer[editor] ?: return
    container.remove()
}

fun getCursorlessContainers() = editorToContainer.values
