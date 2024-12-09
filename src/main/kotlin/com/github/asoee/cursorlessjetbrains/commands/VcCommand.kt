package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.project.Project

abstract class VcCommand(Project: Project) {

    val project: Project = Project

    companion object {
        private val LOG = Logger.getInstance(
            VcCommand::class.java
        )
    }

    abstract fun execute(context: CommandContext): String?

    abstract fun readonly(): Boolean

}
