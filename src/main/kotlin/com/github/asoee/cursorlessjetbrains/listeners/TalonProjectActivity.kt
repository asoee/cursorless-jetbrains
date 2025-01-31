package com.github.asoee.cursorlessjetbrains.listeners

import com.github.asoee.cursorlessjetbrains.commands.CommandRegistryService
import com.github.asoee.cursorlessjetbrains.services.FileCommandServerService
import com.github.asoee.cursorlessjetbrains.services.HttpCommandServerService
import com.github.asoee.cursorlessjetbrains.services.TalonProjectService
import com.intellij.openapi.components.service
import com.intellij.openapi.diagnostic.logger
import com.intellij.openapi.project.Project
import com.intellij.openapi.startup.ProjectActivity

class TalonProjectActivity : ProjectActivity {

    private val logger = logger<TalonProjectActivity>()
    override suspend fun execute(project: Project) {
        logger.info("Project opened: ${project.name}")
        val registry = project.service<CommandRegistryService>()
        registry.registerInternalCommands()
        service<HttpCommandServerService>()
        service<FileCommandServerService>()
        project.service<TalonProjectService>().onProjectOpened()
    }

}