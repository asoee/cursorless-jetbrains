package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.command.WriteCommandAction
import com.intellij.openapi.components.Service

@Service
class CommandExecutorService {

    fun execute(command: VcCommand): String {
        return executeOnEDT(command)
    }

    private fun executeOnEDT(command: VcCommand): String {
        val result: ArrayList<String> = ArrayList()

        ApplicationManager.getApplication().invokeAndWait {
            if (command.readonly()) {
                val context = CommandContext(command.project)
                val res = command.execute(CommandContext(command.project))
                if (res != null) {
                    result.add(res)
                }
//                }
            } else {
                val context = CommandContext(command.project)
                WriteCommandAction.runWriteCommandAction(command.project) {
                    val res = command.execute(context)
                    if (res != null) {
                        result.add(res)
                    }
                }
            }
        }
        return result.joinToString("")

    }

}