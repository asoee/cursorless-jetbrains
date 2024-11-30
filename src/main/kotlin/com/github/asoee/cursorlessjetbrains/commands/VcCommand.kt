package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.IdeFocusManager
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowManager
import com.intellij.psi.PsiDocumentManager
import com.intellij.psi.PsiFile
import java.net.URI
import java.net.URLDecoder
import java.nio.charset.StandardCharsets
import java.util.*

abstract class VcCommand {
    abstract fun run(): String?

    companion object {
        private val LOG = Logger.getInstance(
            VcCommand::class.java
        )

        fun fromRequestUri(requestURI: URI): Optional<VcCommand> {
            var split: Array<String>
            val decode = URLDecoder.decode(requestURI.toString().substring(1), StandardCharsets.UTF_8)
            split = decode.split("/".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()
            // XXX For debugging
//            Notification notification =new Notification("vc-idea", "Voicecode Plugin", decode,
//                    NotificationType.INFORMATION);
//            Notifications.Bus.notify(notification);
            split = split[1].split(" ".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()

            val command = split[0]
            //        if (command.equals("goto")) {
//            return Optional.of(new GotoCommand(Integer.parseInt(split[1]), Integer.parseInt(split[2])));
//        }
//        if (command.equals("range")) {
//            return Optional.of(new RangeCommand(Integer.parseInt(split[1]), Integer.parseInt(split[2])));
//        }
//        if (command.equals("extend")) {
//            return Optional.of(new ExtendCommand(Integer.parseInt(split[1])));
//        }
//        if (command.equals("clone")) {
//            return Optional.of(new CloneLineCommand(Integer.parseInt(split[1])));
//        }
//        if (command.equals("action")) {
//            return Optional.of(new GivenActionCommand(split[1]));
//        }
//        if (command.equals("location")) {
//            return Optional.of(new LocationCommand());
//        }
//        if (command.equals("find")) {
//            return Optional.of(new FindCommand(split[1], String.join(" ", Arrays.copyOfRange(split, 2, split.length))));
//        }
//        if (command.equals("psi")) {
//            return Optional.of(new StructureCommand(split[1], String.join(" ", Arrays.copyOfRange(split, 2, split.length)).split(",")));
//        }
            return Optional.empty()
        }

        val editor: Editor?
            get() {
                val currentProject = project
                val e =
                    FileEditorManager.getInstance(currentProject!!).selectedTextEditor
                if (e == null) {
                    LOG.debug("No selected editor?")
                }
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
}
