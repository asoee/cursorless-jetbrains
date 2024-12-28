package com.github.asoee.cursorlessjetbrains.settings

import javax.swing.text.AttributeSet
import javax.swing.text.BadLocationException
import javax.swing.text.DocumentFilter

// DocumentFilter to allow only integer input
class IntegerDocumentFilter : DocumentFilter() {
    @Throws(BadLocationException::class)
    override fun insertString(fb: FilterBypass, offset: Int, string: String?, attr: AttributeSet?) {
        if (string != null && string.matches(Regex("\\d*"))) {
            super.insertString(fb, offset, string, attr)
        }
    }

    @Throws(BadLocationException::class)
    override fun replace(fb: FilterBypass, offset: Int, length: Int, text: String?, attrs: AttributeSet?) {
        if (text != null && text.matches(Regex("\\d*"))) {
            super.replace(fb, offset, length, text, attrs)
        }
    }
}
