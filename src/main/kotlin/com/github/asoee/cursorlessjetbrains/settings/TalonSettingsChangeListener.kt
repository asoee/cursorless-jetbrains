package com.github.asoee.cursorlessjetbrains.settings

import com.github.asoee.cursorlessjetbrains.services.TalonApplicationService
import com.intellij.openapi.components.service

class TalonSettingsChangeListener : TalonSettingsListener {
    override fun onSettingsChanged(settings: TalonSettings.State) {

        val applicationService = service<TalonApplicationService>()

        applicationService.editorManager.settingsUpdated(settings)

        applicationService.settingsUpdated(settings)
    }
}