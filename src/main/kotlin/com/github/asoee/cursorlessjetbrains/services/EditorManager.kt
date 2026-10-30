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
import com.intellij.openapi.diagnostic.logger
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.editor.CaretState
import com.intellij.openapi.editor.Document
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.project.Project
import com.intellij.openapi.editor.ScrollType
import com.intellij.openapi.editor.EditorKind
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.fileEditor.OpenFileDescriptor
import com.intellij.openapi.ui.Messages
import com.intellij.openapi.vfs.LocalFileSystem
import com.intellij.notification.NotificationGroupManager
import com.intellij.notification.NotificationType
import com.intellij.testFramework.LightVirtualFile
import com.github.asoee.cursorlessjetbrains.sync.selectionFromCaretState
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.encodeToJsonElement
import com.intellij.openapi.editor.event.DocumentListener
import com.intellij.openapi.editor.event.DocumentEvent
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import com.github.asoee.cursorlessjetbrains.util.extensionForLanguage
import com.github.asoee.cursorlessjetbrains.util.isInTerminal
import com.github.asoee.cursorlessjetbrains.settings.CursorlessKeyValueStore
import java.awt.KeyboardFocusManager
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import javax.swing.SwingUtilities
import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.openapi.ide.CopyPasteManager
import com.intellij.openapi.util.Disposer
import com.intellij.openapi.util.TextRange
import com.intellij.psi.PsiDocumentManager
import com.intellij.psi.PsiFile
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.debounce
import java.awt.datatransfer.StringSelection
import java.util.*
import kotlin.time.Duration.Companion.milliseconds


