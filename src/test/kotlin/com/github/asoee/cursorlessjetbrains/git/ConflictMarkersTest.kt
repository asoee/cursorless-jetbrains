package com.github.asoee.cursorlessjetbrains.git

import junit.framework.TestCase

class ConflictMarkersTest : TestCase() {

    private val conflict = """
        before
        <<<<<<< HEAD
        mine
        =======
        theirs 1
        theirs 2
        >>>>>>> feature
        after
    """.trimIndent().split("\n")

    fun testCaretInTheCurrentSideKeepsIt() {
        assertEquals(ConflictMarkers.Resolution(1, 6, listOf("mine")), ConflictMarkers.resolveAt(conflict, 2))
    }

    fun testCaretInTheIncomingSideKeepsIt() {
        assertEquals(ConflictMarkers.Resolution(1, 6, listOf("theirs 1", "theirs 2")), ConflictMarkers.resolveAt(conflict, 5))
    }

    fun testCaretOnAMarkerTakesThatMarkersSide() {
        assertEquals(listOf("mine"), ConflictMarkers.resolveAt(conflict, 1).keep)
        assertEquals(listOf("theirs 1", "theirs 2"), ConflictMarkers.resolveAt(conflict, 6).keep)
    }

    fun testDiff3BaseSide() {
        val diff3 = """
            <<<<<<< HEAD
            mine
            ||||||| base
            original
            =======
            theirs
            >>>>>>> feature
        """.trimIndent().split("\n")

        assertEquals(listOf("mine"), ConflictMarkers.resolveAt(diff3, 1).keep)
        assertEquals(listOf("original"), ConflictMarkers.resolveAt(diff3, 3).keep)
        assertEquals(listOf("theirs"), ConflictMarkers.resolveAt(diff3, 5).keep)
    }

    fun testEmptySide() {
        val emptyMine = listOf("<<<<<<< HEAD", "=======", "theirs", ">>>>>>> feature")

        assertEquals(ConflictMarkers.Resolution(0, 3, emptyList()), ConflictMarkers.resolveAt(emptyMine, 0))
    }

    fun testCaretOutsideAConflictOrOnTheSeparatorIsRefused() {
        for (line in listOf(0, 3, 7)) {
            try {
                ConflictMarkers.resolveAt(conflict, line)
                fail("line $line should be refused")
            } catch (_: ConflictMarkers.NotInSideException) {
            }
        }
    }
}
