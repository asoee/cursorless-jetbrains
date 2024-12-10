package com.github.asoee.cursorlessjetbrains.services

class Console {

    fun log(args: String) {
//        var logline = ""
//        for (s in args) {
//            logline += s
//        }
        println("" + args)
    }

    fun debug(args: String?) {
//        var logline = ""
//        for (s in args) {
//            logline += s
//        }
        println("" + args)
    }

    fun error(args: String?) {
//        var logline = ""
//        for (s in args) {
//            logline += s
//        }
        println("" + args)
    }
}