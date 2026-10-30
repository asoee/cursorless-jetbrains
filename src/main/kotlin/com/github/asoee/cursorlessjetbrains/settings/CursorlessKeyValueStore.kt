package com.github.asoee.cursorlessjetbrains.settings

import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.PersistentStateComponent
import com.intellij.openapi.components.State
import com.intellij.openapi.components.Storage

/**
 * The Cursorless engine's key-value store (tutorial progress, dismissed warnings), persisted across restarts.
 * Values are JSON, as the engine writes them.
 */
@State(
    name = "com.github.asoee.cursorlessjetbrains.settings.CursorlessKeyValueStore",
    storages = [Storage("CursorlessKeyValueStore.xml")]
)
class CursorlessKeyValueStore : PersistentStateComponent<CursorlessKeyValueStore.State> {

    class State {
        var values: MutableMap<String, String> = mutableMapOf()
    }

    private var myState = State()

    // The engine reads and writes from its own threads while the IDE saves on another, so the map is only touched
    // under this lock, and saving gets a copy
    @Synchronized
    override fun getState(): State {
        return State().also { it.values = myState.values.toMutableMap() }
    }

    @Synchronized
    override fun loadState(state: State) {
        myState = state
    }

    @Synchronized
    fun get(key: String): String? {
        return myState.values[key]
    }

    @Synchronized
    fun set(key: String, valueJson: String) {
        myState.values[key] = valueJson
    }

    companion object {
        val instance: CursorlessKeyValueStore
            get() = ApplicationManager.getApplication().getService(CursorlessKeyValueStore::class.java)
    }
}
