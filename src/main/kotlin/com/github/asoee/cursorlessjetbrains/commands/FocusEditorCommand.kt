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
            // Reopening restores the file's remembered caret, which would drop the selection Cursorless just set
            // (e.g. the one a tutorial step expects); focusing shouldn't move the cursor
            val carets = editor.caretModel.caretsAndSelections
            FileDocumentManager.getInstance().getFile(editor.document)?.let { file ->
                FileEditorManager.getInstance(project).openFile(file, true)
            }
            if (!editor.isDisposed && editor.caretModel.caretsAndSelections != carets) {
                editor.caretModel.caretsAndSelections = carets
            }
        }
        IdeFocusManager.getInstance(project).requestFocus(editor.contentComponent, true)
        return "OK"
    }
}
