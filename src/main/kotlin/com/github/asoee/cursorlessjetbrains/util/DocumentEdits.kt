package com.github.asoee.cursorlessjetbrains.util

import com.intellij.openapi.editor.Document
import com.intellij.openapi.editor.event.DocumentEvent
import com.intellij.openapi.editor.event.DocumentListener
import com.intellij.openapi.util.Disposer
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import java.util.Collections

/**
 * Runs [block] and returns the edits it made to [document], in order, as the engine takes them:
 * {rangeOffset, rangeLength, text}
 */
fun recordDocumentChanges(document: Document, block: () -> Unit): List<JsonObject> {
    val changes = Collections.synchronizedList(mutableListOf<JsonObject>())
    val recorder = Disposer.newDisposable()
    document.addDocumentListener(object : DocumentListener {
        override fun documentChanged(event: DocumentEvent) {
            changes.add(
                JsonObject(
                    mapOf(
                        "rangeOffset" to JsonPrimitive(event.offset),
                        "rangeLength" to JsonPrimitive(event.oldLength),
                        "text" to JsonPrimitive(event.newFragment.toString()),
                    )
                )
            )
        }
    }, recorder)
    try {
        block()
    } finally {
        Disposer.dispose(recorder)
    }
    return changes.toList()
}

/**
 * Replaces [start, end) with [text], touching only the part that differs. Replacing text with the same text moves
 * the IDE's carets (VS Code keeps them), e.g. when the tutorial rewrites its document to set up the next step. Call in
 * a write action.
 */
fun replaceChangedPart(document: Document, start: Int, end: Int, text: String) {
    val old = document.charsSequence.subSequence(start, end)
    val maxLength = minOf(old.length, text.length)
    var prefix = 0
    while (prefix < maxLength && old[prefix] == text[prefix]) {
        prefix++
    }
    var suffix = 0
    while (suffix < maxLength - prefix && old[old.length - 1 - suffix] == text[text.length - 1 - suffix]) {
        suffix++
    }
    if (prefix + suffix == old.length && prefix + suffix == text.length) {
        return
    }
    document.replaceString(start + prefix, end - suffix, text.substring(prefix, text.length - suffix))
}
