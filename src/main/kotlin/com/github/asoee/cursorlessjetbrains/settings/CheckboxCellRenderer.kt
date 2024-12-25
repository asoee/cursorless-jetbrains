package com.github.asoee.cursorlessjetbrains.settings

import com.intellij.ui.components.JBCheckBox
import com.intellij.util.ui.JBUI
import java.awt.BorderLayout
import java.awt.Component
import javax.swing.JPanel
import javax.swing.JTable
import javax.swing.UIManager
import javax.swing.border.Border
import javax.swing.table.TableCellRenderer

class CheckBoxCellRenderer : TableCellRenderer {

    private val panel: JPanel = JPanel()
    private val checkbox: JBCheckBox = JBCheckBox()
    private val noFocusBorder: Border = JBUI.Borders.empty(1)

    init {
        panel.layout = BorderLayout()
        panel.add(checkbox)
        checkbox.isOpaque = false
        // Center the checkbox
        checkbox.horizontalAlignment = JBCheckBox.CENTER
    }


    override fun getTableCellRendererComponent(
        table: JTable, value: Any?, isSelected: Boolean, hasFocus: Boolean, row: Int, column: Int
    ): Component {
        val isSelectedValue = value as? Boolean ?: false
        checkbox.isSelected = isSelectedValue
        checkbox.isFocusPainted = hasFocus
        panel.background = if (isSelected) table.selectionBackground else table.background

        if (hasFocus) {
            panel.setBorder(UIManager.getBorder("Table.focusCellHighlightBorder"))
        } else {
            panel.setBorder(noFocusBorder)
        }

        return panel

    }
}