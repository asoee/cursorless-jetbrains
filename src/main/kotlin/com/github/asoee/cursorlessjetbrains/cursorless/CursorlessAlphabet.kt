package com.github.asoee.cursorlessjetbrains.cursorless

class CursorlessAlphabet {

    companion object {
        val alphabet = mapOf(
            'a' to "air",
            'b' to "bat",
            'c' to "cap",
            'd' to "drum",
            'e' to "each",
            'f' to "fine",
            'g' to "gust",
            'h' to "harp",
            'i' to "sit",
            'j' to "junk",
            'k' to "crunch",
            'l' to "look",
            'm' to "made",
            'n' to "near",
            'o' to "odd",
            'p' to "pit",
            'q' to "queen",
            'r' to "red",
            's' to "sun",
            't' to "trap",
            'u' to "urge",
            'v' to "van",
            'w' to "whale",
            'x' to "plex",
            'y' to "yank",
            'z' to "zip"
        )

        fun spokenForm(letter: String): String {
            return alphabet[letter[0]] ?: letter
        }
    }
}