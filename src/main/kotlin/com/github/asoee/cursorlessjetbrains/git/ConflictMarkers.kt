package com.github.asoee.cursorlessjetbrains.git

/**
 * Git conflict markers in a file, for "git accept": keep the side of the conflict the caret is in, as VS Code's
 * merge-conflict.accept.selection does
 */
object ConflictMarkers {

    private const val CURRENT = "<<<<<<<"
    private const val BASE = "|||||||"
    private const val SEPARATOR = "======="
    private const val INCOMING = ">>>>>>>"

    /** Replace [firstLine]..[lastLine] (inclusive) with [keep] */
    data class Resolution(val firstLine: Int, val lastLine: Int, val keep: List<String>)

    class NotInSideException(message: String) : IllegalArgumentException(message)

    /**
     * Resolves the conflict around [line] (0-based) of [lines]: the current side (between <<<<<<< and ======= or a
     * diff3 |||||||), the base, or the incoming side (between ======= and >>>>>>>). A caret on a <<<<<<< or >>>>>>>
     * line takes that side.
     */
    fun resolveAt(lines: List<String>, line: Int): Resolution {
        // The nearest start marker above, unless the conflict it starts ends above the caret
        var first = line
        while (first >= 0 && !lines[first].startsWith(CURRENT)) {
            if (first < line && lines[first].startsWith(INCOMING)) throw NotInSideException("The caret isn't in a conflict")
            first--
        }
        if (first < 0) throw NotInSideException("The caret isn't in a conflict")
        var last = maxOf(line, first + 1)
        while (last < lines.size && !lines[last].startsWith(INCOMING)) {
            if (last > line && lines[last].startsWith(CURRENT)) throw NotInSideException("The conflict isn't closed")
            last++
        }
        if (last >= lines.size) throw NotInSideException("The conflict isn't closed")

        val inside = (first + 1 until last)
        val separator = inside.firstOrNull { lines[it].startsWith(SEPARATOR) }
            ?: throw NotInSideException("The conflict has no ======= line")
        val base = inside.firstOrNull { it < separator && lines[it].startsWith(BASE) }
        val currentEnd = base ?: separator

        val keep = when {
            line == first || line in first + 1 until currentEnd -> lines.subList(first + 1, currentEnd)
            base != null && line in base until separator -> lines.subList(base + 1, separator)
            line == last || line in separator + 1 until last -> lines.subList(separator + 1, last)
            else -> throw NotInSideException("Put the caret in one side of the conflict, not on its ======= line")
        }
        return Resolution(first, last, keep)
    }
}
