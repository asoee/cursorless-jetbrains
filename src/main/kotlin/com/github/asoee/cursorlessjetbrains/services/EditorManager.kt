package com.github.asoee.cursorlessjetbrains.services

import com.github.asoee.cursorlessjetbrains.commands.*
import com.github.asoee.cursorlessjetbrains.cursorless.*
import com.github.asoee.cursorlessjetbrains.listeners.getCursorlessContainers
import com.github.asoee.cursorlessjetbrains.settings.TalonSettings
import com.github.asoee.cursorlessjetbrains.sync.EditorState
import com.github.asoee.cursorlessjetbrains.sync.HatRange
import com.github.asoee.cursorlessjetbrains.sync.serializeEditor
import com.github.asoee.cursorlessjetbrains.ui.CursorlessContainer
import com.intellij.openapi.Disposable
import com.intellij.openapi.actionSystem.ActionManager
import com.intellij.openapi.actionSystem.IdeActions
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.application.ReadAction
import com.intellij.openapi.command.CommandProcessor
import com.intellij.openapi.components.service
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.editor.CaretState
import com.intellij.openapi.editor.Document
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.ScrollType
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

    private var hatsEnabled: Boolean = true
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
//            thisLogger().info("Creating debouncer for $editorId")
            debouncer = MutableSharedFlow<EditorChange>()
            editorDebounce[editorId] = debouncer
            dispatchScope.launch {
                debouncer
                    .debounce(25.milliseconds)
                    .collect { change ->
//                        println("collect... " + change.editorId)
                        val editor = editorsById[change.editorId]
                        if (editor != null) {
                            try {
                                editorDidChange(editor)
                            } catch (e: Exception) {
                                println("Error in editorDidChange")
                                e.printStackTrace()
                            }
                        } else {
                            println("Editor not found (closed?)")
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
//        println("Editor changed $editorId")
        val debouncer = debouncerById(editorId)
        emitScope.launch {
            debouncer.emit(EditorChange(editorId, System.currentTimeMillis()))
        }
    }

    fun editorDidChange(editor: Editor) {
        if (editor.isDisposed) {
            println("Editor is disposed")
            return
        }

        var edtState: EditorState? = null
        ApplicationManager.getApplication().invokeAndWait {
            edtState = ReadAction.compute<EditorState, Throwable> {
                ensureEditorIdSet(editor)
                val editorId = editorIds[editor]!!
//                println("Editor did change " + editorId)
                val editorState = serializeEditor(editor, editorId)
//                println("Editor state " + editorState)
                editorState
            }
        }
        edtState?.let {
//            println("trigger Editor state changed")
            cursorlessEngine.editorChanged(it)
        }
    }


    fun setSelection(editorId: String, selections: Array<CursorlessRange>) {
        val editor = editorsById[editorId]
        if (editor != null) {
            if (selections.size > 0) {

                ApplicationManager.getApplication().invokeAndWait {
                    ApplicationManager.getApplication().runWriteAction {
                        CommandProcessor.getInstance().executeCommand(
                            editor.project,
                            {
                                val carets = selections.map {
                                    println("Setting selection to $it")
                                    val startPos = it.logicalStartPosition(editor)
                                    val endPos = it.logicalEndPosition(editor)
                                    CaretState(endPos, startPos, endPos)
                                }
                                editor.caretModel.caretsAndSelections = carets
                            },
                            "Select",
                            "SelectGroup"
                        )
                    }
                    editor.scrollingModel.scrollToCaret(ScrollType.RELATIVE)

                }
            }
        }
    }

    fun clipboardCopy(editorId: String, selections: Array<CursorlessRange>) {
        val editor = editorsById[editorId]
        if (editor != null) {
            if (selections.size > 0) {
                ApplicationManager.getApplication().invokeAndWait {
                    ApplicationManager.getApplication().runReadAction {
                        val range = selections[0]
                        val startPos = range.logicalStartPosition(editor)
                        val endPos = range.logicalEndPosition(editor)
                        println("launch action : clipboardCopy to $startPos - $endPos")

                        val startOffset = editor.logicalPositionToOffset(startPos)
                        val endOffset = editor.logicalPositionToOffset(endPos)
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
            ApplicationManager.getApplication().invokeAndWait {
                val actionManager = ActionManager.getInstance()

                val pasteAction = actionManager.getAction(IdeActions.ACTION_EDITOR_PASTE_SIMPLE)
                actionManager.tryToExecute(
                    pasteAction,
                    null,
                    editor.component,
                    null,
                    true
                )
            }
        }
    }

    fun documentUpdated(editorId: String, edit: CursorlessEditorEdit) {
        println("Document updated " + editorId)
        val editor = editorsById[editorId]
        if (editor != null) {
            if (edit.changes.isNotEmpty()) {
                ApplicationManager.getApplication().invokeAndWait {
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
        val editorId = editorIds[editor]!!
        val editorState = serializeEditor(editor, editorId)
        dispatchScope.launch {
            cursorlessEngine.editorCreated(editorState)
        }
    }

    fun editorClosed(editor: Editor) {
        val id = editorIds[editor]
        editorIds.remove(editor)
        if (id != null) {
            editorsById.remove(id)
            dispatchScope.launch {
                cursorlessEngine.editorClosed(id)
            }
        }
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

        override fun executeCommand(editorId: String, command: String, args: Array<String>) {
            val actionsArgs = listOf(command) + args.toList()
            editorManager.editorsById[editorId]?.let { editor ->
                editor.project?.let { project ->
                    val request = CommandRequest(project, "action", actionsArgs)
                    thisLogger().info("Executing command $request")
                    service<CommandRegistryService>().getCommand(request)?.let {
                        thisLogger().info("Found command $it")
                        service<CommandExecutorService>().execute(it)
                    }
                }
            }
        }

        override fun executeRangeCommand(editorId: String, rangeCommand: CursorlessEditorCommand) {
            thisLogger().info("Executing executeRangeCommand $rangeCommand")
            editorManager.editorsById[editorId]?.let { editor ->
                editor.project?.let { project ->
                    val command = RangedActionCommand(
                        project,
                        editor,
                        rangeCommand.ranges.toTypedArray(),
                        rangeCommand.singleRange,
                        rangeCommand.restoreSelection,
                        rangeCommand.ideCommand
                    )
                    service<CommandExecutorService>().execute(command)
                }
            }
        }

        override fun insertLineAfter(editorId: String, ranges: Array<CursorlessRange>) {
            thisLogger().info("Executing insertLineAfter $ranges")
            editorManager.editorsById[editorId]?.let { editor ->
                editor.project?.let { project ->
                    val command = InsertLineAfterCommand.fromRanges(project, editor, ranges.toList())
                    service<CommandExecutorService>().execute(command)
                }
            }
        }

        override fun revealLine(editorId: String, line: Int, revealAt: String) {
            thisLogger().info("Executing insertLineAfter $line, $revealAt")
            editorManager.editorsById[editorId]?.let { editor ->
                editor.project?.let { project ->
                    val command = RevealLineCommand(project, editor, line, revealAt)
                    service<CommandExecutorService>().execute(command)
                }
            }
        }

        override fun flashRanges(flashRanges: Array<CursorlessFlashRange>) {
            thisLogger().info("Executing flashRanges $flashRanges")
            val flashRangesByEditor = flashRanges
                .groupBy { editorManager.editorsById[it.editorId] }
                .filter { it.key != null }
            if (flashRangesByEditor.isNotEmpty()) {
                // assume all belongs to same project, so take project from the first
                val project = flashRangesByEditor.keys.first()?.project
                if (project != null) {
                    val command = HighlightRangeCommand(project, flashRangesByEditor)
                    service<CommandExecutorService>().execute(command)
                }
                return
            }
        }

        override fun prePhraseVersion(): String? {
            return service<FileCommandServerService>().commandServer.prePhraseVersion()
        }

        override fun documentUpdated(editorId: String, edit: CursorlessEditorEdit) {
            editorManager.documentUpdated(editorId, edit)
        }

    }

    private fun hatsUpdated(hatRanges: Array<HatRange>) {
        val editorToFormat = HashMap<String, HatsFormat>()
        for (hatRange in hatRanges) {
            var format = editorToFormat[hatRange.editorId]
            if (format == null) {
                format = HatsFormat()
                editorToFormat[hatRange.editorId] = format
            }

            var ranges = format[hatRange.styleName]
            if (ranges == null) {
                ranges = ArrayList<CursorlessRange>()
                format[hatRange.styleName] = ranges
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

    fun getEditorHats(editor: Editor): HatsFormat? {
        return getCursorlessContainers().find { it.editor == editor }?.getHats()
    }

    override fun dispose() {
        thisLogger().info("Disposing EditorManager")
        dispatchScope.cancel()
        emitScope.cancel()
    }

    fun reloadAllEditors() {
        this.editorsById.values.forEach(
            { editor ->
                editorCreated(editor)
            }
        )
    }

    fun settingsUpdated(settings: TalonSettings.State) {
        this.hatsEnabled = settings.enableHats
        getCursorlessContainers().forEach {
            applySettingsToContainer(it, settings)
        }
    }

    private fun applySettingsToContainer(
        it: CursorlessContainer,
        settings: TalonSettings.State
    ) {
        it.setHatsEnabled(settings.enableHats)
        it.setHatScaleFactor(settings.hatScaleFactor)
        it.setHatVerticalOffset(settings.hatVerticalOffset)
    }

}