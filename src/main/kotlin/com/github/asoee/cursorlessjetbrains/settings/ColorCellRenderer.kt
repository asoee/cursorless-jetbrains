package com.github.asoee.cursorlessjetbrains.settings

import com.intellij.ui.JBColor
import com.intellij.util.ui.JBUI
import java.awt.*
import javax.swing.JLabel
import javax.swing.JPanel
import javax.swing.JTable
import javax.swing.UIManager
import javax.swing.border.Border
import javax.swing.table.TableCellRenderer


class ColorCellRenderer : JPanel(), TableCellRenderer {

    private val hexLabel = JLabel()
    private val noFocusBorder: Border = JBUI.Borders.empty(1)

    private val colorBorder = 3
    private val colorSize = 18
    private val colorPanel = ColoredSquarePanel(colorSize)

    init {
        layout = FlowLayout(FlowLayout.LEFT, 5, 5)
//        colorPanel.preferredSize = Dimension(colorSize, colorSize)
        colorPanel.border = JBUI.Borders.empty(colorBorder)
        add(colorPanel)
        add(hexLabel)
    }

    override fun getTableCellRendererComponent(
        table: JTable,
        value: Any?,
        isSelected: Boolean,
        hasFocus: Boolean,
        row: Int,
        column: Int
    ): Component {
        val colorValue = value as Color?
        colorValue?.let { color ->
            hexLabel.text = ColorUtil.toHexString(color)
        }

        if (isSelected) {
            background = table.selectionBackground
            foreground = table.selectionForeground
        } else {
            background = table.background
            foreground = table.foreground
        }

        border = if (hasFocus) {
            UIManager.getBorder("Table.focusCellHighlightBorder")
        } else {
            noFocusBorder
        }

        colorValue?.let { color ->
            colorPanel.foreground = color
        }

        return this
    }

    class ColoredSquarePanel(private val size: Int) : JPanel() {

        init {
            preferredSize = Dimension(size, size)
            foreground = JBColor.RED // Set the foreground color
        }

        override fun paintComponent(g: Graphics) {
            super.paintComponent(g)
            g.color = foreground
            g.fillRect(0, 0, size, size) // Draw a square with the foreground color
        }
    }
}