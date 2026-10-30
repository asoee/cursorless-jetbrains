package com.github.asoee.cursorlessjetbrains.terminal

import com.intellij.openapi.project.Project
import org.jetbrains.plugins.terminal.TerminalProjectOptionsProvider

/**
 * The project's terminal shell, from the Terminal plugin's settings. Registered only when that plugin is installed
 * (cursorless-terminal.xml) rather than as a light service, so project.getService gives null without it.
 */
class TerminalShell(private val project: Project) {

    /** The shell the terminal starts, e.g. "powershell.exe" or "/bin/zsh" */
    fun shellPath(): String? = TerminalProjectOptionsProvider.getInstance(project).shellPath
}
