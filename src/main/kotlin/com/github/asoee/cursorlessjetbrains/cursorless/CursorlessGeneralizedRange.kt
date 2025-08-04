package com.github.asoee.cursorlessjetbrains.cursorless

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
sealed class CursorlessGeneralizedRange

@Serializable
@SerialName("line")
data class CursorlessLineRange(
    val type: String = "line",
    val start: Int,
    val end: Int
) : CursorlessGeneralizedRange()

@Serializable
@SerialName("character")
data class CursorlessCharacterRange(
    val type: String = "character",
    val start: CursorlessPosition,
    val end: CursorlessPosition
) : CursorlessGeneralizedRange()