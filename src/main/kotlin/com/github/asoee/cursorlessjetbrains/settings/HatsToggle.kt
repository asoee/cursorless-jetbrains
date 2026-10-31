package com.github.asoee.cursorlessjetbrains.settings

import com.intellij.openapi.application.ApplicationManager

/**
 * Whether hats are on in this session: the "Enable Cursorless hats" setting, flipped by VS Code's
 * cursorless.toggleDecorations. As in VS Code, the toggle isn't saved, so the hats are back after a restart, and
 * changing the setting starts over from its new value.
 */
object HatsToggle {

    private var toggled = false
    private var lastSetting: Boolean? = null

    @Synchronized
    fun enabled(settings: TalonSettings.State = TalonSettings.instance.state): Boolean {
        if (lastSetting != settings.enableHats) {
            lastSetting = settings.enableHats
            toggled = false
        }
        return settings.enableHats != toggled
    }

    /** Turns the hats off in every editor, or back on, and tells each project's engine */
    fun toggle() {
        val enabled = synchronized(this) {
            enabled()
            toggled = !toggled
            enabled()
        }
        ApplicationManager.getApplication().messageBus.syncPublisher(TalonSettingsListener.TOPIC).onHatsToggled(enabled)
    }
}
