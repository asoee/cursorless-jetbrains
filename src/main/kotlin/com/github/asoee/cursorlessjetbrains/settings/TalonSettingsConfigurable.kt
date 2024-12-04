package com.github.asoee.cursorlessjetbrains.settings

import com.intellij.openapi.options.Configurable
import org.jetbrains.annotations.Nls
import org.jetbrains.annotations.Nullable
import java.util.*
import javax.swing.JComponent


/**
 * Provides controller functionality for application settings.
 */
internal class TalonSettingsConfigurable : Configurable {
    private var mySettingsComponent: TalonSettingsComponent? = null

    @Nls(capitalization = Nls.Capitalization.Title)
    override fun getDisplayName(): String = "SDK: Application Settings Example"

    override fun getPreferredFocusedComponent(): JComponent = mySettingsComponent!!.preferredFocusedComponent

    @Nullable
    override fun createComponent(): JComponent {
        mySettingsComponent = TalonSettingsComponent()
        return mySettingsComponent!!.panel
    }

    override fun isModified(): Boolean {
        val state: TalonSettings.State =
            Objects.requireNonNull(TalonSettings.instance.getState())
        return !mySettingsComponent!!.userNameText.equals(state.userId) ||
                mySettingsComponent!!.ideaUserStatus != state.ideaStatus
    }

    override fun apply() {
        val state: TalonSettings.State =
            Objects.requireNonNull(TalonSettings.instance.getState())
        state.userId = mySettingsComponent!!.userNameText!!
        state.ideaStatus = mySettingsComponent!!.ideaUserStatus
    }

    override fun reset() {
        val state: TalonSettings.State =
            Objects.requireNonNull(TalonSettings.instance.getState())
        mySettingsComponent!!.userNameText = state.userId
        mySettingsComponent!!.ideaUserStatus = state.ideaStatus
    }

    override fun disposeUIResources() {
        mySettingsComponent = null
    }
}