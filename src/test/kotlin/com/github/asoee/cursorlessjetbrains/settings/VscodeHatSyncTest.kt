package com.github.asoee.cursorlessjetbrains.settings

import com.intellij.testFramework.fixtures.BasePlatformTestCase

class VscodeHatSyncTest : BasePlatformTestCase() {

    private val settingsJson = """
        {
            // VS Code allows comments and trailing commas
            "editor.fontFamily": "Fira Code, // not a comment",
            "cursorless.hatEnablement.shapes": {
                "bolt": true,
                "fox": true, /* trailing comma next */
            },
            "cursorless.hatEnablement.colors": {
                "pink": false,
            },
            "cursorless.hatPenalties.shapes": {
                "fox": 2
            },
        }
    """.trimIndent()

    fun testStripJsoncKeepsCommentLikeTextInStrings() {
        val stripped = VscodeHatSync.stripJsonc(settingsJson)
        assertTrue(stripped.contains("\"Fira Code, // not a comment\""))
        assertFalse(stripped.contains("VS Code allows comments"))
        assertFalse(stripped.contains("trailing comma next"))
    }

    fun testParseHatSettingsMergesTalonDefaults() {
        val hats = VscodeHatSync.parseHatSettings(settingsJson)

        assertEquals(mapOf("bolt" to true, "fox" to true), hats.shapeEnablement)
        assertEquals(true, hats.colorEnablement["blue"])
        assertEquals(false, hats.colorEnablement["pink"])
        assertEquals(false, hats.colorEnablement["userColor1"])
        assertEquals(mapOf("fox" to 2), hats.shapePenalties)
    }

    fun testApplyHatSettingsEnablesOnlyTalonsHats() {
        val state = TalonSettings.State()
        val changed = VscodeHatSync.applyHatSettings(VscodeHatSync.parseHatSettings(settingsJson), state)

        assertTrue(changed)
        assertEquals(
            listOf("default", "bolt", "fox"),
            state.hatShapeSettings.filter { it.enabled }.map { it.shapeName })
        assertEquals(2, state.hatShapeSettings.first { it.shapeName == "fox" }.penalty)
        assertEquals(
            listOf("default", "blue", "green", "red", "yellow"),
            state.hatColorSettings.filter { it.enabled }.map { it.colorName })
        assertFalse(VscodeHatSync.applyHatSettings(VscodeHatSync.parseHatSettings(settingsJson), state))
    }
}
