package com.github.asoee.cursorlessjetbrains.javet

import com.caoccao.javet.annotations.V8Function
import com.github.asoee.cursorlessjetbrains.cursorless.HatUpdateCallback
import com.github.asoee.cursorlessjetbrains.sync.HatRange
import kotlinx.serialization.json.Json

class IdeClientCallback {

    var hatUpdateCallback: HatUpdateCallback = object : HatUpdateCallback {
        override fun onHatUpdate(hatRanges: Array<HatRange>) {
            println("ASOEE/PLUGIN: HatUpdateCallback not set")
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
        hatUpdateCallback.onHatUpdate(hatRanges)
    }

    @V8Function
    public fun documentUpdated(updateJson: String) {
        println("DocumentUpdated: $updateJson")
    }

}