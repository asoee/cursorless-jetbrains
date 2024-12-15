package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.command.CommandProcessor
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.project.Project
import com.intellij.openapi.util.TextRange

class CloneLineCommand(project: Project, private val sourceLine: Int) : VcCommand(project) {

    private val LOG = thisLogger()

    companion object {
        fun fromArgs(project: Project, args: List<String>): CloneLineCommand {
            val sourceLine = args[0].toInt()
            return CloneLineCommand(project, sourceLine)
        }
    }

    override fun execute(context: CommandContext): String? {
        val cp = CommandProcessor.getInstance()
        try {
            val e = context.editor
            val document = e!!.document
            document.setReadOnly(false)
            val startOffset = document.getLineStartOffset(sourceLine - 1)
            val endOffset = document.getLineStartOffset(sourceLine)
            val text = document.getText(TextRange(startOffset, endOffset))
            cp.executeCommand(
                context.project,
                { document.insertString(endOffset, text) },
                "clone",
                "cloneGroup"
            )
        } catch (ex: Exception) {
            LOG.error("Failed to run clone line command", ex)
            return null
        }
        return "OK"
    }

    override fun executionMode(): ExecutionMode {
        return ExecutionMode.WRITE
    }
}
