package com.github.asoee.cursorlessjetbrains.commandserver.http

import com.github.asoee.cursorlessjetbrains.commands.CommandExecutorService
import com.github.asoee.cursorlessjetbrains.commands.CommandRegistryService
import com.github.asoee.cursorlessjetbrains.commands.CommandRequest
import com.intellij.notification.*
import com.intellij.openapi.components.service
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.diagnostic.logger
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.project.ProjectManager
import com.sun.net.httpserver.HttpExchange
import com.sun.net.httpserver.HttpHandler
import io.ktor.utils.io.core.*
import java.io.IOException
import java.io.UnsupportedEncodingException
import java.net.URI
import java.net.URLDecoder
import java.util.*
import kotlin.text.toByteArray

class HttpCommandHandler : HttpHandler {

    private val LOG: Logger = logger<HttpCommandServer>()

    @Throws(IOException::class)
    override fun handle(httpExchange: HttpExchange) {
        try {
            LOG.info("Handling " + httpExchange.requestURI.toString() + httpExchange.requestMethod)
            val bodyStream = httpExchange.requestBody
            val s = Scanner(bodyStream).useDelimiter("\\A")
            val response: VoicePluginResponse = fromRequestUri(httpExchange.requestURI)
                .map({ handleRquest(it) })
                .map { resp -> VoicePluginResponse(200, resp) }
                .orElse(VoicePluginResponse(502, "BAD"))
            LOG.info("Response: " + response)
            httpExchange.sendResponseHeaders(response.responseCode, response.response.length.toLong())
            val os = httpExchange.responseBody
            os.write(response.response.toByteArray(Charsets.UTF_8))
            os.close()
        } catch (e: Exception) {
            LOG.error("Failed to process command... ", e)
            val notification = Notification(
                "vc-idea", "Talon jetbrains", "Failed to process command: " + e.message,
                NotificationType.WARNING
            )
            Notifications.Bus.notify(notification)

            val response = e.toString()
            httpExchange.sendResponseHeaders(500, response.length.toLong())
            val os = httpExchange.responseBody
            os.write(response.toByteArray())
            os.close()
        }
    }

    fun handleRquest(request: CommandRequest): String {
        val registryService = service<CommandRegistryService>()
        val command = registryService.getCommand(request)

        val executorService = service<CommandExecutorService>()
        if (command != null) {
            return executorService.execute(command)
        } else {
            LOG.error("Command not found: " + request.command)
            val notification = Notification(
                "vc-idea", "Talon jetbrains", "Command not found: " + request.command,
                NotificationType.WARNING
            )
            Notifications.Bus.notify(notification)

            return "NotFound"
        }
    }

    fun fromRequestUri(requestURI: URI): Optional<CommandRequest> {

        try {
            val decode = URLDecoder.decode(requestURI.toString().substring(1), "UTF-8")
            var split = decode.split("/")
            // XXX For debugging
            val notification = Notification(
                "vc-idea", "Talon jetbrains", decode,
                NotificationType.INFORMATION
            )
            Notifications.Bus.notify(notification)

            split = split[1].split(" ")
            val command: String = split.get(0)
            val args = split.subList(1, split.size)
            val focusedProject = getFocusedProject()
            if (focusedProject == null) {
                LOG.error("No focused project")
                return Optional.empty()
            } else {
                val commandRequest = CommandRequest(focusedProject, command, args)
                LOG.info("Command request: " + commandRequest)
                return Optional.of(commandRequest)

            }
        } catch (e: UnsupportedEncodingException) {
            LOG.error("Failed to parse request URI", e)
            return Optional.empty()

        }
    }

    fun getFocusedProject(): Project? {
        return FileEditorManager.getInstance(ProjectManager.getInstance().defaultProject)
            .selectedTextEditor?.project
    }


    data class VoicePluginResponse(val responseCode: Int, val response: String)

}