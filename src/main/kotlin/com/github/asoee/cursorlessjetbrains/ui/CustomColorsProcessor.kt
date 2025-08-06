package com.github.asoee.cursorlessjetbrains.ui

import com.github.weisj.jsvg.paint.SimplePaintSVGPaint
import com.github.weisj.jsvg.parser.DomElement
import com.github.weisj.jsvg.parser.DomProcessor
import java.awt.Color
import java.util.*

internal class CustomColorsProcessor(private val customColor: DynamicSvgPaint) : DomProcessor {

    override fun process(root: DomElement) {
        processImpl(root)
        // Process children recursively
        root.children().forEach { child -> process(child) }
    }

    private fun processImpl(element: DomElement) {
        // Check if element has fill attribute and it's not "none"
        val fillAttribute = element.attribute("fill", "gray")
        if (fillAttribute != null && fillAttribute != "none") {
            // Use JSVG's proper color parsing
            val paintParser = element.document().loaderContext().paintParser()
            val currentColor = paintParser.parseColor(fillAttribute) ?: Color.GRAY

            // Set the initial color for our dynamic paint
            customColor.setColor(currentColor)

            // Create a unique ID for this dynamic color
            val uniqueIdForDynamicColor = "dynamic-color-${UUID.randomUUID()}"

            // Register the dynamic color as a named element
            element.document().registerNamedElement(uniqueIdForDynamicColor, customColor)

            // Update the fill attribute to reference our dynamic color
            element.setAttribute("fill", "url(#$uniqueIdForDynamicColor)")
        }
    }
}

class DynamicSvgPaint(color: Color) : SimplePaintSVGPaint {

    private var color: Color

    init {
        this.color = color
    }

    fun setColor(color: Color) {
        this.color = color
    }

    fun color(): Color {
        return color
    }

    override fun paint(): java.awt.Paint {
        return color
    }
}