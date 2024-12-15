package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.project.Project

abstract class VcCommand(val project: Project) {

    companion object {
        private val LOG = Logger.getInstance(
            VcCommand::class.java
        )
    }

    abstract fun execute(context: CommandContext): String?

    open fun executionMode(): ExecutionMode {
        return ExecutionMode.EDT
    }

}
