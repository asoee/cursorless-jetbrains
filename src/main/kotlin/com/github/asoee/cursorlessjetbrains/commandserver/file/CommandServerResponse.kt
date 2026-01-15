package com.github.asoee.cursorlessjetbrains.commandserver.file

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
data class CommandServerResponse(
    val uuid: String,
    val warnings: Array<String>,
    val error: String?,
    val returnValue: TalonCommandReponse,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as CommandServerResponse

        if (uuid != other.uuid) return false
        if (!warnings.contentEquals(other.warnings)) return false
        if (error != other.error) return false
        if (returnValue != other.returnValue) return false

        return true
    }

    override fun hashCode(): Int {
        var result = uuid.hashCode()
        result = 31 * result + warnings.contentHashCode()
        result = 31 * result + (error?.hashCode() ?: 0)
        result = 31 * result + returnValue.hashCode()
        return result
    }
}


@Serializable
data class TalonCommandReponse(
    val returnValue: JsonElement?,
)