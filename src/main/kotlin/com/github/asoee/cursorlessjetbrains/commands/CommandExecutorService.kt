package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.command.WriteCommandAction
import com.intellij.openapi.components.Service
import com.intellij.openapi.diagnostic.thisLogger
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

@Service(Service.Level.PROJECT)
class CommandExecutorService {

    fun execute(command: VcCommand): String {
        return run(command) { context -> command.execute(context) } ?: ""
    }

    /**
     * Like [execute], but keeps the command's result as JSON, for returning to Talon over the command server.
     */
    fun executeForResult(command: VcCommand): JsonElement? {
        if (command.invokeOnly()) {
            run(command) { context -> command.executeForResult(context) }
            return JsonObject(mapOf("returnValue" to JsonPrimitive("")))
        }
        return run(command) { context -> command.executeForResult(context) }
    }

    private fun <T> run(command: VcCommand, block: (CommandContext) -> T): T? {
        thisLogger().info("Executing command: ${command.toString()}")
        return try {
            if (command.executionMode() == ExecutionMode.BACKGROUND) {
                val context = CommandContext(command.project)
                block(context)
            } else {
                executeOnEDT(command, block)
            }
        } catch (e: Exception) {
            thisLogger().warn("Exception thrown while executing command: ${command.toString()}", e)
            throw e
        }
    }

    private fun <T> executeOnEDT(command: VcCommand, block: (CommandContext) -> T): T? {
        var result: T? = null

        if (command.invokeOnly()) {
            ApplicationManager.getApplication().invokeLater {
                val context = CommandContext(command.project)
                block(context)
            }
            return null
        }


        ApplicationManager.getApplication().invokeAndWait {
            val context = CommandContext(command.project)
            when (command.executionMode()) {
                ExecutionMode.EDT -> {
                    result = block(context)
                }

                ExecutionMode.READ -> {
                    result = block(context)
                }

                ExecutionMode.WRITE -> {
                    WriteCommandAction.runWriteCommandAction(command.project) {
                        result = block(context)
                    }
                }

                ExecutionMode.BACKGROUND -> {
                    // do nothing
                }
            }
        }
        return result

    }

}
