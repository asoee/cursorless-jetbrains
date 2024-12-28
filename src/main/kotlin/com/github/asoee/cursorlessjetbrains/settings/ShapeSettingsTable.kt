package com.github.asoee.cursorlessjetbrains.settings

import com.intellij.ui.components.JBCheckBox
import com.intellij.ui.components.JBScrollPane
import com.intellij.ui.table.JBTable
import java.awt.Dimension
import javax.swing.BoxLayout
import javax.swing.DefaultCellEditor
import javax.swing.JPanel

class ShapeSettingsTable(private val tableModel: ShapesTableModel) : JPanel() {

    companion object {
        const val NAME_COLUMN = 0
        const val ENABLED_COLUMN = 1
        const val PENALTY_COLUMN = 2
    }

    // Create a JBTable with the table model
    private val jbTable = JBTable(tableModel)

    init {

        // Set custom renderer and editor for the second column (checkbox)
        jbTable.columnModel.getColumn(ENABLED_COLUMN).cellRenderer = CheckBoxCellRenderer()
        val editorCheckbox = JBCheckBox()
        editorCheckbox.horizontalAlignment = JBCheckBox.CENTER
        jbTable.columnModel.getColumn(ENABLED_COLUMN).cellEditor = DefaultCellEditor(editorCheckbox)

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

    fun setValue(settings: List<TalonSettings.ShapeSetting>) {
        tableModel.setShapeSetting(settings)
    }

    fun getValue(): List<TalonSettings.ShapeSetting> {
        return tableModel.getShapeSettings()
    }
}