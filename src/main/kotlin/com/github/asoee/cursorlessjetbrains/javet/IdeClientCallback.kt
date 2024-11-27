package com.github.asoee.cursorlessjetbrains.javet

import com.caoccao.javet.annotations.V8Function
import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessRange
import com.github.asoee.cursorlessjetbrains.cursorless.HatUpdateCallback
import com.github.asoee.cursorlessjetbrains.sync.HatRange
import com.github.asoee.cursorlessjetbrains.sync.Selection
import kotlinx.serialization.json.Json

//    typealias HatUpdateCallback = (Array<HatRange>) -> Unit
public typealias SetSelectionCallbackFunc = (editorId: String, selection: Array<CursorlessRange>) -> Unit

class IdeClientCallback {

    val unhandledRejections = mutableListOf<String>()

    var hatUpdateCallback: HatUpdateCallback = object : HatUpdateCallback {
        override fun onHatUpdate(hatRanges: Array<HatRange>) {
            println("ASOEE/PLUGIN: HatUpdateCallback not set")
        }
    }

    var setSelectionCallback: SetSelectionCallbackFunc = ::dummySetSelectionCallback;

    fun dummySetSelectionCallback(editorId: String, selections: Array<CursorlessRange>) : Unit {
        println("ASOEE/PLUGIN: SetSelectionCallbackFunc not set")
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
        hatUpdateCallback.onHatUpdate(hatRanges)
    }

    @V8Function
    public fun documentUpdated(updateJson: String) {
        println("DocumentUpdated: $updateJson")
    }

    @V8Function
    public fun setSelection(editorId: String, selectionsJson: String) {
        println("IdeClientCallback.setSelection: $selectionsJson")
        val selections = Json{ ignoreUnknownKeys = true }.decodeFromString<Array<CursorlessRange>>(selectionsJson)
        setSelectionCallback(editorId, selections)
    }

    @V8Function
    public fun unhandledRejection(cause: String) {
        println("IdeClientCallback.v: $cause")
        unhandledRejections.add(cause)
    }

}