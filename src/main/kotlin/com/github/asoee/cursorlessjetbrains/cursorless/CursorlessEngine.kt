package com.github.asoee.cursorlessjetbrains.cursorless

import com.github.asoee.cursorlessjetbrains.javet.*
import com.github.asoee.cursorlessjetbrains.sync.EditorState
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

    fun executeCommand(command: CursorlessCommand) {
        val clCmd = CommandV7(
            spokenFormat = command.command + " " + command.target.spokenForm(),
            usePrePhraseSnapshot = false,
            action = SimpleActionDescriptor(
                name = "setSelection",
                target = PartialPrimitiveTargetDescriptor(
                    mark = DecoratedSymbolMark(
                        symbolColor = command.target.color,
                        character = command.target.letter
                    )

                ),
            )
        )
        val jsonCmd = serialize(clCmd)
        driver.execute(jsonCmd)
    }

    fun serialize(cmd: CommandV7): List<JsonObject> {
        val jsonElement = Json.encodeToJsonElement(cmd)
        return listOf(jsonElement as JsonObject)
    }

}