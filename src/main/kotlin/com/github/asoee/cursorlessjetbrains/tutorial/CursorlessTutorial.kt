package com.github.asoee.cursorlessjetbrains.tutorial

import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.Service
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindowManager
import java.util.concurrent.CopyOnWriteArrayList

/**
 * The tutorial's latest state from the engine, for the Cursorless tool window, as the VS Code extension posts it to
 * its tutorial webview
 */
@Service(Service.Level.PROJECT)
class CursorlessTutorial(private val project: Project) {

    companion object {
        const val TOOL_WINDOW_ID = "Cursorless"
    }

    @Volatile
    var stateJson: String = """{"type":"loading"}"""
        private set

    private val listeners = CopyOnWriteArrayList<(String) -> Unit>()

    fun stateChanged(stateJson: String) {
        this.stateJson = stateJson
        listeners.forEach { it(stateJson) }
    }

    fun addListener(listener: (String) -> Unit): () -> Unit {
        listeners.add(listener)
        return { listeners.remove(listener) }
    }

    /** Shows the Cursorless tool window without taking focus, as VS Code reveals its tutorial view */
    fun reveal() {
        ApplicationManager.getApplication().invokeLater({
            ToolWindowManager.getInstance(project).getToolWindow(TOOL_WINDOW_ID)?.show()
        }, project.disposed)
    }
}
