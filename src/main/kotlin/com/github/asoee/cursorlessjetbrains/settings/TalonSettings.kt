package com.github.asoee.cursorlessjetbrains.settings

import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.PersistentStateComponent
import com.intellij.openapi.components.State
import com.intellij.openapi.components.Storage
import org.jetbrains.annotations.NonNls
import org.jetbrains.annotations.NotNull


@State(
    name = "com.github.asoee.cursorlessjetbrains.settings.TalonSettings",
    storages = [Storage("TalonSettingsPlugin.xml")]
)
class TalonSettings

    : PersistentStateComponent<TalonSettings.State> {
    class State {
        @NonNls
        var enableHats: Boolean = true
        var hatScaleFactor: Int = 100
        var hatVerticalOffset: Int = 0
        var flashRangeDuration: Int = 100
    }

    private var myState = State()

    override fun getState(): State {
        return myState
    }

    override fun loadState(@NotNull state: State) {
        myState = state
    }

    companion object {
        val instance: TalonSettings
            get() = ApplicationManager.getApplication()
                .getService(TalonSettings::class.java)
    }
}