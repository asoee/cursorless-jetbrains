package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.application.ApplicationManager
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
//                ReadAction.run<Throwable> {
                val res = command.execute(CommandContext())
                if (res != null) {
                    result.add(res)
                }
//                }
            } else {
                val res = command.execute(CommandContext())
                if (res != null) {
                    result.add(res)
                }
            }
        }
        return result.joinToString("")

    }

    private fun executeRawCommand(command: VcCommand): String {
        command.execute(CommandContext())
        return "OK"
    }

}