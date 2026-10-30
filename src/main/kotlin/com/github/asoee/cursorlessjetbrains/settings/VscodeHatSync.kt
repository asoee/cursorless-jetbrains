package com.github.asoee.cursorlessjetbrains.settings

import com.intellij.notification.NotificationAction
import com.intellij.notification.NotificationGroupManager
import com.intellij.notification.NotificationType
import com.intellij.openapi.Disposable
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.Service
import com.intellij.openapi.diagnostic.logger
import com.intellij.openapi.util.SystemInfo
import com.intellij.util.concurrency.AppExecutorUtil
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonPrimitive
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit

/**
 * Keeps the enabled hats in step with Talon. cursorless-talon only builds spoken forms for the hats enabled in
 * VS Code's settings.json (`cursorless.hatEnablement.*`), whichever editor is in use, so the plugin reads the same
 * file and copies the enablement and penalties into [TalonSettings].
 */
@Service(Service.Level.APP)
class VscodeHatSync : Disposable {

    private val logger = logger<VscodeHatSync>()

    private var poller: ScheduledFuture<*>? = null
    private var lastPath: Path? = null
    private var lastModified: Long = -1

    @Synchronized
    fun start() {
        if (poller != null) {
            return
        }
        poller = AppExecutorUtil.getAppScheduledExecutorService()
            .scheduleWithFixedDelay({ syncIfChanged() }, 0, 5, TimeUnit.SECONDS)
    }

    private fun syncIfChanged() {
        try {
            if (!TalonSettings.instance.state.syncHatsFromVscode) {
                return
            }
            val path = settingsPath() ?: return
            val modified = Files.getLastModifiedTime(path).toMillis()
            if (!markRead(path, modified)) {
                return
            }

            val hats = parseHatSettings(Files.readString(path))
            ApplicationManager.getApplication().invokeLater {
                val settings = TalonSettings.instance
                if (applyHatSettings(hats, settings.state)) {
                    logger.info("Hat enablement updated from $path")
                    settings.fireSettingsChanged()
                    notifyUpdated(path)
                }
            }
        } catch (e: Exception) {
            logger.warn("Could not read hat settings from VS Code's settings.json", e)
        }
    }

    /** Records [path] at [modified] as read; false if it already was */
    @Synchronized
    private fun markRead(path: Path, modified: Long): Boolean {
        if (path == lastPath && modified == lastModified) {
            return false
        }
        lastPath = path
        lastModified = modified
        return true
    }

    /** Says the hats changed, so they don't seem to change by themselves (e.g. the first sync after an update) */
    private fun notifyUpdated(path: Path) {
        NotificationGroupManager.getInstance().getNotificationGroup("Cursorless")
            .createNotification(
                "Cursorless hats updated from VS Code",
                "The enabled hat colors and shapes now match $path, which Talon uses for its spoken forms.",
                NotificationType.INFORMATION,
            )
            .addAction(NotificationAction.createSimpleExpiring("Stop syncing") {
                TalonSettings.instance.state.syncHatsFromVscode = false
            })
            .notify(null)
    }

    /** Re-reads settings.json on the next check, even if it hasn't changed. */
    @Synchronized
    fun resync() {
        lastModified = -1
    }

    override fun dispose() {
        poller?.cancel(false)
    }

