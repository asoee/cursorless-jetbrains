package com.github.asoee.cursorlessjetbrains.ui

import com.github.weisj.jsvg.attributes.paint.SimplePaintSVGPaint
import com.github.weisj.jsvg.parser.DomProcessor
import com.github.weisj.jsvg.parser.ParsedElement
import java.awt.Color
import java.awt.Paint
import java.util.*
import java.util.function.Consumer


internal class CustomColorsProcessor(private val customColor: DynamicSvgPaint) : DomProcessor {

    override fun process(root: ParsedElement) {
        processImpl(root)
        root.children().forEach(Consumer { root: ParsedElement -> this.process(root) })
    }

    private fun processImpl(element: ParsedElement) {
        // Obtain the id of the element
        // Note: There that Element also has a node() method to obtain the SVGNode. However, during the pre-processing
        // phase the SVGNode is not yet fully parsed and doesn't contain any non-defaulted information.
        val nodeId = element.id()

        if (element.attributeNode().hasAttribute("fill")
            && element.attributeNode().attributes()["fill"] != "none"
        ) {
            // use the current fill color as the initial color
            val color: Color = element.attributeNode().getColor("fill")
            customColor.setColor(color)

            // This can be anything as long as it's unique
            val uniqueIdForDynamicColor: String = UUID.randomUUID().toString()
            // Register the dynamic color as a custom element
            element.registerNamedElement(uniqueIdForDynamicColor, customColor)
            element.attributeNode().attributes()["fill"] = uniqueIdForDynamicColor
            // Refer to the custom element as the fill attribute
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


    override fun paint(): Paint {
        return color
    }
}