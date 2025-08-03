package com.github.asoee.cursorlessjetbrains.cursorless

import kotlinx.serialization.Serializable

typealias HatStability = String

const val HAT_STABILITY_STABLE: HatStability = "stable"
const val HAT_STABILITY_GREEDY: HatStability = "greedy"
const val HAT_STABILITY_BALANCED: HatStability = "balanced"

@Serializable
data class CursorlessConfiguration(
    val tokenHatSplittingMode: TokenHatSplittingMode,
    val wordSeparators: Array<String>,
    val experimental: ExperimentalConfiguration,
    val decorationDebounceDelayMs: Int,
    val commandHistory: Boolean,
    val debug: Boolean,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as CursorlessConfiguration

        if (decorationDebounceDelayMs != other.decorationDebounceDelayMs) return false
        if (commandHistory != other.commandHistory) return false
        if (debug != other.debug) return false
        if (tokenHatSplittingMode != other.tokenHatSplittingMode) return false
        if (!wordSeparators.contentEquals(other.wordSeparators)) return false
        if (experimental != other.experimental) return false

        return true
    }

    override fun hashCode(): Int {
        var result = decorationDebounceDelayMs
        result = 31 * result + commandHistory.hashCode()
        result = 31 * result + debug.hashCode()
        result = 31 * result + tokenHatSplittingMode.hashCode()
        result = 31 * result + wordSeparators.contentHashCode()
        result = 31 * result + experimental.hashCode()
        return result
    }
}

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
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as TokenHatSplittingMode

        if (preserveCase != other.preserveCase) return false
        if (!lettersToPreserve.contentEquals(other.lettersToPreserve)) return false
        if (!symbolsToPreserve.contentEquals(other.symbolsToPreserve)) return false

        return true
    }

    override fun hashCode(): Int {
        var result = preserveCase.hashCode()
        result = 31 * result + lettersToPreserve.contentHashCode()
        result = 31 * result + symbolsToPreserve.contentHashCode()
        return result
    }
}

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