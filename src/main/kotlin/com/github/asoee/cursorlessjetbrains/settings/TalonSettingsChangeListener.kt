package com.github.asoee.cursorlessjetbrains.settings

import com.github.asoee.cursorlessjetbrains.services.TalonApplicationService
import com.intellij.openapi.components.service

class TalonSettingsChangeListener : TalonSettingsListener {
    override fun onSettingsChanged(settings: TalonSettings.State) {

        service<TalonApplicationService>().editorManager.settingsUpdated(settings)

    }
}