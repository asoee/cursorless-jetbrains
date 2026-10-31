package com.github.asoee.cursorlessjetbrains.commands

import com.github.asoee.cursorlessjetbrains.services.TalonProjectService
import com.github.asoee.cursorlessjetbrains.tutorial.CursorlessTutorial
import com.intellij.openapi.components.service
import com.intellij.openapi.project.Project
import kotlinx.serialization.json.JsonPrimitive

/**
 * Talon's tutorial commands (cursorless.tutorial.*) and cursorless.documentationOpened: each runs the engine's
 * tutorial and, as in VS Code, reveals the Cursorless tool window that shows it
 */
class TutorialCommand(
    project: Project,
    private val method: String,
    private val argJson: String? = null,
) : VcCommand(project) {

    companion object {
        /** "tutorial <number>" sends the tutorial's zero-based position; "cursorless tutorial" sends its id */
        fun start(project: Project, args: List<String>): TutorialCommand? {
            val arg = args.firstOrNull() ?: return null
            val argJson = arg.toIntOrNull()?.toString() ?: JsonPrimitive(arg).toString()
            return TutorialCommand(project, "tutorialStart", argJson)
        }

        fun of(method: String): CommandFactoryFunction = { project, _ -> TutorialCommand(project, method) }
    }

    // On the EDT like cursorless.command: setting up a step edits, selects and focuses through the EDT, and an editor
    // update read between those calls would reach the engine afterwards with the half-set-up state
    override fun executionMode(): ExecutionMode {
        return ExecutionMode.EDT
    }

    override fun execute(context: CommandContext): String {
        project.service<TalonProjectService>().cursorlessEngine.tutorialCommand(method, argJson)
        project.service<CursorlessTutorial>().reveal()
        return "OK"
    }

    override fun toString(): String {
        return "TutorialCommand($method${argJson?.let { ", $it" } ?: ""})"
    }
}
