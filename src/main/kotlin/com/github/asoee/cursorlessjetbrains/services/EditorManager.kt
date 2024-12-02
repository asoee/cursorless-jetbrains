package com.github.asoee.cursorlessjetbrains.services

import com.github.asoee.cursorlessjetbrains.cursorless.*
import com.github.asoee.cursorlessjetbrains.listeners.getCursorlessContainers
import com.github.asoee.cursorlessjetbrains.sync.HatRange
import com.github.asoee.cursorlessjetbrains.sync.serializeEditor
import com.intellij.openapi.Disposable
import com.intellij.openapi.actionSystem.ActionManager
import com.intellij.openapi.actionSystem.IdeActions
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.command.CommandProcessor
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.editor.CaretState
import com.intellij.openapi.editor.Document
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.LogicalPosition
import com.intellij.openapi.ide.CopyPasteManager
import com.intellij.openapi.util.Disposer
import com.intellij.openapi.util.TextRange
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.launch
import java.awt.datatransfer.StringSelection
import java.util.*
import kotlin.time.Duration.Companion.milliseconds


class EditorManager(private val cursorlessEngine: CursorlessEngine, parentDisposable: Disposable, cs: CoroutineScope) :
    Disposable {

    val LOG: Logger = Logger.getInstance(EditorManager::class.java)

    private val editorIds = HashMap<Editor, String>()
    private val editorsById = HashMap<String, Editor>()
    private val editorDebounce = HashMap<String, MutableSharedFlow<EditorChange>>()

    private val dispatchScope = cs
    private val emitScope = cs


    init {
        Disposer.register(parentDisposable, this)
        cursorlessEngine.setCursorlessCallback(CursorlessHandler(this))
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
        if (editor.isDisposed) {
            LOG.info("editorChanged : Editor is disposed")
            return
        }
        ensureEditorIdSet(editor)
        val editorId = editorIds[editor]!!
        println("Editor changed $editorId")
        val debouncer = debouncerById(editorId)
        emitScope.launch {
            debouncer.emit(EditorChange(editorId, System.currentTimeMillis()))
        }
    }

    fun editorDidChange(editor: Editor) {
        ApplicationManager.getApplication().invokeLater {
            if (editor.isDisposed) {
                println("Editor is disposed")
            } else {
                ensureEditorIdSet(editor)
                val editorId = editorIds[editor]!!
                println("Editor did change " + editorId)
                val editorState = serializeEditor(editor, true, editorId)
                cursorlessEngine.editorChanged(editorState)
            }
        }
    }

    fun setSelection(editorId: String, selections: Array<CursorlessRange>) {
        val editor = editorsById[editorId]
        if (editor != null) {
            if (selections.size > 0) {
                val range = selections[0]
                val startPos = LogicalPosition(range.start!!.line, range.start!!.character)
                val endPos = LogicalPosition(range.end!!.line, range.end!!.character)
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

    fun clipboardCopy(editorId: String, selections: Array<CursorlessRange>) {
        val editor = editorsById[editorId]
        if (editor != null) {
            if (selections.size > 0) {
                val range = selections[0]
                val startPos = LogicalPosition(range.start!!.line, range.start!!.character)
                val endPos = LogicalPosition(range.end!!.line, range.end!!.character)
                println("launch action : clipboardCopy to " + startPos.toString() + " - " + endPos.toString())

                val startOffset = editor.logicalPositionToOffset(startPos)
                val endOffset = editor.logicalPositionToOffset(endPos)

                ApplicationManager.getApplication().invokeLater {
                    ApplicationManager.getApplication().runReadAction {
                        val text = editor.document.getText(TextRange(startOffset, endOffset))
                        CopyPasteManager.getInstance().setContents(StringSelection(text))
                    }
                }
            }
        }
    }

    fun clipboardPaste(editorId: String) {
        val editor = editorsById[editorId]
        if (editor != null) {
            println("launch action : clipboardPaste")
            ApplicationManager.getApplication().invokeLater {
                ApplicationManager.getApplication().runWriteAction {

                    val actionManager = ActionManager.getInstance();

                    val pasteAction = actionManager.getAction(IdeActions.ACTION_EDITOR_PASTE_SIMPLE);
                    actionManager.tryToExecute(
                        pasteAction,
                        null,
                        null,
                        null,
                        true
                    );
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

    fun documentChanged(document: Document) {
        editorIds.keys.forEach({
            if (it.document == document) {
                editorChanged(it)
            }
        })
    }

    private class CursorlessHandler(private val editorManager: EditorManager) : CursorlessCallback {
        override fun onHatUpdate(hatRanges: Array<HatRange>) {
            editorManager.hatsUpdated(hatRanges)
        }

        override fun setSelection(editorId: String, selections: Array<CursorlessRange>) {
            editorManager.setSelection(editorId, selections)
        }

        override fun clipboardCopy(editorId: String, selections: Array<CursorlessRange>) {
            editorManager.clipboardCopy(editorId, selections)
        }

        override fun clipboardPaste(editorId: String) {
            editorManager.clipboardPaste(editorId)
        }

        override fun documentUpdated(editorId: String, edit: CursorlessEditorEdit) {
            editorManager.documentUpdated(editorId, edit)
        }

    }

    private fun hatsUpdated(hatRanges: Array<HatRange>) {
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
            val editorId = editorIds[editor]
            if (editorId != null) {
                val format = editorToFormat[editorId]
                if (format != null) {
                    it.updateHats(format)
                }
            }
        })
    }

    override fun dispose() {
        thisLogger().info("Disposing EditorManager")
        dispatchScope.cancel()
        emitScope.cancel()
    }
}