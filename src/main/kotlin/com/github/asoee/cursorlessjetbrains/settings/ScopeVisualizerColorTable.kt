package com.github.asoee.cursorlessjetbrains.settings

import com.intellij.ui.components.JBScrollPane
import com.intellij.ui.table.JBTable
import java.awt.Color
import java.awt.Dimension
import javax.swing.BoxLayout
import javax.swing.JPanel
import javax.swing.table.DefaultTableModel

/**
 * The scope visualizer's colors ("visualize funk"): a background and a border for each kind of range, for dark and
 * light themes, with opacity, as VS Code's cursorless.scopeVisualizer.colors
 */
class ScopeVisualizerColorTable : JPanel() {

    companion object {
        private const val RANGE_COLUMN = 0
        private const val DARK_BACKGROUND_COLUMN = 1
        private const val DARK_BORDER_COLUMN = 2
        private const val LIGHT_BACKGROUND_COLUMN = 3
        private const val LIGHT_BORDER_COLUMN = 4
        private val COLOR_COLUMNS = DARK_BACKGROUND_COLUMN..LIGHT_BORDER_COLUMN
    }

    private val tableModel = object : DefaultTableModel(
        arrayOf("Range", "Dark background", "Dark border", "Light background", "Light border"), 0
    ) {
        override fun getColumnClass(columnIndex: Int): Class<*> =
            if (columnIndex in COLOR_COLUMNS) Color::class.java else String::class.java

        override fun isCellEditable(row: Int, column: Int) = column in COLOR_COLUMNS
    }

    private val jbTable = JBTable(tableModel)

    init {
        for (column in COLOR_COLUMNS) {
            jbTable.columnModel.getColumn(column).cellRenderer = ColorCellRenderer()
            jbTable.columnModel.getColumn(column).cellEditor = ColorCellEditor(jbTable, enableOpacity = true)
        }
        setValue(TalonSettings.scopeVisualizerColorsFromDefaults())
        jbTable.preferredScrollableViewportSize =
            Dimension(jbTable.preferredScrollableViewportSize.width, jbTable.rowHeight * jbTable.rowCount)

        layout = BoxLayout(this, BoxLayout.Y_AXIS)
        add(JBScrollPane(jbTable))
    }

    fun setValue(settings: List<TalonSettings.ScopeVisualizerColorSetting>) {
        val defaults = TalonSettings.scopeVisualizerColorsFromDefaults()
        tableModel.rowCount = 0
        for (rangeType in TalonSettings.SCOPE_VISUALIZER_RANGE_TYPES) {
            val setting = settings.find { it.rangeType == rangeType } ?: defaults.first { it.rangeType == rangeType }
            tableModel.addRow(
                arrayOf<Any>(
                    rangeType.replaceFirstChar { it.uppercase() },
                    setting.darkBackground,
                    setting.darkBorder,
                    setting.lightBackground,
                    setting.lightBorder,
                )
            )
        }
    }

    fun getValue(): List<TalonSettings.ScopeVisualizerColorSetting> =
        TalonSettings.SCOPE_VISUALIZER_RANGE_TYPES.mapIndexed { row, rangeType ->
            TalonSettings.ScopeVisualizerColorSetting(
                rangeType = rangeType,
                darkBackground = tableModel.getValueAt(row, DARK_BACKGROUND_COLUMN) as Color,
                darkBorder = tableModel.getValueAt(row, DARK_BORDER_COLUMN) as Color,
                lightBackground = tableModel.getValueAt(row, LIGHT_BACKGROUND_COLUMN) as Color,
                lightBorder = tableModel.getValueAt(row, LIGHT_BORDER_COLUMN) as Color,
            )
        }
}
