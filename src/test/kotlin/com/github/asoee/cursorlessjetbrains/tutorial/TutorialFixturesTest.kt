package com.github.asoee.cursorlessjetbrains.tutorial

import com.intellij.testFramework.fixtures.BasePlatformTestCase
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

class TutorialFixturesTest : BasePlatformTestCase() {

    fun testFixtureComesBackAsJson() {
        val fixture = Json.parseToJsonElement(TutorialFixtures.readAsJson("introduction", "changeSit.yml")).jsonObject

        val command = fixture["command"]!!.jsonObject
        assertEquals(7, command["version"]!!.jsonPrimitive.int)
        assertEquals("change sit", command["spokenForm"]!!.jsonPrimitive.content)
        // Block scalars keep their line breaks
        val contents = fixture["initialState"]!!.jsonObject["documentContents"]!!.jsonPrimitive.content
        assertTrue(contents.startsWith("Welcome Cursorless!\n\n"))
    }

    fun testFixturePathCannotLeaveTheTutorialDirectory() {
        assertRejected("introduction", "../basic-coding/pourUrge.yml")
        assertRejected("..", "config.json")
    }

    // Not assertThrows: JUnit 3 would run its lambda as a test, since it compiles to a method named test...$lambda
    private fun assertRejected(tutorialId: String, fixtureName: String) {
        try {
            TutorialFixtures.readAsJson(tutorialId, fixtureName)
            fail("Expected $tutorialId/$fixtureName to be rejected")
        } catch (_: IllegalArgumentException) {
        }
    }
}
