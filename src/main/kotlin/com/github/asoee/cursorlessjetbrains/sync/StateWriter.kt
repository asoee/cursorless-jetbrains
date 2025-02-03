package com.github.asoee.cursorlessjetbrains.sync

import com.intellij.openapi.application.ReadAction
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.fileEditor.TextEditor
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.IdeFocusManager
import com.intellij.psi.PsiFile
import com.github.asoee.cursorlessjetbrains.util.editorLanguage as editorLanguage1

fun getProject(): Project? {
    return IdeFocusManager.findInstance().lastFocusedFrame?.project
}

fun getEditor(): Editor? {
    return getFileEditorManager()?.selectedTextEditor
}

fun getFileEditorManager(): FileEditorManager? {
    return getProject()?.let { FileEditorManager.getInstance(it) }
}

fun serializeEditor(editor: Editor, editorId: String, psiFile: PsiFile): EditorState {

    val edtState = ReadAction.compute<EditorState, Throwable> {

        val project = editor.project
        val document = editor.document
        val visible = isEditorVisible(project, editor)
        val editable = isEditorEditable(editor)

        val active = isEditorFocused(editor)
        val currentFile =
            FileDocumentManager.getInstance().getFile(document)?.path

        val cursors = editor.caretModel.allCarets.map { c ->
            cursorFromLogicalPosition(editor, c.logicalPosition)
        }

        val selections =
            editor.caretModel.caretsAndSelections.map { selectionFromCaretState(editor, it) }

        val language = editorLanguage1(psiFile) ?: "plaintext"

        val visibleRange = editor.calculateVisibleRange()
        val startLine = editor.offsetToLogicalPosition(visibleRange.startOffset).line
        val endLine = editor.offsetToLogicalPosition(visibleRange.endOffset).line

//    println("editorState: $currentFile, active: $active, visible: $visible")
        return@compute EditorState(
            editorId,
            currentFile,
            document.text,
            active,
            language,
            startLine,
            endLine,
            cursors,
            selections,
            visible,
            editable
        )
    }
    return edtState

}

private fun isEditorVisible(
    project: Project?,
    editor: Editor
): Boolean {
    if (project != null) {
        return FileEditorManager.getInstance(project).selectedEditors.any {
            if (it is TextEditor) {
                it.editor == editor
            } else {
                false
            }
        }
    }
    return false
}

fun isEditorEditable(editor: Editor): Boolean {
    return editor.document.isWritable
}

fun isEditorFocused(editor: Editor): Boolean {
    if (editor.project == null) {
        return false
    }
    FileEditorManager.getInstance(editor.project!!).selectedEditor.let { selectedEditor ->
        return selectedEditor is TextEditor && selectedEditor.editor == editor
    }

}
