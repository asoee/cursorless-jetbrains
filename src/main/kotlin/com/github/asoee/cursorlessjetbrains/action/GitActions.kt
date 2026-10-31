package com.github.asoee.cursorlessjetbrains.action

import com.github.asoee.cursorlessjetbrains.git.ConflictMarkers
import com.github.asoee.cursorlessjetbrains.git.GitLines
import com.github.asoee.cursorlessjetbrains.git.GitRunner
import com.github.asoee.cursorlessjetbrains.util.replaceChangedPart
import com.github.asoee.cursorlessjetbrains.util.requireWritable
import com.intellij.codeInsight.hint.HintManager
import com.intellij.openapi.actionSystem.ActionManager
import com.intellij.openapi.actionSystem.ActionPlaces
import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.command.WriteCommandAction
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.openapi.progress.ProgressManager
import com.intellij.openapi.util.ThrowableComputable
import com.intellij.openapi.project.DumbAware
import com.intellij.openapi.project.Project
import com.intellij.openapi.vcs.changes.VcsDirtyScopeManager
import com.intellij.openapi.vfs.VirtualFile
import java.io.File
import java.nio.charset.Charset

/**
 * Cursorless's git actions ("git stage", "git unstage", "git accept"), as IDE actions on the editor's caret or
 * selection, so they work with or without the IDE's staging area. Errors show as a hint at the caret.
 */
abstract class CursorlessGitAction : AnAction(), DumbAware {

    override fun getActionUpdateThread() = ActionUpdateThread.BGT

    override fun update(e: AnActionEvent) {
        val editor = e.getData(CommonDataKeys.EDITOR)
        e.presentation.isEnabled = editor != null &&
            FileDocumentManager.getInstance().getFile(editor.document)?.isInLocalFileSystem == true
    }

    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val editor = e.getData(CommonDataKeys.EDITOR) ?: return
        val file = FileDocumentManager.getInstance().getFile(editor.document) ?: return
        try {
            perform(project, editor, file)
            VcsDirtyScopeManager.getInstance(project).fileDirty(file)
        } catch (error: Exception) {
            thisLogger().info("${javaClass.simpleName} failed: ${error.message}")
            HintManager.getInstance().showErrorHint(editor, error.message ?: error.toString())
        }
    }

    protected abstract fun perform(project: Project, editor: Editor, file: VirtualFile)

    /**
     * Runs [block], which runs git, under a cancellable progress rather than freezing the IDE while git works. Read
     * the editor before calling it: [block] runs on a background thread.
     */
    protected fun <T> withGit(project: Project, block: () -> T): T =
        ProgressManager.getInstance().runProcessWithProgressSynchronously(
            ThrowableComputable<T, Exception> { block() }, "Running git", true, project,
        )

    /** A blob's text as the document has it: "\n" line breaks and no byte order mark */
    protected fun ByteArray.documentText(charset: Charset): String =
        toString(charset).removePrefix(BOM).replace("\r\n", "\n")

    /** The selected lines (0-based, inclusive), or the caret's line; a selection ending at a line start leaves it out */
    protected fun selectedLines(editor: Editor): Pair<Int, Int> {
        val document = editor.document
        val selection = editor.selectionModel
        if (!selection.hasSelection()) {
            val line = editor.caretModel.logicalPosition.line
            return line to line
        }
        val first = document.getLineNumber(selection.selectionStart)
        var last = document.getLineNumber(selection.selectionEnd)
        if (last > first && document.getLineStartOffset(last) == selection.selectionEnd) last--
        return first to last
    }

    protected companion object {
        const val BOM = "\uFEFF"
    }
}

/** "git stage" on a whole file: git add */
class GitStageFileAction : CursorlessGitAction() {
    override fun perform(project: Project, editor: Editor, file: VirtualFile) {
        FileDocumentManager.getInstance().saveDocument(editor.document)
        withGit(project) {
            val git = GitRunner.forFile(File(file.path))
            git.check("add", "--", git.pathOf(File(file.path)))
        }
    }
}

/** "git unstage" on a whole file: back to HEAD in the index, or out of it if the repository has no commits yet */
class GitUnstageFileAction : CursorlessGitAction() {
    override fun perform(project: Project, editor: Editor, file: VirtualFile) {
        withGit(project) {
            val git = GitRunner.forFile(File(file.path))
            val path = git.pathOf(File(file.path))
            if (git.run("rev-parse", "--verify", "-q", "HEAD").exitCode == 0) {
                git.check("restore", "--staged", "--", path)
            } else {
                git.check("rm", "--cached", "-q", "--", path)
            }
        }
    }
}

