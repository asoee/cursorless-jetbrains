package com.github.asoee.cursorlessjetbrains.services

import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessEngine
import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessRange
import com.github.asoee.cursorlessjetbrains.cursorless.HatUpdateCallback
import com.github.asoee.cursorlessjetbrains.cursorless.HatsFormat
import com.github.asoee.cursorlessjetbrains.listeners.getCursorlessContainers
import com.github.asoee.cursorlessjetbrains.sync.HatRange
import com.github.asoee.cursorlessjetbrains.sync.serializeEditor
import com.intellij.openapi.application.Application
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.application.EDT
import com.intellij.openapi.command.CommandProcessor
import com.intellij.openapi.editor.Caret
import com.intellij.openapi.editor.CaretState
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.LogicalPosition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import java.util.UUID

class EditorManager(private val cursorlessEngine: CursorlessEngine) {

    private val editorIds = HashMap<Editor, String>()
    private val editorsById = HashMap<String, Editor>()

    init {
        cursorlessEngine.AddHatUpdateListener(HatUpdateHandler(this))
        cursorlessEngine.SetSelectionUpdateListener(::setSelectionCallback)

    }

    fun editorChanged(editor: Editor) {
        ensureEditorIdSet(editor)
        val editorId = editorIds[editor]!!
        val editorState = serializeEditor(editor, true, editorId)
        cursorlessEngine.editorChanged(editorState)
    }

    fun setSelectionCallback(editorId: String, selections: Array<CursorlessRange>) {
        val editor = editorsById[editorId]
        if (editor != null) {
            if (selections.size > 0) {
                val range = selections[0]
                val startPos = LogicalPosition(range.start!!.line, range.start!!.character)
                val endPos = LogicalPosition(range.end!!.line, range.end!!.character)
                val startOffset = editor.logicalPositionToOffset(startPos)
                val endOffset = editor.logicalPositionToOffset(endPos)
                println("launch action : Setting selection to " + startPos.toString() + " - " + endPos.toString())

                ApplicationManager.getApplication().invokeLater {
                    ApplicationManager.getApplication().runWriteAction {
                        CommandProcessor.getInstance().executeCommand(
                            editor.project,
                            {
                                println("Setting selection to " + startPos.toString() + " - " + endPos.toString())
                                editor.caretModel?.caretsAndSelections = listOf(
                                    CaretState(startPos, startPos, endPos),
                                )
                            },
                            "Insert",
                            "insertGroup"
                        )
                    }
                }
            }
        }
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
                    ranges = ArrayList<CursorlessRange>()
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