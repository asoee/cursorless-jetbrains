package com.github.asoee.cursorlessjetbrains.sync

import com.github.asoee.cursorlessjetbrains.util.editorLanguage
import com.intellij.ide.RecentProjectsManager
import com.intellij.ide.RecentProjectsManagerBase
import com.intellij.openapi.application.ReadAction
import com.intellij.openapi.diagnostic.logger
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.fileEditor.TextEditor
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.IdeFocusManager
import java.nio.file.Path

// ================================================================================
// StateWriter
//
// This writes out the current state of the editor to a file whenever there are changes
// (projects opened, tabs switched, cursors moved, contents changed, etc.)
//
// This allows Talon (or the Visual Studio Code sidecar) to watch efficiently for changes.
// ================================================================================

// This is increased every time any change is made.
var serial: Long = 0

var hasShutdown = false

/**
 * Maps files in the editor to temporary files that we pass to the Cursorless sidecar.
 *
 * There are two reasons that we do this:
 *
 * - In-memory changes are written immediately to the temporary file, regardless of whether the user has saved the document. Otherwise it wouldn't be possible to run Cursorless on unsaved changes.
 *
 * - When running commands, Cursorless only operates on the temporary file, not the real file. This makes it much easier to diff the changes the command made, and also prevents conflicts between the in-memory document and the file system.
 *
 * TODO(pcohen): we need to manually clean these up as we switch from file to file, not just rely on
 * the temporary directory getting wiped
 */
var cursorlessTempFiles = mutableMapOf<String, Path>()

private val log = logger<OverallState>()

fun recentProjects(): Map<String, String> {
//    val start = System.currentTimeMillis()
    try {
        val recentProjectsManager = RecentProjectsManager.getInstance()

        val recentProjectsManagerBase =
            (recentProjectsManager as RecentProjectsManagerBase)

        val map = mutableMapOf<String, String>()

        recentProjectsManagerBase.getRecentPaths().forEach { path ->
            val name = recentProjectsManagerBase.getProjectName(path)
            map[name] = path
        }


//    println("recentProjects took ${System.currentTimeMillis() - start}ms")

        return map
    } catch (e: Exception) {
        //2023-06-04 15:56:39,205 [  10091] SEVERE - #c.i.o.p.i.ProjectManagerImpl - Method 'com.intellij.ide.RecentProjectsManager com.intellij.ide.RecentProjectsManager.getInstance()' must be InterfaceMethodref constant
        //java.lang.IncompatibleClassChangeError: Method 'com.intellij.ide.RecentProjectsManager com.intellij.ide.RecentProjectsManager.getInstance()' must be InterfaceMethodref constant
        log.error("Error getting recent projects", e)
        return mapOf()
    }
}

fun getProject(): Project? {
    return IdeFocusManager.findInstance().lastFocusedFrame?.project
}

fun getEditor(): Editor? {
    return getFileEditorManager()?.selectedTextEditor
}

fun getFileEditorManager(): FileEditorManager? {
    return getProject()?.let { FileEditorManager.getInstance(it) }
}

fun serializeEditor(editor: Editor, editorId: String): EditorState {

    val edtState = ReadAction.compute<EditorState, Throwable> {

        val project = editor.project
        val document = editor.document
        val visible = isEditorVisible(project, editor)
        val editable = isEditorEditable(project, editor)

        val active = isEditorFocused(editor)
        val currentFile =
            FileDocumentManager.getInstance().getFile(document)?.path

        val cursors = editor.caretModel.allCarets.map { c ->
            cursorFromLogicalPosition(editor, c.logicalPosition)
        }

        val selections =
            editor.caretModel.caretsAndSelections.map { selectionFromCaretState(editor, it) }

        val language = editorLanguage(editor) ?: "plaintext"

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

fun isEditorEditable(project: Project?, editor: Editor): Boolean {
    return editor.document.isWritable
//    if (project == null) {
//        return false
//    }
//    val fileEditorManager = FileEditorManager.getInstance(project)
//    val file = editor.document.let { FileDocumentManager.getInstance().getFile(it) }
//
//    if (file != null) {
//        val fileEditors = fileEditorManager.getAllEditors(file)
//        for (fileEditor in fileEditors) {
//            if (fileEditor is TextEditor && fileEditor.editor == editor) {
//                return file.isWritable
//            }
//        }
//    }
//    return false
}

fun isEditorFocused(editor: Editor): Boolean {
    if (editor.project == null) {
        return false
    }
    FileEditorManager.getInstance(editor.project!!).selectedEditor.let { selectedEditor ->
        return selectedEditor is TextEditor && selectedEditor.editor == editor
    }

}
