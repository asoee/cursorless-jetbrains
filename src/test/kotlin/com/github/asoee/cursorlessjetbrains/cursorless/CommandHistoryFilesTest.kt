package com.github.asoee.cursorlessjetbrains.cursorless

import com.intellij.testFramework.fixtures.BasePlatformTestCase
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.nio.file.Files

class CommandHistoryFilesTest : BasePlatformTestCase() {

    fun testEntriesComeBackOldestFileFirst() {
        val dir = Files.createTempDirectory("cursorless-history")
        val files = CommandHistoryFiles(dir)

        files.append("cursorlessCommandHistory_2026-10.jsonl", """{"id":"b"}""")
        files.append("cursorlessCommandHistory_2026-09.jsonl", """{"id":"a"}""")
        files.append("cursorlessCommandHistory_2026-10.jsonl", """{"id":"c"}""")

        val ids = (Json.parseToJsonElement(files.entriesJson()) as JsonArray)
            .map { it.jsonObject["id"]!!.jsonPrimitive.content }
        assertEquals(listOf("a", "b", "c"), ids)
    }

    fun testUnreadableLinesAreSkipped() {
        val dir = Files.createTempDirectory("cursorless-history")
        Files.writeString(dir.resolve("cursorlessCommandHistory_2026-10.jsonl"), "{\"id\":\"a\"}\n{truncated\n")

        assertEquals("""[{"id":"a"}]""", CommandHistoryFiles(dir).entriesJson())
    }

    fun testNoDirectoryMeansNoEntries() {
        val dir = Files.createTempDirectory("cursorless-history").resolve("missing")

        assertEquals("[]", CommandHistoryFiles(dir).entriesJson())
    }

    fun testFileNameCannotLeaveTheDirectory() {
        val files = CommandHistoryFiles(Files.createTempDirectory("cursorless-history"))

        assertThrows(IllegalArgumentException::class.java) {
            files.append("../escape.jsonl", "{}")
        }
    }
}
