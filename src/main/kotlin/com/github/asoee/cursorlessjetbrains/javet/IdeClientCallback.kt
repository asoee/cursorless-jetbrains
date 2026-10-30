package com.github.asoee.cursorlessjetbrains.javet

import com.caoccao.javet.annotations.V8Function
import com.github.asoee.cursorlessjetbrains.cursorless.*
import com.github.asoee.cursorlessjetbrains.sync.HatRange
import com.intellij.openapi.diagnostic.logger
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonPrimitive

class IdeClientCallback {

    private val logger = logger<IdeClientCallback>()

    val unhandledRejections = mutableListOf<String>()

    var cursorlessCallback: CursorlessCallback = NoopCallback()
    var treesitterCallback: TreesitterCallback = NoopTreesitterCallback()

    private val jsonDecoder = Json { ignoreUnknownKeys = true }

    private class NoopTreesitterCallback : TreesitterCallback

    private class NoopCallback : CursorlessCallback {
        override fun onHatUpdate(hatRanges: Array<HatRange>) {
            println("ASOEE/PLUGIN: CursorlessCallback not set")
        }

        override fun setSelection(editorId: String, selections: Array<CursorlessRange>) {
            println("ASOEE/PLUGIN: CursorlessCallback not set")
        }

        override fun documentUpdated(editorId: String, edit: CursorlessEditorEdit) {
            println("ASOEE/PLUGIN: CursorlessCallback not set")
        }

        override fun clipboardCopy(editorId: String, selections: Array<CursorlessRange>) {
            println("ASOEE/PLUGIN: CursorlessCallback not set")
        }

        override fun clipboardPaste(editorId: String) {
            println("ASOEE/PLUGIN: CursorlessCallback not set")
        }

        override fun executeCommand(editorId: String, command: String, args: Array<String>) {
            println("ASOEE/PLUGIN: CursorlessCallback not set")
        }

        override fun executeRangeCommand(editorId: String, rangeCommand: CursorlessEditorCommand) {
            println("ASOEE/PLUGIN: CursorlessCallback not set")
        }

        override fun insertLineAfter(editorId: String, ranges: Array<CursorlessRange>) {
            println("ASOEE/PLUGIN: CursorlessCallback not set")
        }

        override fun insertSnippet(editorId: String, snippet: String) {
            println("ASOEE/PLUGIN: CursorlessCallback not set")
        }

        override fun revealLine(editorId: String, line: Int, revealAt: String) {
            println("ASOEE/PLUGIN: CursorlessCallback not set")
        }

        override fun flashRanges(flashRanges: Array<CursorlessFlashRange>) {
            println("ASOEE/PLUGIN: CursorlessCallback not set")
        }

        override fun setHighlightRanges(highlightId: String?, editorId: String, ranges: Array<CursorlessGeneralizedRange>) {
            println("ASOEE/PLUGIN: CursorlessCallback not set")
        }

        override fun prePhraseVersion(): String? {
            println("ASOEE/PLUGIN: prePhraseVersion/CursorlessCallback not set")
            return null
        }

        override fun findInDocument(editorId: String, query: String) {
            println("ASOEE/PLUGIN: CursorlessCallback not set")
        }

        override fun findInWorkspace(editorId: String, query: String) {
            println("ASOEE/PLUGIN: CursorlessCallback not set")
        }

        override fun focusEditor(editorId: String) {
            println("ASOEE/PLUGIN: CursorlessCallback not set")
        }

        override fun getFocusedElementType(): String? {
            return null
        }

        override fun keyValueGet(key: String): String? {
            return null
        }

        override fun keyValueSet(key: String, valueJson: String) {
            println("ASOEE/PLUGIN: CursorlessCallback not set")
        }

        override fun readTalonSpokenForms(): String? {
            return null
        }

        override fun showInputBox(optionsJson: String): String? {
            return null
        }

        override fun openSnippetFile(snippetName: String, directory: String): String {
            throw IllegalStateException("CursorlessCallback not set")
        }

    }


    @V8Function
    fun log(args: String) {
//        var logline = ""
//        for (s in args) {
//            logline += s
//        }
        println("" + args)
    }

    @V8Function
    fun hatsUpdated(hatsJson: String) {
//        println("PLUGIN: Hats updated")
        val hatRanges = Json.decodeFromString<Array<HatRange>>(hatsJson)
        cursorlessCallback.onHatUpdate(hatRanges)
    }

    @V8Function
    fun documentUpdated(editorId: String, updateJson: String) {
        logger.info("DocumentUpdated: $updateJson")
        val edit = Json { ignoreUnknownKeys = true }.decodeFromString<CursorlessEditorEdit>(updateJson)
        cursorlessCallback.documentUpdated(editorId, edit)
    }

    @V8Function
    fun setSelection(editorId: String, selectionsJson: String) {
        logger.info("IdeClientCallback.setSelection: $selectionsJson")
        val selections = Json { ignoreUnknownKeys = true }.decodeFromString<Array<CursorlessRange>>(selectionsJson)
        cursorlessCallback.setSelection(editorId, selections)
    }

