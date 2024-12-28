package com.github.asoee.cursorlessjetbrains.settings

import com.intellij.ide.IdeBundle
import com.intellij.ui.ColorPicker
import com.intellij.ui.JBColor
import java.awt.Color
import java.awt.Component
import java.awt.event.ActionEvent
import java.awt.event.ActionListener
import javax.swing.AbstractCellEditor
import javax.swing.JButton
import javax.swing.JTable
import javax.swing.table.TableCellEditor

class ColorCellEditor(private val table: JTable) : AbstractCellEditor(), TableCellEditor, ActionListener {
    private var newInput: Color? = null
    private var oldValue: Color? = null
    private var button: JButton = JButton()

    init {
        button.background = JBColor.WHITE
        button.actionCommand = EDIT
        button.addActionListener(this)
        button.isBorderPainted = false
    }

    override fun actionPerformed(e: ActionEvent) {
        if (EDIT == e.actionCommand) {

            newInput = ColorPicker.showDialog(
                table,
                IdeBundle.message("dialog.title.color.picker"),
                oldValue,
                false,
                null,
                true
            )

            if (newInput == null) {
                newInput = oldValue
            }
            fireEditingStopped()
        }
    }

    override fun getCellEditorValue(): Any {
        return newInput!!
    }

    override fun getTableCellEditorComponent(
        table: JTable,
        value: Any,
        isSelected: Boolean,
        row: Int,
        column: Int
    ): Component {
        newInput = value as Color
        oldValue = value
        return button
    }

    companion object {
        const val EDIT: String = "edit"
    }
}