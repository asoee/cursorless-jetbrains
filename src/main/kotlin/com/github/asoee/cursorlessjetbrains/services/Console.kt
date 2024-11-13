package com.github.asoee.cursorlessjetbrains.services

import com.intellij.openapi.diagnostic.thisLogger

class Console {

    fun log(args: String?) {
//        var logline = ""
//        for (s in args) {
//            logline += s
//        }
      thisLogger().warn("" + args)
    }
}