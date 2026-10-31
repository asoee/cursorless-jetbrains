package com.github.asoee.cursorlessjetbrains.settings

import com.intellij.util.messages.Topic

interface TalonSettingsListener {

    companion object {
        val TOPIC: Topic<TalonSettingsListener> =
            Topic.create("talon settings change", TalonSettingsListener::class.java)
    }

    fun onSettingsChanged(settings: TalonSettings.State)

    /** The hats were toggled for this session (cursorless.toggleDecorations); the settings are unchanged */
    fun onHatsToggled(enabled: Boolean) {}
}