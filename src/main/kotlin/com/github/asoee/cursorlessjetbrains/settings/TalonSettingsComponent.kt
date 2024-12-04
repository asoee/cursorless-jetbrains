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
    private val myUserNameText = JBTextField()
    private val myIdeaUserStatus = JBCheckBox("IntelliJ IDEA user")

    init {
        panel = FormBuilder.createFormBuilder()
            .addLabeledComponent(JBLabel("User name:"), myUserNameText, 1, false)
            .addComponent(myIdeaUserStatus, 1)
            .addComponentFillVertically(JPanel(), 0)
            .getPanel()
    }

    val preferredFocusedComponent: JComponent
        get() = myUserNameText

    @get:NotNull
    var userNameText: String
        get() = myUserNameText.text
        set(newText) {
            myUserNameText.text = newText
        }

    var ideaUserStatus: Boolean
        get() = myIdeaUserStatus.isSelected
        set(newStatus) {
            myIdeaUserStatus.isSelected = newStatus
        }
}
