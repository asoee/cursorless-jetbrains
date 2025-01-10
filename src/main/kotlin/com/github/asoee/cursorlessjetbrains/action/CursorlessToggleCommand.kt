package com.github.asoee.cursorlessjetbrains.action

import com.github.asoee.cursorlessjetbrains.settings.TalonSettings
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent

class CursorlessToggleCommand : AnAction() {

    override fun actionPerformed(event: AnActionEvent) {
        val settings = TalonSettings.instance
        settings.changeAndNotify { it.enableHats = !it.enableHats }
    }
}