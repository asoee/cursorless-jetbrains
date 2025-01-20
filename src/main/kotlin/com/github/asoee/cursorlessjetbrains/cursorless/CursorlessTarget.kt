package com.github.asoee.cursorlessjetbrains.cursorless

class CursorlessTarget(
    val color: String,
    val shape: String,
    val letter: String
) {

    companion object {
        private const val DEFAULT = "default"
    }

    override fun toString(): String {
        return "CursorlessTarget(color='$color', shape='$shape', letter='$letter')"
    }

    fun spokenForm(): String {
        val parts = mutableListOf<String>()
        if (color != DEFAULT) {
            parts.add(color)
        }
        if (shape != DEFAULT) {
            parts.add(color)
        }
        parts.add(CursorlessAlphabet.spokenForm(letter))
        return parts.joinToString(" ")
    }
}