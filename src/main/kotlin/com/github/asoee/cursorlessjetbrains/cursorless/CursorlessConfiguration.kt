package com.github.asoee.cursorlessjetbrains.cursorless

import kotlinx.serialization.Serializable

typealias HatStability = String

val HAT_STABILITY_STABLE: HatStability = "stable"
val HAT_STABILITY_GREEDY: HatStability = "greedy"
val HAT_STABILITY_BALANCED: HatStability = "balanced"

@Serializable
data class CursorlessConfiguration(
    val tokenHatSplittingMode: TokenHatSplittingMode,
    val wordSeparators: Array<String>,
    val experimental: ExperimentalConfiguration,
    val decorationDebounceDelayMs: Int,
    val commandHistory: Boolean,
    val debug: Boolean,
)

@Serializable
data class ExperimentalConfiguration(
    val snippetsDir: String?,
    val hatStability: HatStability,
    val keyboardTargetFollowsSelection: Boolean,
)

@Serializable
data class TokenHatSplittingMode(
    val preserveCase: Boolean,
    val lettersToPreserve: Array<String>,
    val symbolsToPreserve: Array<String>,
)

val DEFAULT_CONFIGURATION = CursorlessConfiguration(
    tokenHatSplittingMode = TokenHatSplittingMode(
        preserveCase = false,
        lettersToPreserve = arrayOf(),
        symbolsToPreserve = arrayOf(),
    ),
    wordSeparators = arrayOf("_"),
    experimental = ExperimentalConfiguration(
        snippetsDir = null,
        hatStability = HAT_STABILITY_BALANCED,
        keyboardTargetFollowsSelection = false,
    ),
    decorationDebounceDelayMs = 1,
    commandHistory = true,
    debug = false,
)