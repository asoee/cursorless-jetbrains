package com.github.asoee.cursorlessjetbrains.ui

import com.github.asoee.cursorlessjetbrains.cursorless.*
import com.github.weisj.jsvg.attributes.ViewBox
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
import java.awt.event.ComponentAdapter
import java.awt.event.ComponentEvent
import java.awt.image.BufferedImage
import java.nio.file.Files
import java.nio.file.Path
import java.util.concurrent.ConcurrentLinkedQueue
import javax.swing.JComponent


/**
 * Renders the Cursorless hats within the editor.
 *
 * One is created for every editor and attached directly to its AWT component as a child component.
 */
class CursorlessContainer(val editor: Editor) : JComponent() {
    private val parent: JComponent = editor.contentComponent

    private var started = false

    /**
     * When local changes are made (e.g., a keystroke is pushed) we record these offsets
     * temporarily, so we can adjust hats later in the document before we get them back from
     * the sidecar. This is purely a quality of life improvement.
     */
    private val localOffsets = ConcurrentLinkedQueue<Pair<Int, Int>>()

    private var colors = DEFAULT_COLORS

    private val log = logger<CursorlessContainer>()

    private val shapeImageCache = mutableMapOf<String, BufferedImage>()

    private var hats = HatsFormat()

    private val boundsListener = BoundsChangeListener(this)

    private val shapes = ALL_SHAPES.map { it to CursorlessShape.loadShape(it) }.toMap()

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
     * the values (if any) in `COLORS_PATH`.
     */
    fun assignColors() {
        val colors = ColorsFormat()

        DEFAULT_COLORS.forEach { (colorScheme, defaults) ->
            run {
                colors[colorScheme] = HashMap()
                colors[colorScheme]!!.putAll(defaults)
            }
        }

        this.colors = colors
    }

    /**
     * Records a "local offset" (a change to the document that's created before
     * VS Code has had time to generate new hats from that edit).
     *
     * This is just to make hats a little look bit less janky as the user performs edits. It's pretty fragile
     * because we don't handle overlapping requests well (the hats file isn't associated with local serial,
     * so we will load old hats if the user is making a large series of changes)
     */
    fun addLocalOffset(startOffset: Int, sizeDelta: Int) {
        localOffsets += Pair(startOffset, sizeDelta)
        log.info("localOffsets = $localOffsets")
        this.invalidate()
        this.repaint()
    }

    fun editorPath(): String? {
        val file = FileDocumentManager.getInstance().getFile(editor.document)
        return file?.path
    }

    /**
     * Returns the list of hat decorations for this editor, if there is a valid one.
     */
    fun getHats(): HatsFormat {
        return this.hats
    }

    fun colorForName(colorName: String): JBColor? {
        val lightColor = this.colors["light"]?.get(colorName)
        val darkColor = this.colors["dark"]?.get(colorName)

        if (lightColor == null || darkColor == null) {
            println("Missing color for $colorName")
            return null
        }

        return JBColor(
            Color.decode(lightColor),
            Color.decode(darkColor)
        )
    }

    fun renderForColor(
        g: Graphics,
        mapping: HatsFormat,
        fullKeyName: String,
        colorName: String,
        shapeName: String?
    ) {
        val lineCount = editor.document.lineCount
        val charWidth = getCharacterWidth(editor, 'm')
        mapping[fullKeyName]?.forEach { range: CursorlessRange ->
            if (range.end.line > lineCount) {
                return@forEach
            }
            var offset = range.startOffset(editor)
//
//            localOffsets.forEach { pair ->
//                if (offset >= pair.first) {
////                    log.warn("adjusting $offset to ${offset + pair.second} due to local offset: $localOffsets")
//                    offset += pair.second
//                }
//            }

            val logicalPosition = editor.offsetToLogicalPosition(offset)

            val coordinates = editor.visualPositionToXY(
                editor.logicalToVisualPosition(logicalPosition)
            )

            val color = this.colorForName(colorName) ?: return

            val svgIcon = shapes[shapeName ?: "default"]

            val shapeSize = charWidth * 0.7f
            val offsetX = (charWidth - shapeSize) / 2
            val offsetY = 0f// charWidth * 0.05f
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

    fun doPainting(g: Graphics) {
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

    fun isLibraryFile(): Boolean {
        val path = editorPath()
        // TODO(pcohen): hack for now; detect if the module is marked as a library
        // /Users/phillco/Library/Java/JavaVirtualMachines/corretto-11.0.14.1/Contents/Home/lib/src.zip!/java.desktop/javax/swing/JComponent.java
        return (path != null) && "node_modules/" in path
    }

    fun isReadOnly(): Boolean {
        val path = editorPath()
        return !editor.document.isWritable || path == null || !Files.isWritable(
            Path.of(path)
        ) || isLibraryFile()
    }

    fun getCharacterWidth(editor: Editor, character: Char): Int {
        val fontMetrics = editor.contentComponent.getFontMetrics(editor.colorsScheme.getFont(EditorFontType.PLAIN))
        return fontMetrics.charWidth(character)
    }

    override fun paintComponent(g: Graphics) {
        super.paintComponent(g)

        if (isReadOnly()) {
            // NOTE(pcohen): work round bad performance in read only library
            return
        }

        try {
            doPainting(g)
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
        localOffsets.clear()
        this.invalidate()
        this.repaint()
    }
}
