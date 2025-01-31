package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.components.Service
import com.intellij.openapi.project.Project

typealias CommandFactoryFunction = (project: Project, List<String>) -> VcCommand?

@Service(Service.Level.PROJECT)
class CommandRegistryService {

    private val commands = mutableMapOf<String, CommandFactoryFunction>()

    fun registerCommand(name: String, factory: CommandFactoryFunction) {
        commands[name] = factory
    }

    fun getCommand(request: CommandRequest): VcCommand? {
        val factoryFunc = commands[request.command] ?: return null
        return factoryFunc(request.project, request.args)
    }

    fun registerInternalCommands() {
        registerCommand("range", LineRangeCommand::fromArgs)
        registerCommand("action", IDEActionCommand::fromArgs)
        registerCommand("goto", GotoCommand::fromArgs)
        registerCommand("clone", CloneLineCommand::fromArgs)
        registerCommand("extend", ExtendCommand::fromArgs)
        registerCommand("location", LocationCommand::fromArgs)
        registerCommand("find", FindCommand::fromArgs)
    }

}