    @V8Function
    fun clipboardCopy(editorId: String, rangesJson: String) {
        logger.info("IdeClientCallback.clipboardCopy: $rangesJson")
        val selections = Json { ignoreUnknownKeys = true }.decodeFromString<Array<CursorlessRange>>(rangesJson)
        cursorlessCallback.clipboardCopy(editorId, selections)
    }

    @V8Function
    fun clipboardPaste(editorId: String) {
        logger.info("IdeClientCallback.clipboardCopy")
        cursorlessCallback.clipboardPaste(editorId)
    }

    @V8Function
    fun executeCommand(editorId: String, command: String, argsJson: String) {
        logger.info("IdeClientCallback.executeCommand: $command, $argsJson")
        // Command args can be any JSON value; pass strings through as-is and anything else as JSON text
        val args = jsonDecoder.decodeFromString<JsonArray>(argsJson)
            .map { (it as? JsonPrimitive)?.takeIf { p -> p.isString }?.content ?: it.toString() }
            .toTypedArray()
        cursorlessCallback.executeCommand(editorId, command, args)
    }

    @V8Function
    fun executeRangeCommand(editorId: String, commandJson: String) {
        logger.info("IdeClientCallback.executeCommand:  $commandJson")
        val rangeCommand = Json { ignoreUnknownKeys = true }.decodeFromString<CursorlessEditorCommand>(commandJson)
        cursorlessCallback.executeRangeCommand(editorId, rangeCommand)
    }

    @V8Function
    fun insertLineAfter(editorId: String, rangesJson: String) {
        logger.info("IdeClientCallback.insertLineAfter: $rangesJson")
        val ranges = Json { ignoreUnknownKeys = true }.decodeFromString<Array<CursorlessRange>>(rangesJson)
        cursorlessCallback.insertLineAfter(editorId, ranges)
    }

    @V8Function
    fun insertSnippet(editorId: String, snippet: String) {
        logger.info("IdeClientCallback.insertSnippet: $snippet")
        cursorlessCallback.insertSnippet(editorId, snippet)
    }

    @V8Function
    fun revealLine(editorId: String, line: Int, revealAt: String) {
        logger.info("IdeClientCallback.revealLine: $line")
        cursorlessCallback.revealLine(editorId, line, revealAt)
    }


    @V8Function
    fun flashRanges(flashRangesJson: String) {
        logger.info("IdeClientCallback.flashRanges: $flashRangesJson")
        val ranges = jsonDecoder.decodeFromString<Array<CursorlessFlashRange>>(flashRangesJson)
        cursorlessCallback.flashRanges(ranges)
    }

    @V8Function
    fun setHighlightRanges(highlightId: String?, editorId: String, rangesJson: String) {
        logger.info("IdeClientCallback.setHighlightRanges: highlightId=$highlightId, editorId=$editorId, ranges=$rangesJson")
        val ranges = jsonDecoder.decodeFromString<Array<CursorlessGeneralizedRange>>(rangesJson)
        cursorlessCallback.setHighlightRanges(highlightId, editorId, ranges)
    }

    @V8Function
    fun findInDocument(editorId: String, query: String) {
        logger.info("IdeClientCallback.findInDocument: $editorId")
        cursorlessCallback.findInDocument(editorId, query)
    }

    @V8Function
    fun findInWorkspace(editorId: String, query: String) {
        logger.info("IdeClientCallback.findInWorkspace: $editorId")
        cursorlessCallback.findInWorkspace(editorId, query)
    }

    @V8Function
    fun focusEditor(editorId: String) {
        logger.info("IdeClientCallback.focusEditor: $editorId")
        cursorlessCallback.focusEditor(editorId)
    }

    @V8Function
    fun getFocusedElementType(): String? {
        return cursorlessCallback.getFocusedElementType()
    }

    @V8Function
    fun keyValueGet(key: String): String? {
        return cursorlessCallback.keyValueGet(key)
    }

    @V8Function
    fun keyValueSet(key: String, valueJson: String) {
        logger.info("IdeClientCallback.keyValueSet: $key")
        cursorlessCallback.keyValueSet(key, valueJson)
    }

    @V8Function
    fun readTalonSpokenForms(): String? {
        return cursorlessCallback.readTalonSpokenForms()
    }

    @V8Function
    fun showInputBox(optionsJson: String): String? {
        logger.info("IdeClientCallback.showInputBox: $optionsJson")
        return cursorlessCallback.showInputBox(optionsJson)
    }

    @V8Function
    fun openSnippetFile(snippetName: String, directory: String): String {
        logger.info("IdeClientCallback.openSnippetFile: $snippetName in $directory")
        return cursorlessCallback.openSnippetFile(snippetName, directory)
    }

    @V8Function
    fun readQuery(filename: String): String? {
        logger.info("IdeClientCallback.readQuery: $filename")
        return treesitterCallback.readQuery(filename)
    }

    @V8Function
    fun prePhraseVersion(): String? {
        val prePhraseVersion = cursorlessCallback.prePhraseVersion()
//        LOG.info("IdeClientCallback.prePhraseVersion: $prePhraseVersion")
        return prePhraseVersion
    }

    @V8Function
    fun unhandledRejection(cause: String) {
        logger.info("IdeClientCallback.unhandledRejection: $cause")
        unhandledRejections.add(cause)
    }


}