package com.github.asoee.cursorlessjetbrains.cursorless

import com.github.asoee.cursorlessjetbrains.javet.ExecutionResult
import com.github.asoee.cursorlessjetbrains.javet.JavetDriver
import com.github.asoee.cursorlessjetbrains.sync.EditorState
import com.intellij.openapi.diagnostic.thisLogger
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.encodeToJsonElement

class CursorlessEngine(private val driver: JavetDriver) {

    fun editorChanged(editorState: EditorState) {
        driver.editorChanged(editorState)
    }

    fun setCursorlessCallback(callback: CursorlessCallback) {
        driver.setCursorlessCallback(callback)
    }

    fun editorClosed(id: String) {
        driver.editorClosed(id)
    }

    fun editorCreated(editorState: EditorState) {
        driver.editorCreated(editorState)
    }

    fun executeCommand(command: CommandV7): ExecutionResult {
        val jsonCmd = serialize(command)
        thisLogger().debug("Executing command: ${jsonCmd}")
        val res = driver.execute(jsonCmd)
        return res
    }

    fun serialize(cmd: CommandV7): List<JsonObject> {
        val jsonElement = Json.encodeToJsonElement(cmd)
        return listOf(jsonElement as JsonObject)
    }

    fun setEnabledHatShapes(enabledHatShapes: List<String>) {
        driver.setEnabledHatShapes(enabledHatShapes)
    }

    fun setHatShapePenalties(penalties: Map<String, Int>) {
        driver.setHatShapePenalties(penalties)
    }

    fun setEnabledHatColors(enabledHatColors: List<String>) {
        driver.setEnabledHatColors(enabledHatColors)
    }

    fun setHatColorPenalties(penalties: Map<String, Int>) {
        driver.setHatColorPenalties(penalties)
    }


}