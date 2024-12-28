package com.github.asoee.cursorlessjetbrains.settings

import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.PersistentStateComponent
import com.intellij.openapi.components.State
import com.intellij.openapi.components.Storage
import com.intellij.ui.JBColor
import com.intellij.util.xmlb.annotations.Attribute
import org.jetbrains.annotations.NonNls
import org.jetbrains.annotations.NotNull
import java.awt.Color


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
        var hatShapeSettings: List<ShapeSetting> = listOf(ShapeSetting("default", true, 0))
        var hatColorSettings: List<ColorSetting> = listOf(ColorSetting("default", true, 0))
    }

    data class ShapeSetting(
        @Attribute("shapeName")
        val shapeName: String = "",
        @Attribute("enabled")
        var enabled: Boolean = false,
        @Attribute("penalty")
        var penalty: Int = -1
    )

    data class ColorSetting(
        @Attribute("name")
        val colorName: String = "",
        @Attribute("enabled")
        var enabled: Boolean = false,
        @Attribute("penalty")
        var penalty: Int = -1,
        @Attribute("dark", converter = HexColorConverter::class)
        var dark: Color = JBColor.BLACK,
        @Attribute("light", converter = HexColorConverter::class)
        var light: Color = JBColor.BLACK,
    )

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