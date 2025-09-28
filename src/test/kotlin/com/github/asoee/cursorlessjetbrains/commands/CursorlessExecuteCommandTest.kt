package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.testFramework.fixtures.BasePlatformTestCase
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

class CursorlessExecuteCommandTest : BasePlatformTestCase() {

    fun testFromArgsWithJsonString() {
        // Test case where args contains a JSON string representation of JsonObjects
        val jsonCommand = JsonObject(
            mapOf(
                "version" to JsonPrimitive(7),
                "spokenForm" to JsonPrimitive("take yank"),
                "usePrePhraseSnapshot" to JsonPrimitive(true),
                "action" to JsonObject(
                    mapOf(
                        "name" to JsonPrimitive("setSelection"),
                        "target" to JsonObject(
                            mapOf(
                                "type" to JsonPrimitive("primitive"),
                                "mark" to JsonObject(
                                    mapOf(
                                        "type" to JsonPrimitive("decoratedSymbol"),
                                        "symbolColor" to JsonPrimitive("default"),
                                        "character" to JsonPrimitive("y")
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )

        val jsonString = Json.encodeToString(listOf(jsonCommand))
        val args = listOf(jsonString)

        val command = CursorlessExecuteCommand.fromArgs(project, args)
        assertNotNull("Command should be created from JSON string args", command)
    }

    fun testFromArgsWithDirectJsonObject() {
        // Test case where args contains the raw JSON string that will be parsed by CommandServerRequest
        // This simulates the actual file command scenario
        val rawJsonArg =
            """{"version": 7, "spokenForm": "take yank", "usePrePhraseSnapshot": true, "action": {"name": "setSelection", "target": {"type": "primitive", "mark": {"type": "decoratedSymbol", "symbolColor": "default", "character": "y"}}}}"""
        val args = listOf(rawJsonArg)

        val command = CursorlessExecuteCommand.fromArgs(project, args)
        assertNotNull("Command should be created from raw JSON args", command)
    }

    fun testMixedArgsSerializerDebug() {
        // Test just the args array serialization first
        val simpleArgsJson = """[{"test": "value"}, null]"""
        val deserializer = com.github.asoee.cursorlessjetbrains.commandserver.file.MixedArgsSerializer
        val result = Json.decodeFromString(deserializer, simpleArgsJson)

        assertNotNull("First arg should not be null", result[0])
        assertNull("Second arg should be null", result[1])
    }

    fun testCommandServerRequestDeserialization() {
        // Test the full deserialization of the file command JSON
        val fileCommandJson =
            """{"commandId": "cursorless.command", "args": [{"version": 7, "spokenForm": "take yank", "usePrePhraseSnapshot": true, "action": {"name": "setSelection", "target": {"type": "primitive", "mark": {"type": "decoratedSymbol", "symbolColor": "default", "character": "y"}}}}, null], "waitForFinish": false, "returnCommandOutput": true, "uuid": "4312c707-87ba-4838-9e23-1d71f2fd806f"}"""

        val request =
            Json.decodeFromString<com.github.asoee.cursorlessjetbrains.commandserver.file.CommandServerRequest>(
                fileCommandJson
            )
        assertEquals("cursorless.command", request.commandId)
        assertNotNull("First arg should not be null", request.args[0])

        // Debug the actual value
        println("DEBUG: args size: ${request.args.size}")
        println("DEBUG: args[0]: ${request.args[0]}")
        println("DEBUG: args[1]: ${request.args[1]} (is null: ${request.args[1] == null})")

        // Test that we can create a command from the deserialized args
        val command = CursorlessExecuteCommand.fromArgs(project, request.args.filterNotNull())
        assertNotNull("Command should be created from deserialized request args", command)
    }

    fun testFromArgsWithInvalidArgs() {
        // Test with invalid JSON
        val args = listOf("invalid json")

        val command = CursorlessExecuteCommand.fromArgs(project, args)
        assertNull("Command should return null for invalid JSON", command)
    }

    fun testFromArgsWithEmptyArgs() {
        // Test with no args
        val args = emptyList<String>()

        val command = CursorlessExecuteCommand.fromArgs(project, args)
        assertNull("Command should return null for empty args", command)
    }
}