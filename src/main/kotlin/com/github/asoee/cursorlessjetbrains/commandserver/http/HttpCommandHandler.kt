package com.github.asoee.cursorlessjetbrains.commandserver.http

import com.github.asoee.cursorlessjetbrains.commands.CommandExecutorService
import com.github.asoee.cursorlessjetbrains.commands.CommandRegistryService
import com.github.asoee.cursorlessjetbrains.commands.CommandRequest
import com.intellij.notification.*
import com.intellij.openapi.components.service
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.diagnostic.logger
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

    companion object {
        val group = NotificationGroup("vc-idea", NotificationDisplayType.BALLOON, true)
    }

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
            return "NotFound"
        }
    }

    fun fromRequestUri(requestURI: URI): Optional<CommandRequest> {

        try {
            var decode = URLDecoder.decode(requestURI.toString().substring(1), "UTF-8");
            var split = decode.split("/");
            // XXX For debugging
            val notification = Notification(
                group.displayId, "Voicecode Plugin", decode,
                NotificationType.INFORMATION
            );

            Notifications.Bus.notify(notification);

            split = split[1].split(" ");
            val command: String = split.get(0)
            val args = split.subList(1, split.size)
            val commandRequest = CommandRequest(command, args)
            LOG.info("Command request: " + commandRequest)
            return Optional.of(commandRequest)
        } catch (e: UnsupportedEncodingException) {
            LOG.error("Failed to parse request URI", e);
            return Optional.empty();

        }
    }


    data class VoicePluginResponse(val responseCode: Int, val response: String) {

    }

}