/** Base for staging or unstaging the selected lines, by writing the file's new index version */
abstract class GitLinesAction : CursorlessGitAction() {
    override fun perform(project: Project, editor: Editor, file: VirtualFile) {
        val charset = file.charset
        val (first, last) = selectedLines(editor)
        val working = editor.document.text
        withGit(project) {
            val git = GitRunner.forFile(File(file.path))
            val path = git.pathOf(File(file.path))
            val raw = git.blob(":$path")?.toString(charset) ?: ""
            // Compare as the document has it, then keep the index's own line breaks and byte order mark
            val index = raw.removePrefix(BOM).replace("\r\n", "\n")
            val newIndex = newIndex(git, path, charset, index, working, first, last)
            // Also when the file isn't in the index, which would otherwise gain an empty copy
            if (newIndex == index) {
                throw IllegalStateException(nothingToDo)
            }
            val text = (if (raw.startsWith(BOM)) BOM else "") +
                if (raw.contains("\r\n")) newIndex.replace("\n", "\r\n") else newIndex
            git.writeIndex(path, text.toByteArray(charset))
        }
    }

    protected abstract val nothingToDo: String

    protected abstract fun newIndex(
        git: GitRunner, path: String, charset: java.nio.charset.Charset, index: String, working: String, first: Int, last: Int,
    ): String
}

/** "git stage" on lines: stage only the changes on the selected lines */
class GitStageLinesAction : GitLinesAction() {
    override val nothingToDo = "No changes to stage on these lines"

    override fun newIndex(
        git: GitRunner, path: String, charset: java.nio.charset.Charset, index: String, working: String, first: Int, last: Int,
    ) = GitLines.stage(index, working, first, last)
}

/** "git unstage" on lines: unstage only the staged changes on the selected lines */
class GitUnstageLinesAction : GitLinesAction() {
    override val nothingToDo = "No staged changes on these lines"

    override fun newIndex(
        git: GitRunner, path: String, charset: java.nio.charset.Charset, index: String, working: String, first: Int, last: Int,
    ): String {
        val head = git.blob("HEAD:$path")?.documentText(charset) ?: ""
        return GitLines.unstage(head, index, working, first, last)
    }
}

/**
 * "git revert" on lines: put the selected lines' unstaged changes back to the staged version, as VS Code does. Outside
 * a git repository (e.g. Perforce), the IDE's Rollback Lines, which reverts whole changed blocks.
 */
class GitRevertLinesAction : CursorlessGitAction() {
    override fun perform(project: Project, editor: Editor, file: VirtualFile) {
        val staged = withGit(project) {
            val git = try {
                GitRunner.forFile(File(file.path))
            } catch (_: GitRunner.GitException) {
                return@withGit null
            }
            val path = git.pathOf(File(file.path))
            git.blob(":$path")?.documentText(file.charset)
                ?: throw IllegalStateException("${file.name} isn't tracked by git")
        }
        if (staged == null) {
            val rollback = ActionManager.getInstance().getAction("Vcs.RollbackChangedLines")
                ?: throw IllegalStateException("${file.name} isn't in a git repository")
            ActionManager.getInstance().tryToExecute(rollback, null, editor.contentComponent, ActionPlaces.UNKNOWN, true)
            return
        }
        val document = editor.document
        val (first, last) = selectedLines(editor)
        val reverted = GitLines.revert(staged, document.text, first, last)
        if (reverted == document.text) {
            throw IllegalStateException("No changes to revert on these lines")
        }
        requireWritable(editor)
        // Replace only the text that differs, so carets elsewhere stay where they are
        WriteCommandAction.runWriteCommandAction(project, "Revert Lines", null, {
            replaceChangedPart(document, 0, document.textLength, reverted)
        })
    }
}

/** "git accept": keep the side of the merge conflict the caret is in */
class AcceptConflictSideAction : CursorlessGitAction() {
    override fun perform(project: Project, editor: Editor, file: VirtualFile) {
        val document = editor.document
        val lines = document.text.split("\n")
        val resolution = ConflictMarkers.resolveAt(lines, editor.caretModel.logicalPosition.line)
        requireWritable(editor)
        var start = document.getLineStartOffset(resolution.firstLine)
        var end = document.getLineEndOffset(resolution.lastLine)
        if (resolution.keep.isEmpty()) {
            // An empty side removes the lines, line breaks included, rather than leaving a blank line
            if (resolution.lastLine + 1 < document.lineCount) {
                end = document.getLineStartOffset(resolution.lastLine + 1)
            } else if (start > 0) {
                start--
            }
        }
        WriteCommandAction.runWriteCommandAction(project, "Accept Conflict Side", null, {
            document.replaceString(start, end, resolution.keep.joinToString("\n"))
        })
    }
}
