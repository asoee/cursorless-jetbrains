package com.github.asoee.cursorlessjetbrains.settings

import com.intellij.openapi.application.ApplicationManager
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
    override fun getDisplayName(): String = "Talon / Cursorless"

    override fun getPreferredFocusedComponent(): JComponent = mySettingsComponent!!.preferredFocusedComponent

    @Nullable
    override fun createComponent(): JComponent {
        mySettingsComponent = TalonSettingsComponent()
        return mySettingsComponent!!.panel
    }

    override fun isModified(): Boolean {
        val state: TalonSettings.State =
            Objects.requireNonNull(TalonSettings.instance.state)
        return mySettingsComponent!!.hatsScaleFactor.toInt() != state.hatScaleFactor ||
                mySettingsComponent!!.hatsVerticalOffset.toInt() != state.hatVerticalOffset ||
                mySettingsComponent!!.enableHats != state.enableHats ||
                mySettingsComponent!!.flashRangeDuration.toInt() != state.flashRangeDuration ||
                mySettingsComponent!!.hatShapeSettings != state.hatShapeSettings
    }

    override fun apply() {
        val state: TalonSettings.State =
            Objects.requireNonNull(TalonSettings.instance.state)
        state.hatScaleFactor = mySettingsComponent!!.hatsScaleFactor.toInt()
        state.hatVerticalOffset = mySettingsComponent!!.hatsVerticalOffset.toInt()
        state.enableHats = mySettingsComponent!!.enableHats
        state.flashRangeDuration = mySettingsComponent!!.flashRangeDuration.toInt()
        state.hatShapeSettings = mySettingsComponent!!.hatShapeSettings

        val messageBus = ApplicationManager.getApplication().messageBus
        messageBus.syncPublisher(TalonSettingsListener.TOPIC).onSettingsChanged(state)

    }

    override fun reset() {
        val state: TalonSettings.State =
            Objects.requireNonNull(TalonSettings.instance.state)
        mySettingsComponent!!.hatsScaleFactor = state.hatScaleFactor.toString()
        mySettingsComponent!!.hatsVerticalOffset = state.hatVerticalOffset.toString()
        mySettingsComponent!!.enableHats = state.enableHats
        mySettingsComponent!!.flashRangeDuration = state.flashRangeDuration.toString()
        mySettingsComponent!!.hatShapeSettings = state.hatShapeSettings
    }

    override fun disposeUIResources() {
        mySettingsComponent = null
    }
}