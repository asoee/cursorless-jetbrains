package com.github.asoee.cursorlessjetbrains.javet

import com.caoccao.javet.annotations.V8Function
import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessCallback
import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessEditorEdit
import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessRange
import com.github.asoee.cursorlessjetbrains.sync.HatRange
import kotlinx.serialization.json.Json

//    typealias HatUpdateCallback = (Array<HatRange>) -> Unit
public typealias SetSelectionCallbackFunc = (editorId: String, selection: Array<CursorlessRange>) -> Unit
public typealias DocumentUpdateCallbackFunc = (editorId: String, edit: CursorlessEditorEdit) -> Unit

class IdeClientCallback {

    val unhandledRejections = mutableListOf<String>()

    var cursorlessCallback: CursorlessCallback = NoopCallback()


    private class NoopCallback : CursorlessCallback {
        override fun onHatUpdate(hatRanges: Array<HatRange>) {
            println("ASOEE/PLUGIN: CursorlessCallback not set")
        }

        override fun setSelection(editorId: String, selections: Array<CursorlessRange>): Unit {
            println("ASOEE/PLUGIN: CursorlessCallback not set")
        }

        override fun documentUpdated(editorId: String, edit: CursorlessEditorEdit) {
            println("ASOEE/PLUGIN: CursorlessCallback not set")
        }

    }


    @V8Function
    public fun log(args: String) {
//        var logline = ""
//        for (s in args) {
//            logline += s
//        }
        println("" + args)
    }

    @V8Function
    public fun hatsUpdated(hatsJson: String) {
        println("ASOEE/PLUGIN: Hats updated")
        val hatRanges = Json.decodeFromString<Array<HatRange>>(hatsJson)
        cursorlessCallback.onHatUpdate(hatRanges)
    }

    @V8Function
    public fun documentUpdated(editorId: String, updateJson: String) {
        println("DocumentUpdated: $updateJson")
        val edit = Json { ignoreUnknownKeys = true }.decodeFromString<CursorlessEditorEdit>(updateJson)
        cursorlessCallback.documentUpdated(editorId, edit)
    }

    @V8Function
    public fun setSelection(editorId: String, selectionsJson: String) {
        println("IdeClientCallback.setSelection: $selectionsJson")
        val selections = Json { ignoreUnknownKeys = true }.decodeFromString<Array<CursorlessRange>>(selectionsJson)
        cursorlessCallback.setSelection(editorId, selections)
    }

    @V8Function
    public fun unhandledRejection(cause: String) {
        println("IdeClientCallback.v: $cause")
        unhandledRejections.add(cause)
    }

}