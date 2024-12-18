package com.github.asoee.cursorlessjetbrains.cursorless

import com.intellij.openapi.diagnostic.logger
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.ui.JBColor
import groovy.json.JsonException
import kotlinx.serialization.json.Json
import java.awt.Color
import java.awt.Graphics
import java.awt.event.ComponentAdapter
import java.awt.event.ComponentEvent
import java.awt.image.BufferedImage
import java.io.File
import java.nio.file.Files
import java.nio.file.Path
import java.util.concurrent.ConcurrentLinkedQueue
import javax.imageio.ImageIO
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

    fun shapeImage(name: String): BufferedImage {
        val imagePath = SHAPES_DIRECTORY.resolve("$name.png").toUri()
        return ImageIO.read(File(imagePath))
    }

    fun coloredShapeImage(
        fullKeyName: String,
        shapeName: String,
        colorName: String
    ): BufferedImage? {
        if (shapeImageCache.containsKey(fullKeyName)) {
            return shapeImageCache[fullKeyName]
        }

        println("generating image for $fullKeyName")
        val shape = shapeImage(shapeName)
        val color = colorForName(colorName) ?: return null

        // TODO(pcohen): don't hard code dark mode
        val coloredImage = colorImageAndPreserveAlpha(shape, color.darkVariant)
        shapeImageCache[fullKeyName] = coloredImage
        return coloredImage
    }

    private fun colorImageAndPreserveAlpha(
        img: BufferedImage,
        c: Color
    ): BufferedImage {
        val raster = img.raster
        val pixel = intArrayOf(c.red, c.green, c.blue)
        for (x in 0 until raster.width) for (y in 0 until raster.height) for (b in pixel.indices) raster.setSample(
            x, y, b,
            pixel[b]
        )
        return img
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

        if (Files.exists(Path.of(COLORS_FILENAME))) {
            val format = Json { isLenient = true }

            // TODO(pcohen): anywhere where we parse JSON, show appropriate errors to the user
            // if the parse fails
            val map = format.decodeFromString<ColorsFormat>(
                File(COLORS_FILENAME).readText()
            )

            map.forEach { colorScheme, colorMap ->
                colorMap.forEach { name, hex ->
                    colors[colorScheme]?.set(name, hex)
                }
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
        mapping[fullKeyName]!!.forEach { range: CursorlessRange ->
            if (range.end.line > lineCount) {
                return@forEach
            }
            var offset = range.startOffset(editor)

            localOffsets.forEach { pair ->
                if (offset >= pair.first) {
//                    log.warn("adjusting $offset to ${offset + pair.second} due to local offset: $localOffsets")
                    offset += pair.second
                }
            }

            val logicalPosition = editor.offsetToLogicalPosition(offset)

            val coordinates = editor.visualPositionToXY(
                editor.logicalToVisualPosition(logicalPosition)
            )

            val color = this.colorForName(colorName) ?: return
            g.color = color

            if (shapeName != null) {
                val size = SHAPE_SIZE
                val image = coloredShapeImage(fullKeyName, shapeName, colorName)
                g.drawImage(
                    image,
                    coordinates.x,
                    coordinates.y - SHAPE_SIZE / 2 + 1,
                    size, size,
                    null
                )
            } else {
                val size = OVAL_SIZE
                g.fillOval(
                    coordinates.x + 1,
                    coordinates.y,
                    size,
                    size
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