class EditorManager(
    val project: Project,
    private var cursorlessEngine: CursorlessEngine,
    parentDisposable: Disposable,
    cs: CoroutineScope,
) :
    Disposable {

    private var hatsEnabled = true
    private val logger: Logger = logger<EditorManager>()

    private val editorIds = HashMap<Editor, String>()
    private val editorsById = HashMap<String, Editor>()
    private val editorDebounce = HashMap<String, MutableSharedFlow<EditorChange>>()

    private val dispatchScope = cs
    private val emitScope = cs

    @OptIn(ExperimentalCoroutinesApi::class)
    private val emitDispatcher = Dispatchers.Default.limitedParallelism(1)

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
            debouncer = MutableSharedFlow()
            editorDebounce[editorId] = debouncer
            dispatchScope.launch {
                debouncer
                    .debounce(25.milliseconds)
                    .collect { change ->
                        val editor = editorsById[change.editorId]
                        if (editor != null) {
                            try {
                                editorDidChange(editor)
                            } catch (e: Exception) {
                                logger.warn("Error in editorDidChange")
                                e.printStackTrace()
                            }
                        } else {
                            logger.info("Editor not found (closed?)")
                        }
                    }
            }
        }
        return debouncer
    }

    fun editorChanged(editor: Editor) {
        if (editor.isDisposed) {
            logger.info("editorChanged : Editor is disposed")
            return
        }
        if (editor.project == null) {
            logger.info("editorChanged : Editor project is null")
            return
        }
        ensureEditorIdSet(editor)
        val editorId = editorIds[editor]!!
        val debouncer = debouncerById(editorId)
        emitScope.launch {
            debouncer.emit(EditorChange(editorId, System.currentTimeMillis()))
        }
    }

    private fun editorDidChange(editor: Editor) {
        emitScope.launch(emitDispatcher) {
            callEngineWithEditorState(editor) { editorState -> cursorlessEngine.editorChanged(editorState) }
            return@launch
        }
    }

    private fun callEngineWithEditorState(editor: Editor, engineCall: (EditorState) -> Unit) {
        if (editor.isDisposed) {
            logger.info("Editor is disposed")
            return
        }

        val psiFile: PsiFile? = ReadAction.compute<PsiFile?, Throwable> {
            if (editor.isDisposed) {
                logger.info("Editor is disposed")
                return@compute null
            }
            PsiDocumentManager.getInstance(editor.project!!)
                .getPsiFile(editor.document)
        }

        if (psiFile == null) {
            logger.info("PsiFile is null")
        }

        var edtState: EditorState? = null
        ApplicationManager.getApplication().invokeAndWait {
            edtState = ReadAction.compute<EditorState, Throwable> {
                if (editor.isDisposed) {
                    logger.info("Editor is disposed")
                    return@compute null
                }
                ensureEditorIdSet(editor)
                val editorId = editorIds[editor]!!
                val editorState = serializeEditor(editor, editorId, psiFile)
                editorState
            }
        }
        edtState?.let {
            engineCall(it)
        }
    }


    /** Receives the engine's tutorial state, for the Cursorless tool window */
    var tutorialStateListener: ((String) -> Unit)? = null

    // Replaceable so tests keep their history out of the real ~/.cursorless
    internal var commandHistoryFiles = CommandHistoryFiles()

    // Set while a Cursorless command runs: IntelliJ merges consecutive undoable commands that share a group ID, so
    // its edits and selection changes undo together, as one step, as they do in VS Code
    @Volatile
    private var undoGroupId: Any? = null

    fun <T> asOneUndoStep(block: () -> T): T {
        undoGroupId = Any()
        try {
            return block()
        } finally {
            undoGroupId = null
        }
    }

    /**
     * Runs [command] for the engine as part of the running Cursorless command's undo step, so IDE actions it runs
     * (indent, comment, ...) undo together with the command's edits and selection changes
     */
    fun executeInUndoStep(command: VcCommand) {
        val groupId = undoGroupId
        if (groupId == null) {
            service<CommandExecutorService>().execute(command)
            return
        }
        ApplicationManager.getApplication().invokeAndWait {
            CommandProcessor.getInstance().executeCommand(
                command.project,
                { service<CommandExecutorService>().execute(command) },
                null,
                groupId
            )
        }
    }

    fun setSelection(editorId: String, selections: Array<CursorlessRange>) {
        val editor = editorsById[editorId]
        if (editor != null) {
            if (selections.isNotEmpty()) {

                ApplicationManager.getApplication().invokeAndWait {
                    ApplicationManager.getApplication().runWriteAction {
                        CommandProcessor.getInstance().executeCommand(
                            editor.project,
                            {
                                val carets = selections.map {
                                    logger.debug("Setting selection to $it")
                                    val startPos = it.logicalStartPosition(editor)
                                    val endPos = it.logicalEndPosition(editor)
                                    CaretState(endPos, startPos, endPos)
                                }
                                // Rider can leave a removed caret's selection painted when the caret list
                                // shrinks; removing the extra carets first, as Escape does, clears it
                                if (carets.size < editor.caretModel.caretCount) {
                                    editor.caretModel.removeSecondaryCarets()
                                }
                                editor.caretModel.caretsAndSelections = carets
                            },
                            "Select",
                            undoGroupId ?: "SelectGroup"
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
            if (selections.isNotEmpty()) {
                ApplicationManager.getApplication().invokeAndWait {
                    ApplicationManager.getApplication().runReadAction {
                        val range = selections[0]
                        val startPos = range.logicalStartPosition(editor)
                        val endPos = range.logicalEndPosition(editor)
                        logger.debug("launch action : clipboardCopy to $startPos - $endPos")

                        val startOffset = editor.logicalPositionToOffset(startPos)
                        val endOffset = editor.logicalPositionToOffset(endPos)
                        val text = editor.document.getText(TextRange(startOffset, endOffset))
                        CopyPasteManager.getInstance().setContents(StringSelection(text))
                    }
                }
            }
        }
    }

    /**
     * Pastes with the IDE's paste action and returns its edits as JSON [{rangeOffset, rangeLength, text}], so the
     * engine can track the pasted text straight away; null when there is no such editor.
     */
    fun clipboardPaste(editorId: String): String? {
        val editor = editorsById[editorId] ?: return null
        logger.debug("launch action : clipboardPaste")
        val changes = mutableListOf<JsonObject>()
        ApplicationManager.getApplication().invokeAndWait {
            val actionManager = ActionManager.getInstance()
            val pasteAction = actionManager.getAction(IdeActions.ACTION_EDITOR_PASTE_SIMPLE)
            val recorder = Disposer.newDisposable()
            editor.document.addDocumentListener(object : DocumentListener {
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
                // The paste action's own command nests inside this one, so it joins the Cursorless command's undo step
                CommandProcessor.getInstance().executeCommand(
                    editor.project,
                    {
                        actionManager.tryToExecute(
                            pasteAction,
                            null,
                            editor.component,
                            null,
                            true
                        )
                    },
                    "Paste",
                    undoGroupId
                )
            } finally {
                Disposer.dispose(recorder)
            }
        }
        return JsonArray(changes).toString()
    }

    fun documentUpdated(editorId: String, edit: CursorlessEditorEdit) {
        val editor = editorsById[editorId]
        if (editor == null) {
            logger.warn("Dropping Cursorless edit for unknown editor $editorId")
            return
        }
        if (edit.changes.isEmpty()) {
            val documentText = ReadAction.compute<String, RuntimeException> { editor.document.text }
            if (edit.text.isNotEmpty() && edit.text != documentText) {
                logger.warn("Cursorless edit for $editorId has no changes but different text; nothing applied")
            }
            return
        }
        logger.info("Applying ${edit.changes.size} Cursorless change(s) to $editorId")
        ApplicationManager.getApplication().invokeAndWait {
            val document = editor.document
            // requestWriting runs the IDE's read-only handling, e.g. a Perforce checkout, as typing would.
            // Throwing here rejects the command in the engine, so Talon gets an error instead of a silent no-op
            if (!FileDocumentManager.getInstance().requestWriting(document, editor.project)) {
                val fileName = FileDocumentManager.getInstance().getFile(document)?.name ?: editorId
                throw IllegalStateException("Cannot edit read-only file $fileName")
            }
            ApplicationManager.getApplication().runWriteAction {
                CommandProcessor.getInstance().executeCommand(
                    editor.project,
                    {
                        for (change in edit.changes) {
                            logger.debug("Setting range to " + change.rangeOffset.toString() + " - " + change.rangeOffset.toString() + " : " + change.text)
                            replaceChangedPart(document, change.rangeOffset, change.rangeOffset + change.rangeLength, change.text)
                        }
                        editor.project?.let { PsiDocumentManager.getInstance(it).commitDocument(document) }
                    },
                    "Insert",
                    undoGroupId ?: "insertGroup"
                )
            }
        }
    }

    /**
     * Runs [block], which has the IDE act on [editor] (an action, inserting a line, ...), and returns JSON
     * {changes, selections}: the document edits it made, in order, and the carets after. The engine applies them to
     * its copy straight away; the IDE's own report of the editor comes too late, e.g. for a tutorial step that edits
     * the document right after "pour".
     */
    fun recordingIdeEdits(editor: Editor, block: () -> Unit): String {
        val changes = java.util.Collections.synchronizedList(mutableListOf<JsonObject>())
        val recorder = Disposer.newDisposable()
        editor.document.addDocumentListener(object : DocumentListener {
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
        val selections = editorIds[editor]?.let { selectionsJson(it) }
        return JsonObject(
            mapOf(
                "changes" to JsonArray(changes.toList()),
                "selections" to (selections?.let { Json.parseToJsonElement(it) } ?: JsonArray(emptyList())),
            )
        ).toString()
    }

    /** The editor's current selections as JSON, as editor state reports them */
    fun selectionsJson(editorId: String): String? {
        val editor = editorsById[editorId] ?: return null
        var json: String? = null
        ApplicationManager.getApplication().invokeAndWait {
            if (!editor.isDisposed) {
                json = Json.encodeToString(editor.caretModel.caretsAndSelections.map { selectionFromCaretState(editor, it) })
            }
        }
        return json
    }

    /**
     * Replaces [start, end) with [text], touching only the part that differs. Replacing text with the same text moves
     * the IDE's carets (VS Code keeps them), e.g. when the tutorial rewrites its document to set up the next step.
     */
    private fun replaceChangedPart(document: Document, start: Int, end: Int, text: String) {
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

    /**
     * For the engine's fallback: "textEditor" when a file editor has focus, otherwise "terminal" or "other", which
     * makes Cursorless hand commands on the selection back to Talon to run as keystrokes. Null when the IDE isn't
     * focused, which leaves commands as they are.
     */
    fun focusedElementType(): String? {
        val owner = KeyboardFocusManager.getCurrentKeyboardFocusManager().focusOwner ?: return null
        val inFileEditor = editorsById.values.any { editor ->
            editor.editorKind == EditorKind.MAIN_EDITOR && SwingUtilities.isDescendingFrom(owner, editor.contentComponent)
        }
        if (inFileEditor) {
            return "textEditor"
        }
        return if (isInTerminal(owner)) "terminal" else "other"
    }

    /**
     * Registers [editor] now and returns its state, for an editor just opened with focus that the engine must use
     * straight away (a new snippet file, the tutorial's document). Call on the EDT. The new tab may not be selected or
     * laid out yet, so it's reported visible and active as it's about to be, with its start visible rather than the
     * line or two an unsized editor reports. Otherwise the engine gives most of it no hats, and the tutorial's step
     * hats are lost. The editor's next update brings the real view.
     */
    fun editorStateNow(editor: Editor): EditorState {
        ensureEditorIdSet(editor)
        val psiFile = editor.project?.let { PsiDocumentManager.getInstance(it).getPsiFile(editor.document) }
        val lastLine = maxOf(0, minOf(editor.document.lineCount, 200) - 1)
        return serializeEditor(editor, editorIds[editor]!!, psiFile)
            .copy(active = true, visible = true, firstVisibleLine = 0, lastVisibleLine = lastLine)
    }

    fun talonSpokenFormsChanged() {
        emitScope.launch(emitDispatcher) {
            cursorlessEngine.talonSpokenFormsChanged()
        }
    }

    fun editorCreated(editor: Editor) {
        emitScope.launch(emitDispatcher) {
            callEngineWithEditorState(editor) { editorState -> cursorlessEngine.editorCreated(editorState) }
            return@launch
        }
    }

    fun editorClosed(editor: Editor) {
        val id = editorIds[editor]
        editorIds.remove(editor)
        if (id != null) {
            editorsById.remove(id)
            // Clean up the debounce flow to prevent memory leak
            editorDebounce.remove(id)
            dispatchScope.launch {
                cursorlessEngine.editorClosed(id)
            }
        }
    }

    private fun ensureEditorIdSet(editor: Editor) {
        if (!editorIds.containsKey(editor)) {
            val editorId = UUID.randomUUID().toString()
            editorIds[editor] = editorId
            editorsById[editorId] = editor
        }
    }

    fun focusChanged(editor: Editor) {
        editorChanged(editor)
    }

    fun documentChanged(document: Document) {
        editorIds.keys.forEach {
            if (it.document == document) {
                editorChanged(it)
            }
        }
    }

    private class CursorlessHandler(private val editorManager: EditorManager) : CursorlessCallback {

        private val logger: Logger = logger<CursorlessHandler>()

        override fun onHatUpdate(hatRanges: Array<HatRange>) {
            editorManager.hatsUpdated(hatRanges)
        }

        override fun setSelection(editorId: String, selections: Array<CursorlessRange>) {
            editorManager.setSelection(editorId, selections)
        }

        override fun clipboardCopy(editorId: String, selections: Array<CursorlessRange>) {
            editorManager.clipboardCopy(editorId, selections)
        }

        override fun clipboardPaste(editorId: String): String? {
            return editorManager.clipboardPaste(editorId)
        }

        override fun executeCommand(editorId: String, command: String, args: Array<String>): String? {
            thisLogger().info("Executing IDE action $command for $editorId")
            val editor = editorManager.editorsById[editorId]
                ?: throw IllegalStateException("No editor $editorId to run $command in")
            val project = editor.project ?: throw IllegalStateException("Editor $editorId has no project")
            // Throwing rejects the Cursorless command, so Talon reports the bad action id instead of doing nothing
            if (ActionManager.getInstance().getAction(command) == null) {
                throw IllegalArgumentException("Unknown IDE action: $command")
            }
            return editorManager.recordingIdeEdits(editor) {
                editorManager.executeInUndoStep(IDEActionCommand(project, command, editor))
            }
        }

        override fun executeRangeCommand(editorId: String, rangeCommand: CursorlessEditorCommand): String? {
            thisLogger().info("Executing executeRangeCommand $rangeCommand")
            val editor = editorManager.editorsById[editorId] ?: return null
            val project = editor.project ?: return null
            val command = RangedActionCommand(
                project,
                editor,
                rangeCommand.ranges.toTypedArray(),
                rangeCommand.singleRange,
                rangeCommand.restoreSelection,
                rangeCommand.ideCommand
            )
            return editorManager.recordingIdeEdits(editor) { editorManager.executeInUndoStep(command) }
        }

        override fun insertLineAfter(editorId: String, ranges: Array<CursorlessRange>): String? {
            thisLogger().info("Executing insertLineAfter $ranges")
            val editor = editorManager.editorsById[editorId] ?: return null
            val project = editor.project ?: return null
            val command = InsertLineAfterCommand.fromRanges(project, editor, ranges.toList())
            return editorManager.recordingIdeEdits(editor) { editorManager.executeInUndoStep(command) }
        }

        override fun insertSnippet(editorId: String, snippet: String) {
            thisLogger().info("Executing insertSnippet $snippet")
            editorManager.editorsById[editorId]?.let { editor ->
                editor.project?.let { project ->
                    val command = InsertSnippetCommand(project, editor, snippet)
                    editorManager.executeInUndoStep(command)
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
            logger.debug("Executing flashRanges $flashRanges")
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

        override fun setHighlightRanges(highlightId: String?, editorId: String, ranges: Array<CursorlessGeneralizedRange>) {
            logger.debug("Executing setHighlightRanges highlightId=$highlightId, editorId=$editorId, ranges=${ranges.size}")
            editorManager.editorsById[editorId]?.let { editor ->
                editor.project?.let { project ->
                    val command = SetHighlightRangesCommand(project, editor, highlightId, ranges.toList())
                    service<CommandExecutorService>().execute(command)
                }
            }
        }

        override fun prePhraseVersion(): String? {
            return service<FileCommandServerService>().commandServer.prePhraseVersion()
        }

        override fun findInDocument(editorId: String, query: String) {
            showFind(editorId, query, false)
        }

        override fun findInWorkspace(editorId: String, query: String) {
            showFind(editorId, query, true)
        }

        private fun showFind(editorId: String, query: String, inProject: Boolean) {
            editorManager.editorsById[editorId]?.let { editor ->
                editor.project?.let { project ->
                    service<CommandExecutorService>().execute(ShowFindCommand(project, editor, query, inProject))
                }
            }
        }

        override fun getFocusedElementType(): String? {
            return editorManager.focusedElementType()
        }

        override fun keyValueGet(key: String): String? {
            return CursorlessKeyValueStore.instance.get(key)
        }

        override fun keyValueSet(key: String, valueJson: String) {
            CursorlessKeyValueStore.instance.set(key, valueJson)
        }

        override fun readTalonSpokenForms(): String? {
            val path = talonSpokenFormsPath()
            return if (Files.exists(path)) Files.readString(path) else null
        }

        override fun showInputBox(optionsJson: String): String? {
            val options = Json.parseToJsonElement(optionsJson).jsonObject
            fun option(name: String) = options[name]?.jsonPrimitive?.contentOrNull
            val placeHolder = option("placeHolder")
            val prompt = (option("prompt") ?: "") + if (placeHolder != null) " (e.g. $placeHolder)" else ""
            var result: String? = null
            ApplicationManager.getApplication().invokeAndWait {
                result = Messages.showInputDialog(prompt, option("title") ?: "Cursorless", null, option("value"), null)
            }
            return result
        }

        override fun openSnippetFile(snippetName: String, directory: String): String {
            val project = editorManager.project
            val path = Paths.get(directory, "$snippetName.snippet")
            Files.createDirectories(path.parent)
            if (!Files.exists(path)) {
                Files.createFile(path)
            }
            var editorState: EditorState? = null
            ApplicationManager.getApplication().invokeAndWait {
                val file = LocalFileSystem.getInstance().refreshAndFindFileByNioFile(path)
                    ?: throw IllegalStateException("Cannot open snippet file $path")
                val editor = FileEditorManager.getInstance(project).openTextEditor(OpenFileDescriptor(project, file), true)
                    ?: throw IllegalStateException("Cannot open an editor for $path")
                editorState = editorManager.editorStateNow(editor)
            }
            return Json.encodeToString(editorState)
        }

        override fun commandHistoryAppend(fileName: String, entryJson: String) {
            editorManager.commandHistoryFiles.append(fileName, entryJson)
        }

        override fun commandHistoryEntries(): String {
            return editorManager.commandHistoryFiles.entriesJson()
        }

        override fun openUntitledTextDocument(content: String, language: String?): String {
            val project = editorManager.project
            val extension = language?.let { extensionForLanguage(it) } ?: "txt"
            var result: JsonObject? = null
            ApplicationManager.getApplication().invokeAndWait {
                val fileEditorManager = FileEditorManager.getInstance(project)
                // The new tab replaces this one in its split. Report it hidden along with the new editor: its own
                // update comes later, and until then its tokens compete for hats (e.g. ones a tutorial step pins)
                val replaced = fileEditorManager.selectedTextEditor
                val file = LightVirtualFile("Untitled.$extension", content)
                val editor = fileEditorManager.openTextEditor(OpenFileDescriptor(project, file), true)
                    ?: throw IllegalStateException("Cannot open an editor for the new document")
                val hiddenEditorIds = listOfNotNull(replaced?.takeIf { it != editor }?.let { editorManager.editorIds[it] })
                result = JsonObject(
                    mapOf(
                        "editor" to Json.encodeToJsonElement(editorManager.editorStateNow(editor)),
                        "hiddenEditorIds" to JsonArray(hiddenEditorIds.map { JsonPrimitive(it) }),
                    )
                )
            }
            return result.toString()
        }

        override fun tutorialStateChanged(stateJson: String) {
            editorManager.tutorialStateListener?.invoke(stateJson)
        }

        override fun showMessage(type: String, id: String, message: String) {
            val notificationType = when (type) {
                "error" -> NotificationType.ERROR
                "warning" -> NotificationType.WARNING
                else -> NotificationType.INFORMATION
            }
            val project = editorManager.project
            NotificationGroupManager.getInstance().getNotificationGroup("Cursorless")
                .createNotification("Cursorless", message, notificationType)
                .notify(project)
        }

        override fun focusEditor(editorId: String) {
            editorManager.editorsById[editorId]?.let { editor ->
                editor.project?.let { project ->
                    service<CommandExecutorService>().execute(FocusEditorCommand(project, editor))
                }
            }
        }

        override fun documentUpdated(editorId: String, edit: CursorlessEditorEdit): String? {
            editorManager.documentUpdated(editorId, edit)
            return editorManager.selectionsJson(editorId)
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

        getCursorlessContainers().forEach {
            val editor = it.editor
            val editorId = editorIds[editor]
            if (editorId != null) {
                val format = editorToFormat[editorId]
                if (format != null) {
                    it.updateHats(format)
                }
            }
        }
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
        this.editorsById.values.forEach { editor ->
            editorCreated(editor)
        }
    }

    @Synchronized
    fun updateEngine(newEngine: CursorlessEngine) {
        logger.info("Updating CursorlessEngine reference")
        this.cursorlessEngine = newEngine
        // Update the callback handler with the new engine's callback
        newEngine.setCursorlessCallback(CursorlessHandler(this))
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

/** Where Talon writes Cursorless's custom spoken forms. */
fun talonSpokenFormsPath(): Path = Paths.get(System.getProperty("user.home"), ".cursorless", "state.json")
