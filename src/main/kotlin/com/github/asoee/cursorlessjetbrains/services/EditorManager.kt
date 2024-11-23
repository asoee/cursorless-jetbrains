package com.github.asoee.cursorlessjetbrains.services

import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessEngine
import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessRange
import com.github.asoee.cursorlessjetbrains.cursorless.HatUpdateCallback
import com.github.asoee.cursorlessjetbrains.cursorless.HatsFormat
import com.github.asoee.cursorlessjetbrains.listeners.getCursorlessContainers
import com.github.asoee.cursorlessjetbrains.sync.HatRange
import com.github.asoee.cursorlessjetbrains.sync.serializeEditor
import com.intellij.openapi.editor.Editor
import java.util.UUID

class EditorManager(private val cursorlessEngine: CursorlessEngine) {

    private val editorIds = HashMap<Editor, String>()
    private val editorsById = HashMap<String, Editor>()

    init {
        cursorlessEngine.AddHatUpdateListener(HatUpdateHandler(this))
    }

    fun editorChanged(editor: Editor) {
        ensureEditorIdSet(editor)
        val editorId = editorIds[editor]!!
        val editorState = serializeEditor(editor, true, editorId)
        cursorlessEngine.editorChanged(editorState)
    }

    fun editorCreated(editor: Editor) {
        ensureEditorIdSet(editor)
    }

    fun getEditorId(editor: Editor) {
        editorIds[editor]
    }

    fun ensureEditorIdSet(editor: Editor) {
        if (!editorIds.containsKey(editor)) {
            val editorId = UUID.randomUUID().toString()
            editorIds.put(editor, editorId)
            editorsById.put(editorId, editor)
        }
    }

    private class HatUpdateHandler(private val editorManager: EditorManager) : HatUpdateCallback {
        override fun onHatUpdate(hatRanges: Array<HatRange>) {
            val editorToFormat = HashMap<String, HatsFormat>()
            for (hatRange in hatRanges) {
                var format = editorToFormat.get(hatRange.editorId)
                if (format == null) {
                    format = HatsFormat()
                    editorToFormat.put(hatRange.editorId, format)
                }

                var ranges = format.get(hatRange.styleName)
                if (ranges == null) {
                    ranges =  ArrayList<CursorlessRange>()
                    format.put(hatRange.styleName, ranges)
                }
                ranges.add(hatRange.range)
            }

            getCursorlessContainers().forEach({
                val editor = it.editor
                val editorId = editorManager.editorIds[editor]
                if (editorId != null) {
                    val format = editorToFormat[editorId]
                    if (format != null) {
                        it.updateHats(format)
                    }
                }
            })
        }
    }
}