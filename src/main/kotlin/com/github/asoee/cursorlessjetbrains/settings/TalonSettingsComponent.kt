package com.github.asoee.cursorlessjetbrains.settings

import com.intellij.ui.components.JBCheckBox
import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBScrollPane
import com.intellij.ui.components.JBTextField
import com.intellij.ui.table.JBTable
import com.intellij.util.ui.FormBuilder
import org.jetbrains.annotations.NotNull
import java.awt.Dimension
import javax.swing.BoxLayout
import javax.swing.DefaultCellEditor
import javax.swing.JComponent
import javax.swing.JPanel


/**
 * Supports creating and managing a [JPanel] for the Settings Dialog.
 */
class TalonSettingsComponent {
    val panel: JPanel
    private val myHatsScaleFactor = JBTextField()
    private val myHatsVerticalOffset = JBTextField()
    private val myEnableHats = JBCheckBox("Enable Cursorless hats")
    private val myFlashRangeDuration = JBTextField()
    private val myHatShapeSettingsModel = ShapesTableModel()
    private val myHatShapeSettings = createShapesTable(myHatShapeSettingsModel)

    init {

        panel = FormBuilder.createFormBuilder()
            .addComponent(myEnableHats, 1)
            .addLabeledComponent(JBLabel("Hats scale factor"), myHatsScaleFactor, 1, false)
            .addLabeledComponent(JBLabel("Hats vertical offset"), myHatsVerticalOffset, 1, false)
            .addLabeledComponent(JBLabel("Flash range duration (milliseconds)"), myFlashRangeDuration, 1, false)
            .addLabeledComponent(JBLabel("Shape settings"), myHatShapeSettings, 1, true)

            .addComponentFillVertically(JPanel(), 0)
            .panel
    }

    val preferredFocusedComponent: JComponent
        get() = myEnableHats

    @get:NotNull
    var hatsScaleFactor: String
        get() = myHatsScaleFactor.text
        set(newText) {
            myHatsScaleFactor.text = newText
        }

    @get:NotNull
    var hatsVerticalOffset: String
        get() = myHatsVerticalOffset.text
        set(newText) {
            myHatsVerticalOffset.text = newText
        }

    var enableHats: Boolean
        get() = myEnableHats.isSelected
        set(newStatus) {
            myEnableHats.isSelected = newStatus
        }

    @get:NotNull
    var flashRangeDuration: String
        get() = myFlashRangeDuration.text
        set(newText) {
            myFlashRangeDuration.text = newText
        }

    @get:NotNull
    var hatShapeSettings: List<TalonSettings.ShapeSetting>
        get() = myHatShapeSettingsModel.getShapeSettings()
        set(newSettings) {
            myHatShapeSettingsModel.setShapeSetting(newSettings)
        }

    private fun createShapesTable(tableModel: ShapesTableModel): JPanel {

        // Create a JBTable with the table model
        val jbTable = JBTable(tableModel)

        // Set custom renderer and editor for the second column (checkbox)
        jbTable.columnModel.getColumn(1).cellRenderer = CheckBoxCellRenderer()
        val editorCheckbox = JBCheckBox()
        editorCheckbox.horizontalAlignment = JBCheckBox.CENTER
        jbTable.columnModel.getColumn(1).cellEditor = DefaultCellEditor(editorCheckbox)

        // Calculate the preferred height of the table
        val preferredHeight = jbTable.rowHeight * jbTable.rowCount
        jbTable.preferredScrollableViewportSize =
            Dimension(jbTable.preferredScrollableViewportSize.width, preferredHeight)

        // Add the JBTable to a JScrollPane to show column headers
        val scrollPane = JBScrollPane(jbTable)

        val panel = JPanel()
        panel.layout = BoxLayout(panel, BoxLayout.Y_AXIS)
        panel.add(scrollPane)

        return panel
    }
}
