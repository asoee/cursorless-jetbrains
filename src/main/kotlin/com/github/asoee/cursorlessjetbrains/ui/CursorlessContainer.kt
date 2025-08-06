package com.github.asoee.cursorlessjetbrains.ui

import com.github.asoee.cursorlessjetbrains.cursorless.*
import com.github.asoee.cursorlessjetbrains.settings.TalonSettings
import com.github.weisj.jsvg.view.ViewBox
import com.intellij.openapi.diagnostic.logger
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.colors.EditorFontType
import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.ui.JBColor
import groovy.json.JsonException
import java.awt.Color
import java.awt.Graphics
import java.awt.Graphics2D
import java.awt.RenderingHints
import java.awt.event.ComponentAdapter
import java.awt.event.ComponentEvent
import java.nio.file.Files
import java.nio.file.Path
import javax.swing.JComponent


/**
 * Renders the Cursorless hats within the editor.
 *
 * One is created for every editor and attached directly to its AWT component as a child component.
 */
class CursorlessContainer(val editor: Editor) : JComponent() {
    private var verticalOffset: Int = 0
    private var scaleFactorPercent: Int = 100
    private var hatsEnabled: Boolean = true
    private val parent: JComponent = editor.contentComponent

    private var colors: Map<String, JBColor> = toJbColorMap(DEFAULT_COLORS)

    private val log = logger<CursorlessContainer>()

    private var hats = HatsFormat()

    private val boundsListener = BoundsChangeListener(this)

    private val shapes = ALL_SHAPES.associateWith { CursorlessShape.loadShape(it) }

    companion object {
        private fun toJbColorMap(colors: Map<String, Map<String, String>>): Map<String, JBColor> {
            return ALL_COLORS.associateWith { colorName: String ->
                val dark = Color.decode(colors["dark"]?.get(colorName))
                val light = Color.decode(colors["light"]?.get(colorName))
                JBColor(light, dark)
            }
        }
    }


    init {
        this.parent.add(this)
        this.bounds = parent.bounds
        parent.addComponentListener(boundsListener)

        this.assignColors()

        isVisible = true
        log.info("Cursorless container initialized for editor $editor!")


    }

    private class BoundsChangeListener(val container: CursorlessContainer) : ComponentAdapter() {
        override fun componentResized(e: ComponentEvent) {
            container.size = e.component.bounds.size
        }
    }

    fun remove() {
        this.parent.remove(this)
        this.parent.invalidate()
        this.parent.repaint()
        this.parent.removeComponentListener(boundsListener)
    }

    /**
     * Assigns our colors by taking the default colors and overriding them with
     * the values from settings.
     */
    private fun assignColors() {
        val colors = HashMap<String, JBColor>()
        val hatColorSettings = TalonSettings.instance.state.hatColorSettings
        ALL_COLORS.forEach { colorName ->
            hatColorSettings.find { setting ->
                setting.colorName == colorName
            }?.let { setting ->
                colors[colorName] = JBColor(setting.light, setting.dark)
            } ?: run {
                colors[colorName] = this.colors[colorName]!!
            }
        }
        this.colors = colors
    }

    private fun editorPath(): String? {
        val file = FileDocumentManager.getInstance().getFile(editor.document)
        return file?.path
    }

    /**
     * Returns the list of hat decorations for this editor, if there is a valid one.
     */
    fun getHats(): HatsFormat {
        return this.hats
    }

    private fun renderForColor(
        g: Graphics,
        mapping: HatsFormat,
        fullKeyName: String,
        colorName: String,
        shapeName: String?
    ) {
        val lineCount = editor.document.lineCount
        val charWidth = getCharacterWidth(editor, 'm')

        val color = this.colors[colorName] ?: return
        val svgIcon = shapes[shapeName ?: "default"]

        mapping[fullKeyName]?.forEach { range: CursorlessRange ->
            if (range.end.line > lineCount) {
                return@forEach
            }
            val offset = range.startOffset(editor)
            val logicalPosition = editor.offsetToLogicalPosition(offset)

            val coordinates = editor.visualPositionToXY(
                editor.logicalToVisualPosition(logicalPosition)
            )

            val shapeSize = charWidth * 0.7f * (scaleFactorPercent / 100.0f)
            val offsetX = (charWidth - shapeSize) / 2
            val offsetY = -1.0f - this.verticalOffset
            val posX = coordinates.x + offsetX
            val posY = coordinates.y + offsetY
            svgIcon?.let {
                svgIcon.setColor(color)
                svgIcon.svg().render(
                    this, g as Graphics2D, ViewBox(
                        posX, posY,
                        shapeSize, shapeSize,
                    )
                )
            }
        }
    }

    private fun doPainting(g: Graphics) {
        if (g is Graphics2D) {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON)
        }
        val mapping = getHats()
        mapping.keys.forEach { fullName ->
            run {
                var shape: String? = null
                val color: String

                if (fullName.indexOf("-") > 0) {
                    val parts = fullName.split("-")
                    shape = parts[1]
                    color = parts[0]
                } else {
                    color = fullName
                }

                renderForColor(g, mapping, fullName, color, shape)
            }
        }
    }

    private fun isLibraryFile(): Boolean {
        val path = editorPath()
        // TODO(pcohen): hack for now; detect if the module is marked as a library
        // /Users/phillco/Library/Java/JavaVirtualMachines/corretto-11.0.14.1/Contents/Home/lib/src.zip!/java.desktop/javax/swing/JComponent.java
        return (path != null) && "node_modules/" in path
    }

    private fun isReadOnly(): Boolean {
        val path = editorPath()
        return !editor.document.isWritable || path == null || !Files.isWritable(
            Path.of(path)
        ) || isLibraryFile()
    }

    private fun getCharacterWidth(editor: Editor, character: Char): Int {
        val fontMetrics = editor.contentComponent.getFontMetrics(editor.colorsScheme.getFont(EditorFontType.PLAIN))
        return fontMetrics.charWidth(character)
    }

    override fun paintComponent(g: Graphics) {
        super.paintComponent(g)

//        if (isReadOnly()) {
            // NOTE(pcohen): work round bad performance in read only library
//            return
//        }

        try {
            if (hatsEnabled) {
                doPainting(g)
            }
        } catch (e: NullPointerException) {
            e.printStackTrace()
        } catch (e: IndexOutOfBoundsException) {
            // This might happen in some cases, if the document has been updated, and is shorter than the hat range
            thisLogger().warn("Index out of bounds exception in CursorlessContainer.paintComponent: " + e.message)
        } catch (e: JsonException) {
            e.printStackTrace()
        }
    }

    fun updateHats(format: HatsFormat) {
        this.hats = format
        this.assignColors()
        this.invalidate()
        this.repaint()
    }

    fun setHatsEnabled(enableHats: Boolean) {
        this.hatsEnabled = enableHats
    }

    fun setHatScaleFactor(scaleFactorPercent: Int) {
        this.scaleFactorPercent = scaleFactorPercent
    }

    fun setHatVerticalOffset(verticalOffset: Int) {
        this.verticalOffset = verticalOffset
    }
}
