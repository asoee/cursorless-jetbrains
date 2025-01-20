package com.github.asoee.cursorlessjetbrains.cursorless

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
class CursorlessFlashRange(
    val editorId: String,
    val range: GeneralizedRange,
    val style: String,
)

@Serializable
sealed interface GeneralizedRange

@Serializable
@SerialName("line")
class FlashLineRange(val start: Int, val end: Int) : GeneralizedRange

@Serializable
@SerialName("character")
class FlashCharacterRange(val start: CursorlessPosition, val end: CursorlessPosition) : GeneralizedRange