package com.github.asoee.cursorlessjetbrains.commandserver.file

import com.jetbrains.rd.generator.nova.PredefinedType
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

@Serializable
data class CommandServerResponse(
    val uuid: String,
    val warnings: Array<String>,
    val error: String?,
    val returnValue: TalonCommandReponse,
)


@Serializable
data class TalonCommandReponse(
    val returnValue: String?,
)