package com.github.asoee.cursorlessjetbrains.cursorless

import com.github.asoee.cursorlessjetbrains.javet.SimpleActionName

const val setSelection: SimpleActionName = "setSelection"
const val revealTypeDefinition: SimpleActionName = "revealTypeDefinition"

class CursorlessCommand(val command: String, val target: CursorlessTarget) {


    companion object {
        fun actionNameFromSpokenForm(spokenform: String): String {
            return when {
                spokenform.startsWith("take") -> "setSelection"
                spokenform.startsWith("type deaf") -> "revealTypeDefinition"
                else -> "unknown"
            }
        }
    }

    fun actionName(): String {
        return actionNameFromSpokenForm(command)
    }
}
