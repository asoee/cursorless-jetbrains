package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.project.Project
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

abstract class VcCommand(val project: Project) {

    companion object {
        private val LOG = Logger.getInstance(
            VcCommand::class.java
        )
    }

    abstract fun execute(context: CommandContext): String

    /**
     * Result returned to the command server caller, shaped like Cursorless's command response: `{"returnValue": …}`.
     * Commands with structured results override this, so they reach Talon as JSON rather than as a string.
     */
    open fun executeForResult(context: CommandContext): JsonElement? {
        return JsonObject(mapOf("returnValue" to JsonPrimitive(execute(context))))
    }

    open fun executionMode(): ExecutionMode {
        return ExecutionMode.EDT
    }

    open fun invokeOnly(): Boolean {
        return false
    }

}
