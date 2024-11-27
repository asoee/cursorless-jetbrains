package com.github.asoee.cursorlessjetbrains.commands

class CommandRequest {

    var command: String = ""
    var args: List<String> = emptyList()

    constructor(command: String, args: List<String>) {
        this.command = command
        this.args = args
    }

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