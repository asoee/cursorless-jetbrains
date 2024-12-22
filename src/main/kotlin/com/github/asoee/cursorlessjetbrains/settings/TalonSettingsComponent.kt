package com.github.asoee.cursorlessjetbrains.settings

import com.intellij.ui.components.JBCheckBox
import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBTextField
import com.intellij.util.ui.FormBuilder
import org.jetbrains.annotations.NotNull
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

    init {
        panel = FormBuilder.createFormBuilder()
            .addComponent(myEnableHats, 1)
            .addLabeledComponent(JBLabel("Hats scale factor"), myHatsScaleFactor, 1, false)
            .addLabeledComponent(JBLabel("Hats vertical offset"), myHatsVerticalOffset, 1, false)

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
}
