package com.github.asoee.cursorlessjetbrains.settings

import javax.swing.DefaultCellEditor
import javax.swing.JTextField
import javax.swing.text.AbstractDocument

class IntegerCellEditor : DefaultCellEditor(JTextField()) {

    // Create a JTextField with a DocumentFilter to allow only integer input
    private val integerField: JTextField = editorComponent as JTextField

    init {
        (integerField.document as AbstractDocument).documentFilter = IntegerDocumentFilter()
        delegate = IntegerEditorDelegate()
    }

    private inner class IntegerEditorDelegate : EditorDelegate() {
        override fun setValue(value: Any?) {
            integerField.text = (value as? Int)?.toString() ?: ""
        }

        override fun getCellEditorValue(): Any {
            return integerField.text.toIntOrNull() ?: 0
        }
    }

    override fun stopCellEditing(): Boolean {
        val value = integerField.text
        if (value.matches(Regex("\\d*"))) {
            delegate.setValue(value.toInt())
        }
        return super.stopCellEditing()
    }


}