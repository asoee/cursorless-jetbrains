package com.github.asoee.cursorlessjetbrains.ui

import com.github.weisj.jsvg.SVGDocument
import com.github.weisj.jsvg.parser.DefaultParserProvider
import com.github.weisj.jsvg.parser.DomProcessor
import com.github.weisj.jsvg.parser.SVGLoader
import java.awt.Color


class CursorlessShape(
    private val dynamicColor: DynamicSvgPaint,
    private val svgDocument: SVGDocument,
) {

    companion object {

        val loader: SVGLoader = SVGLoader()
        fun loadShape(shape: String): CursorlessShape? {
            CursorlessShape::class.java.getResource("/icons/$shape.svg")?.let { svgUri ->
                val dynamicColor = DynamicSvgPaint(Color.GRAY)
                loader.load(svgUri, ColorParserProvider(dynamicColor))?.let { svg ->
                    return CursorlessShape(dynamicColor, svg)
                }
            }
            return null
        }
    }

    fun setColor(color: Color) {
        dynamicColor.setColor(color)
    }

    fun svg(): SVGDocument {
        return svgDocument
    }

    class ColorParserProvider(private val dynamicColor: DynamicSvgPaint) : DefaultParserProvider() {
        override fun createPreProcessor(): DomProcessor {
            return CustomColorsProcessor(dynamicColor)
        }
    }

}
