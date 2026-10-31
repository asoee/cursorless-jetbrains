package com.github.asoee.cursorlessjetbrains.settings

import com.github.asoee.cursorlessjetbrains.cursorless.ALL_COLORS
import com.github.asoee.cursorlessjetbrains.cursorless.ALL_SHAPES
import com.github.asoee.cursorlessjetbrains.cursorless.DEFAULT_COLORS
import com.github.asoee.cursorlessjetbrains.cursorless.DEFAULT_ENABLED_COLORS
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.PersistentStateComponent
import com.intellij.openapi.components.State
import com.intellij.openapi.components.Storage
import com.intellij.ui.JBColor
import com.intellij.util.xmlb.annotations.Attribute
import org.jetbrains.annotations.NonNls
import org.jetbrains.annotations.NotNull
import java.awt.Color

typealias SettingsUpdateFunction = (TalonSettings.State) -> Unit

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
        var maxFileSizeKb: Int = 1024 // Maximum file size in KB that can be sent to Cursorless (default 1MB)
        var syncHatsFromVscode: Boolean = true // Take hat enablement and penalties from VS Code's settings.json, as Talon does
        var commandHistory: Boolean = false // Record commands for "cursorless stats"; opt-in, as in VS Code
        var debugLogging: Boolean = false // The engine's debug log, e.g. why a tutorial step left the path; VS Code's cursorless.debug
        var hatShapeSettings: List<ShapeSetting> = shapeFromDefaults()
        var hatColorSettings: List<ColorSetting> = colorFromDefaults()
        var scopeVisualizerColorSettings: List<ScopeVisualizerColorSetting> = scopeVisualizerColorsFromDefaults()
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

    /** The colors of one kind of range the scope visualizer draws, as VS Code's cursorless.scopeVisualizer.colors */
    data class ScopeVisualizerColorSetting(
        /** "domain", "content", "removal" or "iteration" */
        @Attribute("rangeType")
        val rangeType: String = "",
        @Attribute("darkBackground", converter = HexColorConverter::class)
        var darkBackground: Color = JBColor.BLACK,
        @Attribute("darkBorder", converter = HexColorConverter::class)
        var darkBorder: Color = JBColor.BLACK,
        @Attribute("lightBackground", converter = HexColorConverter::class)
        var lightBackground: Color = JBColor.BLACK,
        @Attribute("lightBorder", converter = HexColorConverter::class)
        var lightBorder: Color = JBColor.BLACK,
    )

    private var myState = State()

    override fun getState(): State {
        return myState
    }

    override fun loadState(@NotNull state: State) {
        myState = state
    }

    fun fireSettingsChanged() {
        val messageBus = ApplicationManager.getApplication().messageBus
        messageBus.syncPublisher(TalonSettingsListener.TOPIC).onSettingsChanged(instance.state)
    }


    fun changeAndNotify(updater: SettingsUpdateFunction) {
        updater(instance.state)
        fireSettingsChanged()
    }

    companion object {
        val instance: TalonSettings
            get() = ApplicationManager.getApplication()
                .getService(TalonSettings::class.java)

        fun shapeFromDefaults(): List<ShapeSetting> {
            return ALL_SHAPES.map { snapeName ->
                ShapeSetting(
                    snapeName,  // name
                    snapeName == "default", // enabled
                    if (snapeName == "default") 0 else 1 // penalty
                )
            }
        }

        /** The range types the scope visualizer draws, in the order the settings page lists them */
        val SCOPE_VISUALIZER_RANGE_TYPES = listOf("domain", "content", "removal", "iteration")

        /** VS Code's defaults for cursorless.scopeVisualizer.colors.dark and .light (their solid borders) */
        fun scopeVisualizerColorsFromDefaults(): List<ScopeVisualizerColorSetting> {
            fun color(hex: String) = ColorUtil.fromHexString(hex)
            return listOf(
                ScopeVisualizerColorSetting(
                    "domain", color("#00e1ff18"), color("#ebdeec84"), color("#00e1ff18"), color("#19171984")
                ),
                ScopeVisualizerColorSetting(
                    "content", color("#ad00bc5b"), color("#ee00ff78"), color("#ad00bc5b"), color("#ee00ff78")
                ),
                ScopeVisualizerColorSetting(
                    "removal", color("#ff00002d"), color("#ff000078"), color("#ff00002d"), color("#ff000078")
                ),
                ScopeVisualizerColorSetting(
                    "iteration", color("#00725f6c"), color("#00ffd578"), color("#00725f6c"), color("#00ffd578")
                ),
            )
        }

        fun colorFromDefaults(): List<ColorSetting> {
            return ALL_COLORS.map { colorName ->
                ColorSetting(
                    colorName,  // name
                    DEFAULT_ENABLED_COLORS.contains(colorName), // enabled
                    if (colorName == "default") 0 else 1, // penalty
                    Color.decode(DEFAULT_COLORS["dark"]!![colorName]), // dark
                    Color.decode(DEFAULT_COLORS["light"]!![colorName]) // light
                )
            }
        }
    }
}