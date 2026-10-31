package com.github.asoee.cursorlessjetbrains.settings

import junit.framework.TestCase
import java.awt.Color

class ColorUtilTest : TestCase() {

    fun testOpaqueColorsKeepTheirSixDigitForm() {
        assertEquals("#ff0000", ColorUtil.toHexString(Color(0xff, 0, 0)))
        assertEquals(Color(0xff, 0, 0), ColorUtil.fromHexString("#ff0000"))
    }

    fun testTranslucentColorsKeepTheirOpacity() {
        // VS Code's default scope visualizer content background
        val color = ColorUtil.fromHexString("#ad00bc5b")
        assertEquals(0x5b, color.alpha)
        assertEquals("#ad00bc5b", ColorUtil.toHexString(color))
        assertEquals(color, HexColorConverter().fromString(HexColorConverter().toString(color)))
    }
}
