package com.github.asoee.cursorlessjetbrains.settings

import java.awt.Color

class ColorUtil {

    companion object {
        /** #rrggbb, or #rrggbbaa for a translucent color, as VS Code writes colors */
        fun toHexString(color: Color): String {
            if (color.alpha != 255) {
                return java.lang.String.format("#%02x%02x%02x%02x", color.red, color.green, color.blue, color.alpha)
            }
            return java.lang.String.format("#%02x%02x%02x", color.red, color.green, color.blue)
        }

        /** Reads #rrggbb, or #rrggbbaa with opacity */
        fun fromHexString(value: String): Color {
            val hex = value.removePrefix("#")
            if (hex.length == 8) {
                val channels = hex.chunked(2).map { it.toInt(16) }
                return Color(channels[0], channels[1], channels[2], channels[3])
            }
            return Color.decode(value)
        }
    }
}