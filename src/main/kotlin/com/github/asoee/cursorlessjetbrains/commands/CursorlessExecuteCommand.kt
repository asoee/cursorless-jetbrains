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

    /** For the HTTP server, which returns text: the return value, or the whole response when it's a fallback */
    override fun execute(context: CommandContext): String {
        val response = executeForResult(context) as? JsonObject
        if (response?.containsKey("fallback") == true) {
            // Talon has to run the fallback itself, so it mustn't look like the command was done
            return response.toString()
        }
        return response?.get("returnValue")?.toString() ?: "OK"
    }

    override fun executeForResult(context: CommandContext): JsonElement? {
        val service = project.service<TalonProjectService>()
        val result = service.editorManager.asOneUndoStep { service.cursorlessEngine.executeCommand(jsonObjects) }

        if (!result.success) {
            throw RuntimeException(result.error ?: "Cursorless command execution failed")
        }
        // Pass the engine's response through as JSON: Talon expects e.g. {"returnValue": ["main"]}, not a string,
        // and {"fallback": …} when focus is outside the editor
        return when {
            result.fallback != null -> JsonObject(mapOf("fallback" to result.fallback))
            result.returnValue != null -> JsonObject(mapOf("returnValue" to result.returnValue))
            else -> JsonObject(emptyMap())
        }
    }

    override fun toString(): String {
        return "CursorlessExecuteCommand(jsonObjects=$jsonObjects)"
    }
}