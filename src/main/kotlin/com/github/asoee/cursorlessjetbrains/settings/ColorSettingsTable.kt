package com.github.asoee.cursorlessjetbrains.settings

import com.intellij.ui.components.JBCheckBox
import com.intellij.ui.components.JBScrollPane
import com.intellij.ui.table.JBTable
import java.awt.Dimension
import javax.swing.BoxLayout
import javax.swing.JPanel

class ColorSettingsTable(private val tableModel: ColorTableModel) : JPanel() {

    companion object {
        const val NAME_COLUMN = 0
        const val ENABLED_COLUMN = 1
        const val DARK_COLUMN = 2
        const val LIGHT_COLUMN = 3
        const val PENALTY_COLUMN = 4
    }

    // Create a JBTable with the table model
    private val jbTable = JBTable(tableModel)

    init {

        // Set custom renderer and editor for the second column (checkbox)
        jbTable.columnModel.getColumn(ENABLED_COLUMN).cellRenderer = CheckBoxCellRenderer()
        val editorCheckbox = JBCheckBox()
        editorCheckbox.horizontalAlignment = JBCheckBox.CENTER
        JBTable.createBooleanEditor()
        jbTable.columnModel.getColumn(ENABLED_COLUMN).cellEditor =  JBTable.createBooleanEditor()

        jbTable.columnModel.getColumn(LIGHT_COLUMN).cellRenderer = ColorCellRenderer()
        jbTable.columnModel.getColumn(DARK_COLUMN).cellRenderer = ColorCellRenderer()

        jbTable.columnModel.getColumn(LIGHT_COLUMN).cellEditor = ColorCellEditor(jbTable)
        jbTable.columnModel.getColumn(DARK_COLUMN).cellEditor = ColorCellEditor(jbTable)


        jbTable.columnModel.getColumn(PENALTY_COLUMN).cellEditor = IntegerCellEditor()

        // Calculate the preferred height of the table
        val preferredHeight = jbTable.rowHeight * jbTable.rowCount
        jbTable.preferredScrollableViewportSize =
            Dimension(jbTable.preferredScrollableViewportSize.width, preferredHeight)

        // Add the JBTable to a JScrollPane to show column headers
        val scrollPane = JBScrollPane(jbTable)

        this.layout = BoxLayout(this, BoxLayout.Y_AXIS)
        this.add(scrollPane)

    }

    fun setValue(settings: List<TalonSettings.ColorSetting>) {
        tableModel.setColorSetting(settings)
    }

    fun getValue(): List<TalonSettings.ColorSetting> {
        return tableModel.getColorSettings()
    }
}