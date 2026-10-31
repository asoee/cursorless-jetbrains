package com.github.asoee.cursorlessjetbrains.scopes

import com.github.asoee.cursorlessjetbrains.commands.CommandExecutorService
import com.github.asoee.cursorlessjetbrains.commands.ScopeVisualizerCommand
import com.github.asoee.cursorlessjetbrains.services.TalonProjectService
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.Service
import com.intellij.openapi.components.service
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.project.Project
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import java.util.concurrent.CopyOnWriteArrayList

/** The Scopes list as the engine sends it: every scope type, with its support in the active editor */
@Serializable
data class ScopeList(val languageId: String? = null, val items: List<ScopeListItem> = emptyList())

@Serializable
data class ScopeListItem(
    val scopeType: JsonObject,
    /** "present", "supported" or "unsupported" in the active editor */
    val support: String,
    /** Empty when the scope can't be spoken */
    val spokenForms: List<String> = emptyList(),
    /** Why there are no spoken forms: "requiresTalonUpdate" or "disabled" */
    val unspokenReason: String? = null,
    val name: String,
    val isLanguageSpecific: Boolean = false,
    val isVisualized: Boolean = false,
    /** For present scopes: "exact" when the selection is one of the scope's targets, "contains" when inside one */
    val containment: String? = null,
    val docsUrl: String,
) {
    /** The spoken forms as VS Code's Scopes view shows them */
    val label: String
        get() = if (spokenForms.isEmpty()) "-" else spokenForms.joinToString(" | ") { "\"$it\"" }
}

/**
 * VS Code's "Scopes" view for the Cursorless tool window. The engine sends the list only while the tool window shows
 * it, since working out each scope's support isn't cheap.
 */
@Service(Service.Level.PROJECT)
class CursorlessScopeList(private val project: Project) {

    private val json = Json { ignoreUnknownKeys = true }

    @Volatile
    var list: ScopeList = ScopeList()
        private set

    @Volatile
    private var visible = false

    private val listeners = CopyOnWriteArrayList<(ScopeList) -> Unit>()

    fun changed(scopeListJson: String) {
        val list = try {
            json.decodeFromString<ScopeList>(scopeListJson)
        } catch (e: Exception) {
            thisLogger().warn("Could not read the Scopes list from the engine", e)
            return
        }
        this.list = list
        listeners.forEach { it(list) }
    }

    fun addListener(listener: (ScopeList) -> Unit): () -> Unit {
        listeners.add(listener)
        return { listeners.remove(listener) }
    }

    /** The list came on screen or went off it */
    fun setVisible(visible: Boolean) {
        if (this.visible == visible) return
        this.visible = visible
        sendVisible()
    }

    /** A new engine knows nothing of the list, so tell it again if it's on screen */
    fun engineStarted() {
        if (visible) sendVisible()
    }

    /** Shows the scope in the visualizer, as a click in VS Code's list does, or hides it if it's already shown */
    fun toggle(item: ScopeListItem) {
        visualize(item.takeUnless { it.isVisualized }, "content")
    }

    /** Shows the scope in the visualizer with the given visualization type, or hides the visualizer for null */
    fun visualize(item: ScopeListItem?, visualizationType: String) {
        val command = ScopeVisualizerCommand(project, item?.scopeType?.toString(), item?.let { visualizationType })
        ApplicationManager.getApplication().executeOnPooledThread {
            project.service<CommandExecutorService>().execute(command)
        }
    }

    private fun sendVisible() {
        val visible = visible
        ApplicationManager.getApplication().executeOnPooledThread {
            try {
                project.service<TalonProjectService>().cursorlessEngine.setScopeListVisible(visible)
            } catch (e: Exception) {
                // Not started yet: engineStarted sends it
                thisLogger().info("Scopes list not sent to the engine yet: ${e.message}")
            }
        }
    }
}
