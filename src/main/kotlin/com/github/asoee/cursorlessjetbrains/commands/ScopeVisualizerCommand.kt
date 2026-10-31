package com.github.asoee.cursorlessjetbrains.commands

import com.github.asoee.cursorlessjetbrains.services.TalonProjectService
import com.intellij.openapi.components.service
import com.intellij.openapi.project.Project
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject

/**
 * Talon's "visualize <scope>" / "visualize nothing": cursorless.showScopeVisualizer(scopeType, visualizationType)
 * and cursorless.hideScopeVisualizer.
 */
class ScopeVisualizerCommand(
    project: Project,
    private val scopeTypeJson: String?,
    private val visualizationType: String?,
) : VcCommand(project) {

    companion object {
        fun show(project: Project, args: List<String>): ScopeVisualizerCommand? {
            val scopeTypeJson = args.getOrNull(0) ?: return null
            // Reject anything that isn't a JSON object, since it is placed into JavaScript as-is
            if (runCatching { Json.parseToJsonElement(scopeTypeJson) as JsonObject }.isFailure) {
                return null
            }
            return ScopeVisualizerCommand(project, scopeTypeJson, args.getOrNull(1) ?: "content")
        }

        fun hide(project: Project, @Suppress("UNUSED_PARAMETER") args: List<String>): ScopeVisualizerCommand {
            return ScopeVisualizerCommand(project, null, null)
        }
    }

    override fun execute(context: CommandContext): String {
        val engine = project.service<TalonProjectService>().cursorlessEngine
        if (scopeTypeJson != null && visualizationType != null) {
            engine.showScopeVisualizer(scopeTypeJson, visualizationType)
        } else {
            engine.hideScopeVisualizer()
        }
        return "OK"
    }
}
