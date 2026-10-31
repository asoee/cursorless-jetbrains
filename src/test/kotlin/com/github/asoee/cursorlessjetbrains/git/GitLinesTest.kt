package com.github.asoee.cursorlessjetbrains.git

import com.intellij.testFramework.fixtures.BasePlatformTestCase

// A platform test: the line diff is the IDE's
class GitLinesTest : BasePlatformTestCase() {

    private val head = listOf("one", "two", "three", "four", "five").joinToString("\n", postfix = "\n")

    // Two separate changes: line 1 edited, and a line added after line 3
    private val working = listOf("one", "TWO", "three", "four", "new", "five").joinToString("\n", postfix = "\n")

    fun testStagingLinesStagesOnlyTheirChanges() {
        assertEquals(
            listOf("one", "TWO", "three", "four", "five").joinToString("\n", postfix = "\n"),
            GitLines.stage(head, working, 1, 1),
        )
        assertEquals(
            listOf("one", "two", "three", "four", "new", "five").joinToString("\n", postfix = "\n"),
            GitLines.stage(head, working, 4, 4),
        )
    }

    fun testStagingOneLineOfABlockOfChangedLinesStagesJustThatLine() {
        // Lines 1 to 3 all changed, one for one: one block of changes
        val edited = listOf("one", "TWO", "THREE", "FOUR", "five").joinToString("\n", postfix = "\n")

        assertEquals(
            listOf("one", "two", "THREE", "four", "five").joinToString("\n", postfix = "\n"),
            GitLines.stage(head, edited, 2, 2),
        )
    }

    fun testStagingOneOfSeveralAddedLinesStagesJustThatLine() {
        val added = listOf("one", "two", "a", "b", "c", "three", "four", "five").joinToString("\n", postfix = "\n")

        assertEquals(
            listOf("one", "two", "b", "three", "four", "five").joinToString("\n", postfix = "\n"),
            GitLines.stage(head, added, 3, 3),
        )
    }

    fun testUnstagingOneLineOfAStagedBlockUnstagesJustThatLine() {
        val index = listOf("one", "TWO", "THREE", "FOUR", "five").joinToString("\n", postfix = "\n")

        assertEquals(
            listOf("one", "TWO", "three", "FOUR", "five").joinToString("\n", postfix = "\n"),
            GitLines.unstage(head, index, index, 2, 2),
        )
    }

    fun testRevertingOneLineOfABlockRevertsJustThatLine() {
        val edited = listOf("one", "TWO", "THREE", "FOUR", "five").joinToString("\n", postfix = "\n")

        assertEquals(
            listOf("one", "TWO", "three", "FOUR", "five").joinToString("\n", postfix = "\n"),
            GitLines.revert(head, edited, 2, 2),
        )
    }

    fun testRevertingAnAddedLineRemovesJustThatLine() {
        assertEquals(
            listOf("one", "TWO", "three", "four", "five").joinToString("\n", postfix = "\n"),
            GitLines.revert(head, working, 4, 4),
        )
    }

    fun testStagingLinesWithNoChangesChangesNothing() {
        assertEquals(head, GitLines.stage(head, working, 2, 3))
    }

    fun testStagingADeletionNextToTheSelection() {
        val deleted = listOf("one", "two", "four", "five").joinToString("\n", postfix = "\n")

        // The deleted "three" sat between working lines 1 and 2
        assertEquals(deleted, GitLines.stage(head, deleted, 2, 2))
    }

    fun testUnstagingLinesPutsOnlyThoseBackToHead() {
        val index = working

        assertEquals(
            listOf("one", "two", "three", "four", "new", "five").joinToString("\n", postfix = "\n"),
            GitLines.unstage(head, index, working, 1, 1),
        )
    }

    fun testUnstagingFindsTheIndexLinesAroundUnstagedEdits() {
        // Both changes staged, and an unstaged line added at the top shifts the working lines by one
        val index = working
        val workingWithMore = "zero\n$working"

        assertEquals(
            listOf("one", "TWO", "three", "four", "five").joinToString("\n", postfix = "\n"),
            GitLines.unstage(head, index, workingWithMore, 5, 5),
        )
    }
}
