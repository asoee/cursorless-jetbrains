package com.github.asoee.cursorlessjetbrains.settings

import java.awt.Color

class ColorUtil {

    companion object {
        fun toHexString(color: Color): String {
            return java.lang.String.format("#%02x%02x%02x", color.red, color.green, color.blue)
        }
    }
}