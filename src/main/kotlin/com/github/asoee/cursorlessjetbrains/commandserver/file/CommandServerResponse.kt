package com.github.asoee.cursorlessjetbrains.commandserver.file

import kotlinx.serialization.Serializable

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