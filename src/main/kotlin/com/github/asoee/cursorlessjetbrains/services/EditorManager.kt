package com.github.asoee.cursorlessjetbrains.services

import com.github.asoee.cursorlessjetbrains.cursorless.*
import com.github.asoee.cursorlessjetbrains.listeners.getCursorlessContainers
import com.github.asoee.cursorlessjetbrains.sync.HatRange
import com.github.asoee.cursorlessjetbrains.sync.serializeEditor
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.command.CommandProcessor
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.editor.CaretState
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.LogicalPosition
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import java.util.*
import kotlin.time.Duration.Companion.milliseconds

class EditorManager(private val cursorlessEngine: CursorlessEngine) {

    private val editorIds = HashMap<Editor, String>()
    private val editorsById = HashMap<String, Editor>()
    private val editorDebounce = HashMap<String, MutableSharedFlow<EditorChange>>()

    private val dispatchScope = CoroutineScope(Dispatchers.IO)
    private val emitScope = CoroutineScope(Dispatchers.Default)


    init {
        cursorlessEngine.AddHatUpdateListener(HatUpdateHandler(this))
        cursorlessEngine.SetSelectionUpdateListener(::setSelectionCallback)
        cursorlessEngine.SetDocumentUpdateListener(::documentUpdated)
    }

    data class EditorChange(
        val editorId: String,
        val ts: Long
    )


    @OptIn(FlowPreview::class)
    fun debouncerById(editorId: String): MutableSharedFlow<EditorChange> {
        var debouncer = editorDebounce[editorId]
        if (debouncer == null) {
            thisLogger().info("Creating debouncer for $editorId")
            debouncer = MutableSharedFlow<EditorChange>()
            editorDebounce[editorId] = debouncer
            dispatchScope.launch {
                debouncer
                    .debounce(100.milliseconds)
                    .collect { change ->
                        println("collect... " + change.editorId)
                        val editor = editorsById[change.editorId]
                        if (editor != null) {
                            try {
                                editorDidChange(editor)
                            } catch (e: Exception) {
                                println("Error in editorDidChange")
                                e.printStackTrace()
                            }
                        }
                    }
            }
        }
        return debouncer
    }

    fun editorChanged(editor: Editor) {
        ensureEditorIdSet(editor)
        val editorId = editorIds[editor]!!
        println("Editor changed $editorId")
        val debouncer = debouncerById(editorId)
        emitScope.launch {
            val emitted = debouncer.emit(EditorChange(editorId, System.currentTimeMillis()))
            println("emitted = ${emitted}")
        }
    }

    fun editorDidChange(editor: Editor) {
        ApplicationManager.getApplication().invokeLater {
            ensureEditorIdSet(editor)
            val editorId = editorIds[editor]!!
            println("Editor did change " + editorId)
            val editorState = serializeEditor(editor, true, editorId)
            cursorlessEngine.editorChanged(editorState)
        }
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
                                    CaretState(endPos, startPos, endPos),
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

    fun documentUpdated(editorId: String, edit: CursorlessEditorEdit) {
        println("Document updated " + editorId)
        val editor = editorsById[editorId]
        if (editor != null) {
            if (edit.changes.isNotEmpty()) {
                ApplicationManager.getApplication().invokeLater {
                    ApplicationManager.getApplication().runWriteAction {
                        CommandProcessor.getInstance().executeCommand(
                            editor.project,
                            {
                                for (change in edit.changes) {
                                    println("Setting range to " + change.rangeOffset.toString() + " - " + change.rangeOffset.toString() + " : " + change.text)
                                    editor.document.replaceString(
                                        change.rangeOffset,
                                        change.rangeOffset + change.rangeLength,
                                        change.text
                                    )
                                }
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

    fun focusChanged(editor: Editor) {
        editorChanged(editor)
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