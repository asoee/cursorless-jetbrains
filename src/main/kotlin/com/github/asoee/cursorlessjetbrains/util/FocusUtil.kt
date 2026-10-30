package com.github.asoee.cursorlessjetbrains.util

import com.github.asoee.cursorlessjetbrains.terminal.TerminalShell
import com.intellij.openapi.project.Project
import com.intellij.openapi.project.ProjectManager
import com.intellij.openapi.util.SystemInfo
import com.intellij.openapi.wm.ToolWindowManager
import java.awt.Component
import javax.swing.SwingUtilities

/** Whether [component] is inside a Terminal tool window. */
fun isInTerminal(component: Component): Boolean {
    return ProjectManager.getInstance().openProjects.any { project ->
        ToolWindowManager.getInstance(project).getToolWindow("Terminal")?.component
            ?.let { SwingUtilities.isDescendingFrom(component, it) } == true
    }
}

/**
 * Whether [project]'s terminal runs PowerShell, where Ctrl+A selects what's been typed (in bash or zsh it moves to
 * the start of the line). If the Terminal plugin's settings can't be read, PowerShell is assumed on Windows, its
 * default shell there.
 */
fun isTerminalPowerShell(project: Project): Boolean {
    val shellPath = runCatching { project.getService(TerminalShell::class.java)?.shellPath() }.getOrNull()
        ?: return SystemInfo.isWindows
    val shell = shellPath.substringAfterLast('/').substringAfterLast('\\').lowercase()
    return shell.startsWith("powershell") || shell.startsWith("pwsh")
}
