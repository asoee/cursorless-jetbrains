package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowManager
import com.intellij.psi.PsiDocumentManager
import com.intellij.psi.PsiFile

class CommandContext(val project: Project) {

    private val logger = thisLogger()

    var editor: Editor? = null
        get() {
            if (field != null) {
                return field
            }
            val e = FileEditorManager.getInstance(project).selectedTextEditor
            if (e == null) {
                logger.debug("No selected editor?")
            }
            field = e
            return e
        }

    val toolWindow: ToolWindow?
        get() {
            val twm = ToolWindowManager.getInstance(project)
            val tw = twm.getToolWindow(twm.activeToolWindowId)
            if (tw == null) {
                logger.debug("No selected tool window?")
            }
            return tw
        }

    val psiFile: PsiFile?
        get() {
            val e =
                FileEditorManager.getInstance(project).selectedTextEditor
            val psiFile = PsiDocumentManager.getInstance(project)
                .getPsiFile(e!!.document)
            return psiFile
        }

}