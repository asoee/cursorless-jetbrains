package com.github.asoee.cursorlessjetbrains.commands

import com.github.asoee.cursorlessjetbrains.services.TalonProjectService
import com.intellij.openapi.components.service
import com.intellij.openapi.project.Project
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.nio.file.Files
import java.nio.file.Paths

/**
 * Talon's "cursorless cheat sheet": cursorless.showCheatsheet({version, outputPath[, spokenFormInfo]}). Writes the
 * cheatsheet page to outputPath; Talon then opens it in the browser. Version 1 has the engine build the sheet from
 * Talon's spoken forms; version 0 (older cursorless-talon) sends the sheet itself.
 */
class ShowCheatsheetCommand(
    project: Project,
    private val outputPath: String,
    private val spokenFormInfo: JsonElement?,
) : VcCommand(project) {

    companion object {
        fun fromArgs(project: Project, args: List<String>): ShowCheatsheetCommand? {
            val arg = args.firstOrNull()?.let { runCatching { Json.parseToJsonElement(it).jsonObject }.getOrNull() }
                ?: return null
            val outputPath = arg["outputPath"]?.jsonPrimitive?.content ?: return null
            val version = arg["version"]?.jsonPrimitive?.int
            return ShowCheatsheetCommand(project, outputPath, if (version == 0) arg["spokenFormInfo"] else null)
        }

        /** Replaces the template's placeholder data, escaping "<" so the JSON can't close the script element */
        fun injectCheatsheetInfo(template: String, cheatsheetInfo: JsonElement): String {
            val start = template.indexOf("<script id=\"cheatsheet-data\">")
            require(start >= 0) { "Cheatsheet template has no cheatsheet-data element" }
            val contentStart = template.indexOf('>', start) + 1
            val contentEnd = template.indexOf("</script>", contentStart)
            val data = cheatsheetInfo.toString().replace("<", "\\u003c")
            return template.substring(0, contentStart) + "document.cheatsheetInfo = $data;" + template.substring(contentEnd)
        }
    }

    override fun executionMode(): ExecutionMode {
        return ExecutionMode.BACKGROUND
    }

    override fun execute(context: CommandContext): String {
        val cheatsheetInfo = spokenFormInfo
            ?: project.service<TalonProjectService>().cursorlessEngine.cheatsheetInfo()
            ?: throw IllegalStateException("Cursorless could not build the cheat sheet")
        val template = javaClass.getResource("/cursorless/cheatsheet.html")?.readText()
            ?: throw IllegalStateException("Cheatsheet template missing from the plugin")
        val path = Paths.get(outputPath)
        path.parent?.let { Files.createDirectories(it) }
        Files.writeString(path, injectCheatsheetInfo(template, cheatsheetInfo))
        return "OK"
    }
}
