package com.github.asoee.cursorlessjetbrains.commandserver.file

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
data class CommandServerResponse(
    val uuid: String,
    val warnings: Array<String>,
    val error: String?,
    val returnValue: TalonCommandReponse,
)


@Serializable
data class TalonCommandReponse(
    val returnValue: JsonElement?,
)