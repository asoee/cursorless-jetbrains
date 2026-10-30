package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.find.EditorSearchSession
import com.intellij.find.FindManager
import com.intellij.find.findInProject.FindInProjectManager
import com.intellij.ide.DataManager
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.project.Project

/**
 * Opens the IDE's find UI with the given text, for Cursorless "scout" (in the editor) and "scout all" (in the project).
 */
class ShowFindCommand(
    project: Project,
    private val editor: Editor,
    private val query: String,
    private val inProject: Boolean,
) : VcCommand(project) {

    override fun executionMode(): ExecutionMode {
        return ExecutionMode.EDT
    }

    override fun execute(context: CommandContext): String {
        val findManager = FindManager.getInstance(project)
        if (inProject) {
            val findModel = findManager.findInProjectModel.clone()
            findModel.stringToFind = query
            val dataContext = DataManager.getInstance().getDataContext(editor.contentComponent)
            FindInProjectManager.getInstance(project).findInProject(dataContext, findModel)
        } else {
            val session = EditorSearchSession.get(editor)
            if (session != null) {
                session.setTextInField(query)
            } else {
                val findModel = findManager.findInFileModel.clone()
                findModel.stringToFind = query
                EditorSearchSession.start(editor, findModel, project)
            }
        }
        return "OK"
    }

    override fun toString(): String {
        return "ShowFindCommand(query='$query', inProject=$inProject)"
    }
}
