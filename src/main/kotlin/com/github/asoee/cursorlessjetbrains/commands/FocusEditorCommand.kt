package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.editor.Editor
import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.IdeFocusManager

/**
 * Focuses a specific editor, e.g. when a Cursorless target is in another split.
 */
class FocusEditorCommand(project: Project, private val editor: Editor) : VcCommand(project) {

    override fun executionMode(): ExecutionMode {
        return ExecutionMode.EDT
    }

    override fun execute(context: CommandContext): String {
        if (!editor.component.isShowing) {
            FileDocumentManager.getInstance().getFile(editor.document)?.let { file ->
                FileEditorManager.getInstance(project).openFile(file, true)
            }
        }
        IdeFocusManager.getInstance(project).requestFocus(editor.contentComponent, true)
        return "OK"
    }
}
