package com.github.asoee.cursorlessjetbrains.commands

import com.github.asoee.cursorlessjetbrains.services.TalonApplicationService
import com.intellij.openapi.components.service

class CursorlessCommand: VcCommand() {

    override fun run(): String {
        val appService = service<TalonApplicationService>()
//        appService.jsDriver.execute("cursorless.action", emptyList())
        return ""
    }
}