package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.diagnostic.Logger

abstract class VcCommand {

    companion object {
        private val LOG = Logger.getInstance(
            VcCommand::class.java
        )
    }

    abstract fun execute(context: CommandContext): String?

    abstract fun readonly(): Boolean

}
