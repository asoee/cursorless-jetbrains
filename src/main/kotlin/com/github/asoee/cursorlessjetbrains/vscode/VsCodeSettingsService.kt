package com.github.asoee.cursorlessjetbrains.vscode

import com.github.asoee.cursorlessjetbrains.commandserver.file.FileWatcher
import com.intellij.openapi.Disposable
import com.intellij.openapi.components.Service
import com.intellij.openapi.util.SystemInfo
import com.intellij.util.EventDispatcher
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import java.nio.file.Path
import kotlin.io.path.Path
import kotlin.io.path.absolutePathString
import kotlin.io.path.exists

@OptIn(ExperimentalSerializationApi::class)
@Service(Service.Level.APP)
class VsCodeSettingsService : Disposable {

    private val vsCodeSettingsDir: Path?
    private val watcher: FileWatcher?

    private val eventDispatcher = EventDispatcher.create(VsCodeSettingsListener::class.java)

    init {
        this.vsCodeSettingsDir = detectVsCodeSettingsDir()
        if (this.vsCodeSettingsDir != null) {
            this.watcher = startWatcher()
        } else {
            this.watcher = null
        }
    }

    private fun detectVsCodeSettingsDir(): Path? {
        val settingsFile = "settings.json"
        when {
            SystemInfo.isWindows -> {
                val appData = Path(System.getenv("APPDATA"))
                val dir = "Code/User"
                if (appData.resolve(dir).resolve(settingsFile).exists()) {
                    return appData.resolve(dir)
                }
            }

            SystemInfo.isMac -> {
                val userHome = Path(System.getProperty("user.home"))
                val dir = "Library/Application Support/Code/User"
                if (userHome.resolve(dir).resolve(settingsFile).exists()) {
                    return userHome.resolve(dir)
                }
            }
        }
        return null
    }


    private fun startWatcher(): FileWatcher {
        println("FileCommandServer: Starting File Watcher...")
        val fw = FileWatcher(this.vsCodeSettingsDir!!, ::handleFileChanged)
        return fw
    }

    private fun handleFileChanged(path: Path) {
        println("FileCommandServer: File changed: ${path.absolutePathString()}")
        if (path.fileName.toString() == "settings.json") {
            val fullPath = this.vsCodeSettingsDir!!.resolve(path)
            println("FileCommandServer: settings.json changed")
            if (fullPath.exists()) {
                val jsonString = fullPath.toFile().readText()
                println("FileCommandServer: settings.json content: $jsonString")
                val jsonObject = Json.decodeFromString<JsonObject>(jsonString)
                val settings = VsCodeSettings(jsonObject)
                emitSettingsChanged(settings)
            }
        }
    }

    private fun emitSettingsChanged(settings: VsCodeSettings) {
        this.eventDispatcher.multicaster.onDidChangeSettings(settings)
    }

    fun addListener(listener: VsCodeSettingsListener) {
        this.eventDispatcher.addListener(listener)
    }


    override fun dispose() {
        this.watcher?.dispose()
    }

    private val json = Json { allowTrailingComma = true }

    fun currentSettings(): VsCodeSettings {
        val fullPath = this.vsCodeSettingsDir?.resolve("settings.json")
        if (fullPath != null && fullPath.exists()) {
            val jsonString = fullPath.toFile().readText()
            println("FileCommandServer: settings.json content: $jsonString")
            val jsonObject = json.decodeFromString<JsonObject>(jsonString)
            val settings = VsCodeSettings(jsonObject)
            return settings
        }
        return VsCodeSettings(JsonObject(emptyMap()))
    }

}