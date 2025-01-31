package com.github.asoee.cursorlessjetbrains.listeners

import com.github.asoee.cursorlessjetbrains.services.TalonProjectService
import com.github.asoee.cursorlessjetbrains.settings.TalonSettings
import com.github.asoee.cursorlessjetbrains.ui.CursorlessContainer
import com.intellij.openapi.components.service
import com.intellij.openapi.editor.event.EditorFactoryEvent
import com.intellij.openapi.editor.event.EditorFactoryListener

var editorToContainer =
    HashMap<com.intellij.openapi.editor.Editor, CursorlessContainer>()

class TalonEditorFactoryListener : EditorFactoryListener {

    override fun editorCreated(event: EditorFactoryEvent) {

        event.editor.project?.let { project ->
            val projectService = project.service<TalonProjectService>()
            projectService.editorCreated(event.editor)
            addCursorlessContainerToEditor(event.editor)
        }
    }

    override fun editorReleased(event: EditorFactoryEvent) {
        super.editorReleased(event)

        event.editor.project?.let { project ->
            removeCursorlessContainerFromEditor(event.editor)

            val applicationService = project.service<TalonProjectService>()
            applicationService.editorReleased(event.editor)
        }
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
