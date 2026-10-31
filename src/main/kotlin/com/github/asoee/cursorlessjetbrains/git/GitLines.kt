package com.github.asoee.cursorlessjetbrains.git

import com.intellij.diff.comparison.ComparisonManager
import com.intellij.diff.comparison.ComparisonPolicy
import com.intellij.openapi.progress.DumbProgressIndicator

/**
 * Line-level staging, as VS Code's git.stageSelectedRanges / unstageSelectedRanges: which version of a file the index
 * should hold so that only the changes on the selected lines are staged or unstaged. Texts use "\n" line breaks.
 */
object GitLines {

    /** A changed block: original lines [origStart, origEnd) became modified lines [modStart, modEnd) */
    private data class Change(val origStart: Int, val origEnd: Int, val modStart: Int, val modEnd: Int)

    /**
     * The index content with the working text's changes on lines [firstLine]..[lastLine] (0-based, inclusive, in the
     * working text) staged
     */
    fun stage(index: String, working: String, firstLine: Int, lastLine: Int): String {
        val selected = diff(index, working).mapNotNull { intersect(it, firstLine, lastLine) }
        return replace(index.split("\n"), selected.map { Triple(it.origStart, it.origEnd, working.split("\n").subList(it.modStart, it.modEnd)) })
    }

    /**
     * The index content with its staged changes on lines [firstLine]..[lastLine] of the working text unstaged, i.e.
     * those lines put back to their [head] version
     */
    fun unstage(head: String, index: String, working: String, firstLine: Int, lastLine: Int): String {
        val (indexFirst, indexLast) = toIndexLines(diff(index, working), firstLine, lastLine)
        val selected = diff(head, index).mapNotNull { intersect(it, indexFirst, indexLast) }
        val headLines = head.split("\n")
        return replace(index.split("\n"), selected.map { Triple(it.modStart, it.modEnd, headLines.subList(it.origStart, it.origEnd)) })
    }

    /**
     * The working text with its changes on lines [firstLine]..[lastLine] put back to [original] (the staged version),
     * as VS Code's git.revertSelectedRanges
     */
    fun revert(original: String, working: String, firstLine: Int, lastLine: Int): String {
        val selected = diff(original, working).mapNotNull { intersect(it, firstLine, lastLine) }
        val originalLines = original.split("\n")
        return replace(working.split("\n"), selected.map { Triple(it.modStart, it.modEnd, originalLines.subList(it.origStart, it.origEnd)) })
    }

    private fun diff(original: String, modified: String): List<Change> =
        ComparisonManager.getInstance()
            .compareLines(original, modified, ComparisonPolicy.DEFAULT, DumbProgressIndicator.INSTANCE)
            .map { Change(it.startLine1, it.endLine1, it.startLine2, it.endLine2) }

    /**
     * The part of [change] on modified lines [first]..[last], as VS Code's intersectDiffWithRange: lines changed one
     * for one keep only the selected ones, added lines only the selected ones, and other blocks have their whole
     * original replaced by the selected modified lines. A deletion next to the selection is taken whole.
     */
    private fun intersect(change: Change, first: Int, last: Int): Change? {
        if (change.modStart == change.modEnd) {
            return change.takeIf { change.modStart in first..last + 1 }
        }
        val start = maxOf(change.modStart, first)
        val end = minOf(change.modEnd, last + 1)
        if (start >= end) {
            return null
        }
        return when {
            change.origEnd - change.origStart == change.modEnd - change.modStart -> {
                val offset = start - change.modStart
                Change(change.origStart + offset, change.origStart + offset + (end - start), start, end)
            }
            else -> Change(change.origStart, change.origEnd, start, end)
        }
    }

    /** [lines] with each [start, end) range replaced by its new lines */
    private fun replace(lines: List<String>, replacements: List<Triple<Int, Int, List<String>>>): String {
        val result = mutableListOf<String>()
        var line = 0
        for ((start, end, newLines) in replacements.sortedBy { it.first }) {
            result += lines.subList(line, start)
            result += newLines
            line = end
        }
        result += lines.subList(line, lines.size)
        return result.joinToString("\n")
    }

    /** The index lines that working lines [first]..[last] correspond to, given the index -> working [changes] */
    private fun toIndexLines(changes: List<Change>, first: Int, last: Int): Pair<Int, Int> {
        fun toIndex(line: Int, atEnd: Boolean): Int {
            var shift = 0
            for (change in changes.sortedBy { it.modStart }) {
                if (line < change.modStart) break
                if (line < change.modEnd) {
                    return if (atEnd) maxOf(change.origStart, change.origEnd - 1) else change.origStart
                }
                shift = change.origEnd - change.modEnd
            }
            return line + shift
        }
        return toIndex(first, atEnd = false) to toIndex(last, atEnd = true)
    }
}
