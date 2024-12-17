package com.github.asoee.cursorlessjetbrains.javet

import com.caoccao.javet.annotations.V8Function
import com.github.asoee.cursorlessjetbrains.cursorless.*
import com.github.asoee.cursorlessjetbrains.sync.HatRange
import com.intellij.openapi.diagnostic.logger
import kotlinx.serialization.json.Json

class IdeClientCallback {

    val LOG = logger<IdeClientCallback>()

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

        override fun revealLine(editorId: String, line: Int, revealAt: String) {
            println("ASOEE/PLUGIN: CursorlessCallback not set")
        }

        override fun flashRanges(flashRanges: Array<CursorlessFlashRange>) {
            println("ASOEE/PLUGIN: CursorlessCallback not set")
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
        LOG.info("DocumentUpdated: $updateJson")
        val edit = Json { ignoreUnknownKeys = true }.decodeFromString<CursorlessEditorEdit>(updateJson)
        cursorlessCallback.documentUpdated(editorId, edit)
    }

    @V8Function
    fun setSelection(editorId: String, selectionsJson: String) {
        LOG.info("IdeClientCallback.setSelection: $selectionsJson")
        val selections = Json { ignoreUnknownKeys = true }.decodeFromString<Array<CursorlessRange>>(selectionsJson)
        cursorlessCallback.setSelection(editorId, selections)
    }

    @V8Function
    fun clipboardCopy(editorId: String, rangesJson: String) {
        LOG.info("IdeClientCallback.clipboardCopy: $rangesJson")
        val selections = Json { ignoreUnknownKeys = true }.decodeFromString<Array<CursorlessRange>>(rangesJson)
        cursorlessCallback.clipboardCopy(editorId, selections)
    }

    @V8Function
    fun clipboardPaste(editorId: String) {
        LOG.info("IdeClientCallback.clipboardCopy")
        cursorlessCallback.clipboardPaste(editorId)
    }

    @V8Function
    fun executeCommand(editorId: String, command: String, argsJson: String) {
        LOG.info("IdeClientCallback.executeCommand: $command, $argsJson")
        val args = Json { ignoreUnknownKeys = true }.decodeFromString<Array<String>>(argsJson)
        cursorlessCallback.executeCommand(editorId, command, args)
    }

    @V8Function
    fun executeRangeCommand(editorId: String, commandJson: String) {
        LOG.info("IdeClientCallback.executeCommand:  $commandJson")
        val rangeCommand = Json { ignoreUnknownKeys = true }.decodeFromString<CursorlessEditorCommand>(commandJson)
        cursorlessCallback.executeRangeCommand(editorId, rangeCommand)
    }

    @V8Function
    fun insertLineAfter(editorId: String, rangesJson: String) {
        LOG.info("IdeClientCallback.insertLineAfter: $rangesJson")
        val ranges = Json { ignoreUnknownKeys = true }.decodeFromString<Array<CursorlessRange>>(rangesJson)
        cursorlessCallback.insertLineAfter(editorId, ranges)
    }

    @V8Function
    fun revealLine(editorId: String, line: Int, revealAt: String) {
        LOG.info("IdeClientCallback.revealLine: $line")
        cursorlessCallback.revealLine(editorId, line, revealAt)
    }


    @V8Function
    fun flashRanges(flashRangesJson: String) {
        LOG.info("IdeClientCallback.flashRanges: $flashRangesJson")
        val ranges = jsonDecoder.decodeFromString<Array<CursorlessFlashRange>>(flashRangesJson)
        cursorlessCallback.flashRanges(ranges)
    }


    @V8Function
    fun readQuery(filename: String): String? {
        LOG.info("IdeClientCallback.readQuery: $filename")
        return treesitterCallback.readQuery(filename)
    }

    @V8Function
    fun unhandledRejection(cause: String) {
        LOG.info("IdeClientCallback.unhandledRejection: $cause")
        unhandledRejections.add(cause)
    }


}