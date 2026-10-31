package com.github.asoee.cursorlessjetbrains.util

import com.intellij.openapi.editor.Editor
import com.intellij.openapi.fileEditor.FileDocumentManager

/**
 * Before editing [editor]'s document for Cursorless, runs the IDE's read-only handling, e.g. a Perforce checkout, as
 * typing would. Throws if the file stays read-only, which rejects the Cursorless command, so Talon gets an error
 * rather than a silent no-op. Call on the EDT, outside a write action.
 */
fun requireWritable(editor: Editor) {
    val document = editor.document
    if (!FileDocumentManager.getInstance().requestWriting(document, editor.project)) {
        val fileName = FileDocumentManager.getInstance().getFile(document)?.name ?: "the file"
        throw IllegalStateException("Cannot edit read-only file $fileName")
    }
}
