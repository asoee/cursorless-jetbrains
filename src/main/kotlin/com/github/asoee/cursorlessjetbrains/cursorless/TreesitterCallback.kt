package com.github.asoee.cursorlessjetbrains.cursorless

interface TreesitterCallback {

    fun readQuery(fileName: String): String? {
        return ""
    }
}