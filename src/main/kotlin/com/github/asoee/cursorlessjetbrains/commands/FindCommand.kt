package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.find.FindManager
import com.intellij.find.FindModel
import com.intellij.openapi.editor.ScrollType
import com.intellij.openapi.project.ProjectManager
import com.intellij.openapi.wm.IdeFocusManager

class FindCommand(private val direction: String, private val searchTerm: String) : VcCommand() {

    companion object {
        fun fromArgs(args: List<String>): FindCommand {
            val direction = args[0]
            val searchTerm = java.lang.String.join(" ", args.subList(1, args.size))
            return FindCommand(direction, searchTerm)
        }
    }

    override fun readonly(): Boolean {
        return true
    }

    override fun execute(context: CommandContext): String? {
        val e = context.editor
        val document = e!!.document
        val selection = e.selectionModel
        val project = ProjectManager.getInstance().openProjects[0]
        val findManager = FindManager.getInstance(project)
        val findModel = FindModel()
        findModel.stringToFind = searchTerm
        findModel.isCaseSensitive = false
        findModel.isRegularExpressions = true
        findModel.isForward = direction == "next"
        val result = findManager.findString(
            document.charsSequence,
            e.caretModel.offset,
            findModel
        )
        if (result.isStringFound) {
            if (direction == "next") {
                e.caretModel.moveToOffset(result.endOffset)
            } else {
                e.caretModel.moveToOffset(result.startOffset)
            }
            selection.setSelection(result.startOffset, result.endOffset)
            e.scrollingModel.scrollToCaret(ScrollType.CENTER)
            IdeFocusManager.getGlobalInstance().requestFocus(e.contentComponent, true)
        }
        return "OK"
    }
}
