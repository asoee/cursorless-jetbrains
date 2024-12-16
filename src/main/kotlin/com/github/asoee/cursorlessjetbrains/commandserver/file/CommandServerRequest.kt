package com.github.asoee.cursorlessjetbrains.commandserver.file

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

@Serializable
data class CommandServerRequest(
    val commandId: String,
    val args: List<JsonObject?>,
    val waitForFinish: Boolean,
    val returnCommandOutput: Boolean,
    val uuid: String,
)
