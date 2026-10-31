package com.github.asoee.cursorlessjetbrains.action

import com.github.asoee.cursorlessjetbrains.settings.HatsToggle
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.project.DumbAwareAction

/** Turns the hats off in every editor, or back on, for this session; Talon's cursorless.toggleDecorations does the same */
class CursorlessToggleCommand : DumbAwareAction() {

    override fun actionPerformed(event: AnActionEvent) {
        HatsToggle.toggle()
    }
}
