package com.github.asoee.cursorlessjetbrains.settings

import com.intellij.util.xmlb.Converter
import java.awt.Color

class HexColorConverter: Converter<Color>() {
    override fun fromString(value: String): Color {
        return Color.decode(value)
    }

    override fun toString(value: Color): String {
        return ColorUtil.toHexString(value)
    }


}