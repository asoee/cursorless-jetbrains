package com.github.asoee.cursorlessjetbrains.sync

import com.intellij.ide.RecentProjectsManager
import com.intellij.ide.RecentProjectsManagerBase
import com.intellij.openapi.diagnostic.logger
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.openapi.fileEditor.FileEditor
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.fileEditor.TextEditor
import com.intellij.openapi.fileEditor.impl.EditorHistoryManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.IdeFocusManager
import java.awt.Point
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths

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

//fun serializeProject(project: Project): ProjectState {
//    navigationHistory(project)
//    val repos =
//        VcsRepositoryManager.getInstance(project).repositories.map { repo ->
//            RepoState(repo.root.path, repo.vcs.name.lowercase())
//        }
//    return ProjectState(project.name, project.basePath, repos)
//}

fun toEditor(fileEditor: FileEditor): Editor =
    (fileEditor as TextEditor).editor

fun openFiles(project: Project): List<String> {
    return FileEditorManager.getInstance(project).openFiles.map { it.path }
}

fun recentFiles(project: Project): List<String> {
    return EditorHistoryManager.getInstance(project).fileList.map { it.path }
        .reversed()
}

fun navigationHistory(project: Project) {
//    val k = FileEditorManager.getInstance(project)
//    val k2 = k as FileEditorManagerImpl
//
//    val p = k2.getSelectionHistory()
//    println(p)

//    com.intellij.ide.actions.Switcher.SwitcherPanel
    // NOTE(pcohen): forward locations is not exposed
    // we could still do pop last based on the list
    // and then for pop forward iterate until we change files
//    val psiE = selectElementAtCaret(getEditor()!!)
//    val containingFunction = findContainingFunction(psiE!!)
//    println("$psiE, $containingFunction")
}

fun serializeEditor(editor: Editor, active: Boolean, editorId: String): EditorState {
    val project = editor.project
    val document = editor.document

    val currentFile =
        FileDocumentManager.getInstance().getFile(document)?.path

    val cursors = editor.caretModel.allCarets.map { c ->
        Cursor(
            c.logicalPosition.line,
            c.logicalPosition.column
        )
    }

    val selections =
        editor.caretModel.caretsAndSelections.map { selectionFromCaretState(it) }

    val ve = editor.scrollingModel.visibleArea

//    val language = caretLanguage(editor)?.id ?: "plaintext"
    val language = "plaintext"

    return EditorState(
        editorId,
        currentFile,
        document.text,
        active,
        language,
        editor.xyToLogicalPosition(Point(ve.x, ve.y)).line,
        editor.xyToLogicalPosition(Point(ve.x, ve.y + ve.height)).line,
        cursors,
        selections,
    )
}

/**
 * Serializes all open and visible editors (splits) for the given project.
 *
 * It does not include non visible tabs inside of those splits.
 */
//fun serializeAllEditors(project: Project): List<EditorState> {
//    val femx = FileEditorManagerEx.getInstanceEx(project)
//
//    val allEditors =
//        femx?.windows?.map { window ->
//            val selectedFile = window.selectedFile
//
//
//            // TODO(pcohen): this doesn't properly support opening the same window
//            // across multiple splits
//            val editors = femx.getEditors(selectedFile!!)
//            toEditor(editors[0])
//        }
//
//    return allEditors?.let { editors ->
//        editors.map { it ->
//            serializeEditor(
//                it,
//                it == getEditor()
//            )
//        }
//    } ?: listOf()
//}

fun serializeFileEditor(editor: FileEditor): FileEditorState {
    return FileEditorState(
        editor.file?.path,
        editor.file?.name,
        editor.isModified,
        editor.isValid
    )
}

//fun serializeOverallState(): OverallState {
//    val editor = getEditor()
//    val project = getProject()
//    val allEditors = getFileEditorManager()?.allEditors
//
//    return OverallState(
//        ProcessHandle.current().pid(),
//        serial,
//        ApplicationNamesInfo.getInstance().fullProductName,
//        ApplicationInfo.getInstance().fullVersion,
//        PluginManagerCore.getPlugin(PluginId.findId("com.github.phillco.talonjetbrains"))?.version,
//        editor?.let { serializeEditor(it, true) },
//        project?.let { p -> serializeAllEditors(p) } ?: listOf(),
//        recentProjects()
//        // NOTE(pcohen): removed for now; not very useful
////        allEditors?.map { x -> serializeFileEditor(x) }
//    )
//}

//fun markEditorChange(source: String) {
//    serial += 1
//    log.info("serial bumped to $serial ($source)")
//    serializeEditorStateToFile()
//}

var cursorlessRootCache: Path? = null

private fun cursorlessRootDefault() = Paths.get(
    System.getProperty("user.home"),
    ".cursorless-new",
)

fun cursorlessRoot(): Path {
    if (cursorlessRootCache != null) {
        return Paths.get(cursorlessRootCache.toString())
    }

    val versionPath = Paths.get(
        System.getProperty("user.home"),
        ".cursorless",
        "root"
    )
    if (Files.exists(versionPath)) {
        val content = Files.readString(versionPath)
            .replace("~", System.getProperty("user.home")).strip()

        val r = Paths.get(content)
        cursorlessRootCache = r
        return r
    }

    val r = cursorlessRootDefault()
    cursorlessRootCache = r
    return r
}




