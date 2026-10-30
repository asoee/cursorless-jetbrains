package com.github.asoee.cursorlessjetbrains.commands

import com.github.asoee.cursorlessjetbrains.services.TalonProjectService
import com.intellij.openapi.components.service
import com.intellij.openapi.project.Project
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject

class CursorlessExecuteCommand(project: Project, private val jsonObjects: List<JsonObject>) : VcCommand(project) {

    companion object {
        fun fromArgs(project: Project, args: List<String>): CursorlessExecuteCommand? {
            return args.firstOrNull()?.let { argString ->
                try {
                    // Try to parse as a list of JsonObjects first (new format from MixedArgsSerializer)
                    val jsonObjects = try {
                        Json.decodeFromString<List<JsonObject>>(argString)
                    } catch (e: Exception) {
                        // If that fails, try to parse as a single JsonObject and wrap in a list
                        listOf(Json.decodeFromString<JsonObject>(argString))
                    }
                    CursorlessExecuteCommand(project, jsonObjects)
                } catch (e: Exception) {
                    null
                }
            }
        }
    }

    override fun executionMode(): ExecutionMode {
        return ExecutionMode.EDT
    }

    override fun execute(context: CommandContext): String {
        return executeForResult(context)?.toString() ?: "OK"
    }

    override fun executeForResult(context: CommandContext): JsonElement? {
        val service = project.service<TalonProjectService>()
        val result = service.cursorlessEngine.executeCommand(jsonObjects)

        if (!result.success) {
            throw RuntimeException(result.error ?: "Cursorless command execution failed")
        }
        // Pass the engine's value through as JSON: Talon expects e.g. ["main"], not the string "[\"main\"]"
        return result.returnValue
    }

    override fun toString(): String {
        return "CursorlessExecuteCommand(jsonObjects=$jsonObjects)"
    }
}