package com.github.asoee.cursorlessjetbrains.settings

import com.github.asoee.cursorlessjetbrains.services.TalonProjectService
import com.intellij.openapi.components.service
import com.intellij.openapi.project.Project

class TalonSettingsChangeListener(private val project: Project) : TalonSettingsListener {
    override fun onSettingsChanged(settings: TalonSettings.State) {

        val applicationService = project.service<TalonProjectService>()

        applicationService.editorManager.settingsUpdated(settings)

        applicationService.settingsUpdated(settings)
    }
}