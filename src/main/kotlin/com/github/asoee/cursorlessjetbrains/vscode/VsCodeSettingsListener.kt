package com.github.asoee.cursorlessjetbrains.vscode

import java.util.*

public interface VsCodeSettingsListener : EventListener {
    public fun onDidChangeSettings(settings: VsCodeSettings): Unit
}