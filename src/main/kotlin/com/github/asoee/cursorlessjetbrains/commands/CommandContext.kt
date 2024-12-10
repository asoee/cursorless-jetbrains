package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.IdeFocusManager
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowManager
import com.intellij.psi.PsiDocumentManager
import com.intellij.psi.PsiFile

class CommandContext {

    val LOG = thisLogger()

    var editor: Editor? = null
        get() {
            if (field != null) {
                return field
            }
            val currentProject = project
            val e =
                FileEditorManager.getInstance(currentProject!!).selectedTextEditor
            if (e == null) {
                LOG.debug("No selected editor?")
            }
            field = e
            return e
        }

    val toolWindow: ToolWindow?
        get() {
            val currentProject = project
            val twm = ToolWindowManager.getInstance(currentProject!!)
            val tw = twm.getToolWindow(twm.activeToolWindowId)
            if (tw == null) {
                LOG.debug("No selected tool window?")
            }
            return tw
        }

    val psiFile: PsiFile?
        get() {
            val currentProject = project
            val e =
                FileEditorManager.getInstance(currentProject!!).selectedTextEditor
            val psiFile = PsiDocumentManager.getInstance(currentProject)
                .getPsiFile(e!!.document)
            return psiFile
        }

    val project: Project?
        get() = IdeFocusManager.findInstance().lastFocusedFrame!!.project


}