package com.github.asoee.cursorlessjetbrains.action

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.ActionManager
import com.intellij.openapi.diagnostic.Logger

class ListAllActions : AnAction() {

    private val logger = Logger.getInstance(ListAllActions::class.java)

    override fun actionPerformed(event: AnActionEvent) {
        val actionManager = ActionManager.getInstance()
        val actionIds = actionManager.getActionIds("")
        actionIds.forEach { actionId ->
            logger.info("Action ID: $actionId")
        }
    }
}