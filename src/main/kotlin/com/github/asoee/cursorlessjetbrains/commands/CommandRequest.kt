package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.project.Project

class CommandRequest(val project: Project, val command: String, val args: List<String>) {

    override fun toString(): String {
        return "CommandRequest(command=$command, args=$args)"
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other == null || javaClass != other.javaClass) return false

        other as CommandRequest

        if (command != other.command) return false
        if (args != other.args) return false

        return true
    }

    override fun hashCode(): Int {
        var result = command.hashCode()
        result = 31 * result + args.hashCode()
        return result
    }
}