    companion object {

        // Same defaults as cursorless-talon's decorated_mark.py
        private val DEFAULT_COLOR_ENABLEMENT = mapOf(
            "blue" to true, "green" to true, "red" to true, "pink" to true, "yellow" to true,
            "userColor1" to false, "userColor2" to false,
        )

        /** Same candidates as cursorless-talon's vscode_settings.py; the most recently modified file wins. */
        fun settingsPath(): Path? {
            val home = Paths.get(System.getProperty("user.home"))
            val candidates = when {
                SystemInfo.isWindows -> {
                    val appData = System.getenv("APPDATA")?.let { Paths.get(it) } ?: return null
                    listOf(appData.resolve("Code/User/settings.json"), appData.resolve("VSCodium/User/settings.json"))
                }

                SystemInfo.isMac -> {
                    val support = home.resolve("Library/Application Support")
                    listOf(support.resolve("Code/User/settings.json"), support.resolve("VSCodium/User/settings.json"))
                }

                else -> {
                    val config = System.getenv("XDG_CONFIG_HOME")?.let { Paths.get(it) } ?: home.resolve(".config")
                    val flatpak = home.resolve(".var/app")
                    listOf(
                        config.resolve("Code/User/settings.json"),
                        config.resolve("VSCodium/User/settings.json"),
                        config.resolve("Code - OSS/User/settings.json"),
                        config.resolve("Cursor/User/settings.json"),
                        flatpak.resolve("com.visualstudio.code/config/Code/User/settings.json"),
                        flatpak.resolve("com.vscodium.codium/config/VSCodium/User/settings.json"),
                        flatpak.resolve("com.visualstudio.code-oss/config/Code - OSS/User/settings.json"),
                    )
                }
            }
            return candidates.filter { Files.exists(it) }.maxByOrNull { Files.getLastModifiedTime(it).toMillis() }
        }

        fun parseHatSettings(settingsJson: String): VscodeHatSettings {
            val settings = Json.parseToJsonElement(stripJsonc(settingsJson)) as JsonObject

            fun booleans(key: String) = (settings[key] as? JsonObject)
                ?.mapNotNull { (name, value) -> value.jsonPrimitive.booleanOrNull?.let { name to it } }
                ?.toMap() ?: emptyMap()

            fun ints(key: String) = (settings[key] as? JsonObject)
                ?.mapNotNull { (name, value) -> value.jsonPrimitive.intOrNull?.let { name to it } }
                ?.toMap() ?: emptyMap()

            return VscodeHatSettings(
                colorEnablement = DEFAULT_COLOR_ENABLEMENT + booleans("cursorless.hatEnablement.colors"),
                // Every shape except the default one is off unless enabled
                shapeEnablement = booleans("cursorless.hatEnablement.shapes"),
                colorPenalties = ints("cursorless.hatPenalties.colors"),
                shapePenalties = ints("cursorless.hatPenalties.shapes"),
            )
        }

        /** Applies [hats] to [state]; returns whether anything changed. The default color and shape stay enabled. */
        fun applyHatSettings(hats: VscodeHatSettings, state: TalonSettings.State): Boolean {
            var changed = false
            val shapes = state.hatShapeSettings.map { shape ->
                val enabled = shape.shapeName == "default" || hats.shapeEnablement[shape.shapeName] == true
                val penalty = hats.shapePenalties[shape.shapeName] ?: shape.penalty
                if (enabled != shape.enabled || penalty != shape.penalty) {
                    changed = true
                }
                shape.copy(enabled = enabled, penalty = penalty)
            }
            val colors = state.hatColorSettings.map { color ->
                val enabled = color.colorName == "default" || hats.colorEnablement[color.colorName] == true
                val penalty = hats.colorPenalties[color.colorName] ?: color.penalty
                if (enabled != color.enabled || penalty != color.penalty) {
                    changed = true
                }
                color.copy(enabled = enabled, penalty = penalty)
            }
            state.hatShapeSettings = shapes
            state.hatColorSettings = colors
            return changed
        }

        /** Turns VS Code's JSON-with-comments into plain JSON: drops comments and trailing commas outside strings. */
        fun stripJsonc(text: String): String {
            val out = StringBuilder(text.length)
            var i = 0
            while (i < text.length) {
                val c = text[i]
                when {
                    c == '"' -> {
                        val end = endOfString(text, i)
                        out.append(text, i, end)
                        i = end
                    }

                    text.startsWith("//", i) -> {
                        while (i < text.length && text[i] != '\n') i++
                    }

                    text.startsWith("/*", i) -> {
                        val end = text.indexOf("*/", i + 2)
                        i = if (end < 0) text.length else end + 2
                    }

                    c == ',' && nextSignificant(text, i + 1).let { it == '}' || it == ']' } -> i++

                    else -> {
                        out.append(c)
                        i++
                    }
                }
            }
            return out.toString()
        }

        private fun endOfString(text: String, start: Int): Int {
            var i = start + 1
            while (i < text.length) {
                when (text[i]) {
                    '\\' -> i += 2
                    '"' -> return i + 1
                    else -> i++
                }
            }
            return text.length
        }

        /** The next character after [start] that isn't whitespace or inside a comment. */
        private fun nextSignificant(text: String, start: Int): Char? {
            var i = start
            while (i < text.length) {
                when {
                    text[i].isWhitespace() -> i++
                    text.startsWith("//", i) -> while (i < text.length && text[i] != '\n') i++
                    text.startsWith("/*", i) -> {
                        val end = text.indexOf("*/", i + 2)
                        i = if (end < 0) text.length else end + 2
                    }

                    else -> return text[i]
                }
            }
            return null
        }
    }
}

data class VscodeHatSettings(
    val colorEnablement: Map<String, Boolean>,
    val shapeEnablement: Map<String, Boolean>,
    val colorPenalties: Map<String, Int>,
    val shapePenalties: Map<String, Int>,
)
