package com.github.asoee.cursorlessjetbrains.commandserver.http

import com.github.asoee.cursorlessjetbrains.commands.CommandExecutorService
import com.github.asoee.cursorlessjetbrains.commands.CommandRegistryService
import com.github.asoee.cursorlessjetbrains.commands.CommandRequest
import com.intellij.ide.impl.ProjectUtil
import com.intellij.notification.Notification
import com.intellij.notification.NotificationType
import com.intellij.notification.Notifications
import com.intellij.openapi.components.service
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.diagnostic.logger
import com.intellij.openapi.project.Project
import com.intellij.openapi.project.ProjectManager
import com.intellij.openapi.wm.IdeFocusManager
import com.sun.net.httpserver.HttpExchange
import com.sun.net.httpserver.HttpHandler
import java.io.IOException
import java.io.UnsupportedEncodingException
import java.net.URI
import java.net.URLDecoder
import java.util.*

class HttpCommandHandler : HttpHandler {

    private val logger: Logger = logger<HttpCommandHandler>()

    @Throws(IOException::class)
    override fun handle(httpExchange: HttpExchange) {
        try {
            logger.info("Handling " + httpExchange.requestMethod + " " + httpExchange.requestURI.toString())
            val response: VoicePluginResponse = fromRequestUri(httpExchange.requestURI)
                .map({ handleRequest(it) })
                .map { resp -> VoicePluginResponse(200, resp) }
                .orElse(VoicePluginResponse(502, "BAD"))
            logger.info("Response: $response")
            httpExchange.sendResponseHeaders(response.responseCode, response.response.length.toLong())
            val os = httpExchange.responseBody
            os.write(response.response.toByteArray(Charsets.UTF_8))
            os.close()
        } catch (e: Exception) {
            logger.error("Failed to process command... ", e)
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

    private fun handleRequest(request: CommandRequest): String {
        val project = request.project
        val registryService = project.service<CommandRegistryService>()
        val command = registryService.getCommand(request)

        val executorService = project.service<CommandExecutorService>()
        if (command != null) {
            return executorService.execute(command)
        } else {
            logger.warn("Command not found: " + request.command + " " + request.args)
            val notification = Notification(
                "vc-idea", "Talon jetbrains", "Command not found: " + request.command + " " + request.args,
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
            val command: String = split[0]
            val args = split.subList(1, split.size)
            val focusedProject = getFocusedProject()
            if (focusedProject == null) {
                logger.error("No focused project")
                return Optional.empty()
            } else {
                val commandRequest = CommandRequest(focusedProject, command, args)
                logger.info("Command request: " + commandRequest)
                return Optional.of(commandRequest)

            }
        } catch (e: UnsupportedEncodingException) {
            logger.error("Failed to parse request URI", e)
            return Optional.empty()

        }
    }

    fun getFocusedProject(): Project? {
        //best effort to find an active project

        var project = ProjectUtil.getActiveProject()

        if (project == null || !isProjectValid(project)) {
            project = IdeFocusManager.getGlobalInstance().lastFocusedFrame?.project
        }

        if (project == null || !isProjectValid(project)) {
            project = ProjectManager.getInstance().openProjects.firstOrNull { p -> !p.isDisposed }
        }

        return project?.takeIf { isProjectValid(project) }

    }


    private fun isProjectValid(project: Project?): Boolean {
        return project != null && !project.isDisposed && !project.isDefault && project.isOpen
    }

    data class VoicePluginResponse(val responseCode: Int, val response: String)

}