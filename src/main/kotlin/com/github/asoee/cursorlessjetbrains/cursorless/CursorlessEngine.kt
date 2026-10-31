package com.github.asoee.cursorlessjetbrains.cursorless

import com.github.asoee.cursorlessjetbrains.javet.ExecutionResult
import com.github.asoee.cursorlessjetbrains.javet.JavetDriver
import com.github.asoee.cursorlessjetbrains.sync.EditorState
import com.intellij.openapi.diagnostic.thisLogger
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
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
        thisLogger().info("Executing command: ${jsonCmd}")
        val res = driver.execute(jsonCmd)
        return res
    }

    fun executeCommand(jsonObjects: List<JsonObject>): ExecutionResult {
        thisLogger().info("Executing command with JsonObjects: ${jsonObjects}")
        val res = driver.execute(jsonObjects)
        return res
    }

    fun serialize(cmd: CommandV7): List<JsonObject> {
        val jsonElement = Json.encodeToJsonElement(cmd)
        return listOf(jsonElement as JsonObject)
    }

    fun tutorialState(): String? {
        return driver.tutorialState()
    }

    fun setScopeListVisible(visible: Boolean) {
        driver.setScopeListVisible(visible)
    }

    fun tutorialCommand(method: String, argJson: String? = null) {
        driver.tutorialCommand(method, argJson)
    }

    fun analyzeCommandHistory() {
        driver.analyzeCommandHistory()
    }

    fun setConfiguration(commandHistory: Boolean, debug: Boolean) {
        driver.updateConfiguration(DEFAULT_CONFIGURATION.copy(commandHistory = commandHistory, debug = debug))
    }

    fun cheatsheetInfo(): JsonElement? {
        return driver.cheatsheetInfo()
    }

    fun showScopeVisualizer(scopeTypeJson: String, visualizationType: String) {
        driver.showScopeVisualizer(scopeTypeJson, visualizationType)
    }

    fun hideScopeVisualizer() {
        driver.hideScopeVisualizer()
    }

    fun talonSpokenFormsChanged() {
        driver.talonSpokenFormsChanged()
    }

    fun setHatsEnabled(enabled: Boolean) {
        driver.setHatsEnabled(enabled)
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