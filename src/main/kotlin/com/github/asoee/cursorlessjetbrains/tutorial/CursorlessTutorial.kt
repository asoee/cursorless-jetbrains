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
        const val TUTORIAL_TAB = "Tutorial"
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

    /**
     * Shows the Cursorless tool window without taking focus, as VS Code reveals its sidebar; with [showTutorial], on
     * the tutorial's tab
     */
    fun reveal(showTutorial: Boolean = true) {
        ApplicationManager.getApplication().invokeLater({
            val toolWindow = ToolWindowManager.getInstance(project).getToolWindow(TOOL_WINDOW_ID) ?: return@invokeLater
            toolWindow.show()
            if (showTutorial) {
                toolWindow.contentManager.findContent(TUTORIAL_TAB)?.let { toolWindow.contentManager.setSelectedContent(it) }
            }
        }, project.disposed)
    }
}
