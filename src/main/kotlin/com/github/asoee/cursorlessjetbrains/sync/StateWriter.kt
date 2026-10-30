package com.github.asoee.cursorlessjetbrains.sync

import com.github.asoee.cursorlessjetbrains.settings.TalonSettings
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

fun serializeEditor(editor: Editor, editorId: String, psiFile: PsiFile?): EditorState {

    val edtState = ReadAction.compute<EditorState, Throwable> {

        val project = editor.project
        val document = editor.document
        val visible = isEditorVisible(project, editor)
        val editable = true // Editor is always editable for cursor positioning and selection
        val writable = isDocumentWritable(editor)

        val active = isEditorFocused(editor)
        val currentFile =
            FileDocumentManager.getInstance().getFile(document)?.path

        val cursors = editor.caretModel.allCarets.map { c ->
            cursorFromLogicalPosition(editor, c.logicalPosition)
        }

        val selections =
            editor.caretModel.caretsAndSelections.map { selectionFromCaretState(editor, it) }

        val language = editorLanguage1(psiFile) ?: "plaintext"

        // An editor that isn't laid out yet (just opened) reports a line or two as visible, so the engine would hat
        // almost nothing in it; report its start instead until it has a size
        val laidOut = editor.scrollingModel.visibleArea.height > 0
        val visibleRange = editor.calculateVisibleRange()
        val startLine = if (laidOut) editor.offsetToLogicalPosition(visibleRange.startOffset).line else 0
        val endLine = if (laidOut) {
            editor.offsetToLogicalPosition(visibleRange.endOffset).line
        } else {
            maxOf(0, minOf(document.lineCount, 200) - 1)
        }

        // Check file size limit before sending to Cursorless
        val maxFileSizeBytes = TalonSettings.instance.state.maxFileSizeKb * 1024
        val documentText = document.text
        val documentSizeBytes = documentText.toByteArray(Charsets.UTF_8).size
        val textToSend = if (documentSizeBytes > maxFileSizeBytes) {
            null // Don't send text if file is too large
        } else {
            documentText
        }

//    println("editorState: $currentFile, active: $active, visible: $visible")
        return@compute EditorState(
            editorId,
            currentFile,
            textToSend,
            active,
            language,
            startLine,
            endLine,
            cursors,
            selections,
            visible,
            editable,
            writable
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

fun isDocumentWritable(editor: Editor): Boolean {
    // A read-only local file may only need a VCS checkout (e.g. Perforce), which EditorManager.documentUpdated
    // requests before editing, so let the engine attempt the edit
    return editor.document.isWritable ||
            FileDocumentManager.getInstance().getFile(editor.document)?.isInLocalFileSystem == true
}

fun isEditorFocused(editor: Editor): Boolean {
    if (editor.project == null) {
        return false
    }
    FileEditorManager.getInstance(editor.project!!).selectedEditor.let { selectedEditor ->
        return selectedEditor is TextEditor && selectedEditor.editor == editor
    }

}
