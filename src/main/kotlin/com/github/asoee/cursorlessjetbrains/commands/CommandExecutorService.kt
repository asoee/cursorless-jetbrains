package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.command.WriteCommandAction
import com.intellij.openapi.components.Service

@Service(Service.Level.PROJECT)
class CommandExecutorService {

    fun execute(command: VcCommand): String {
        if (command.executionMode() == ExecutionMode.BACKGROUND) {
            val context = CommandContext(command.project)
            return command.execute(context)
        } else {
            return executeOnEDT(command)
        }
    }

    private fun executeOnEDT(command: VcCommand): String {
        val result: ArrayList<String> = ArrayList()

        if (command.invokeOnly()) {
            ApplicationManager.getApplication().invokeLater {
                val context = CommandContext(command.project)
                command.execute(context)
            }
            return ""
        }


        ApplicationManager.getApplication().invokeAndWait {
            val context = CommandContext(command.project)
            when (command.executionMode()) {
                ExecutionMode.EDT -> {
                    val res = command.execute(context)
                    if (res != null) {
                        result.add(res)
                    }
                }

                ExecutionMode.READ -> {
                    val res = command.execute(context)
                    if (res != null) {
                        result.add(res)
                    }

                }

                ExecutionMode.WRITE -> {
                    WriteCommandAction.runWriteCommandAction(command.project) {
                        val res = command.execute(context)
                        if (res != null) {
                            result.add(res)
                        }
                    }
                }

                ExecutionMode.BACKGROUND -> {
                    // do nothing
                }
            }
        }
        return result.joinToString("")

    }

}