package com.github.asoee.cursorlessjetbrains.graaljs

import com.intellij.openapi.diagnostic.thisLogger

class IdeClientCallback {

    public fun log(args: String) {
//        var logline = ""
//        for (s in args) {
//            logline += s
//        }
        println("" + args)
    }

    public fun hatsUpdated(hatsJson: String) {
        println("ASOEE/PLUGIN: Hats updated: $hatsJson")
    }

    public fun documentUpdated(updateJson: String) {
        println("DocumentUpdated: $updateJson")
    }

}