package com.github.asoee.cursorlessjetbrains.commandserver.http

import com.intellij.notification.Notification
import com.intellij.notification.NotificationType
import com.intellij.notification.Notifications
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.diagnostic.logger
import com.sun.net.httpserver.HttpServer
import java.io.IOException
import java.net.InetAddress
import java.net.InetSocketAddress
import java.nio.file.FileSystems
import java.nio.file.Files
import java.nio.file.Path
import java.security.SecureRandom
import java.util.*

private const val DEFAULT_PORT: Int = 8652

class HttpCommandServer {

    private val platformToPort: MutableMap<String, Int> = HashMap()
    private val logger: Logger = logger<HttpCommandServer>()

    private var pathToNonce: Path? = null
    private var server: HttpServer? = null

    init {
        // Port mappings for different JetBrains IDEs using actual platform prefixes
        platformToPort["idea"] = 8653              // IntelliJ IDEA Ultimate
        platformToPort["Idea"] = 8654              // IntelliJ IDEA Community
        platformToPort["IdeaEdu"] = 8656            // IntelliJ IDEA Educational
        platformToPort["AppCode"] = 8655            // AppCode
        platformToPort["Aqua"] = 8665               // Aqua
        platformToPort["CLion"] = 8657              // CLion
        platformToPort["Python"] = 8658            // PyCharm Professional
        platformToPort["PyCharmCore"] = 8658        // PyCharm Community
        platformToPort["DataSpell"] = 8666          // DataSpell
        platformToPort["PyCharmEdu"] = 8658         // PyCharm Educational
        platformToPort["Ruby"] = 8661              // RubyMine
        platformToPort["PhpStorm"] = 8662           // PhpStorm
        platformToPort["WebStorm"] = 8663           // WebStorm
        platformToPort["DataGrip"] = 8664           // DataGrip
        platformToPort["Rider"] = 8660              // Rider
        platformToPort["GoLand"] = 8659             // GoLand
        platformToPort["FleetBackend"] = 8667       // Fleet Backend
        platformToPort["RustRover"] = 8668          // RustRover
        platformToPort["Writerside"] = 8669         // Writerside
        platformToPort["GitClient"] = 8670          // Git Client
        platformToPort["MPS"] = 8671                // MPS (Meta Programming System)
    }

    fun start() {
        logger.info("Starting Http Commandserver...")
        val random = SecureRandom()
        val bytes = ByteArray(20)
        random.nextBytes(bytes)
        val nonce = String(Base64.getUrlEncoder().encode(bytes))
        val portOverride = System.getProperty("talon.http.port")?.toIntOrNull()
        val platformPrefix = System.getProperty("idea.platform.prefix", "idea")
        val port: Int = portOverride ?: platformToPort.getOrDefault(
            platformPrefix,
            DEFAULT_PORT
        )
        try {
            pathToNonce = FileSystems.getDefault().getPath(
                System.getProperty("java.io.tmpdir"),
                "vcidea_$port"
            )
            Files.write(pathToNonce, nonce.toByteArray())
        } catch (e: IOException) {
            logger.error("Failed to write nonce file", e)
        }
        logger.info("Http command server listening on http://localhost:$port/$nonce")
        val notification = Notification(
            "vc-idea",
            "Voicecode plugin", "Listening on http://localhost:$port/$nonce",
            NotificationType.INFORMATION
        )
        Notifications.Bus.notify(notification)

        // https://stackoverflow.com/questions/3732109/simple-http-server-in-java-using-only-java-se-api#3732328
        val loopbackSocket = InetSocketAddress(InetAddress.getLoopbackAddress(), port)
        try {
            server = HttpServer.create(loopbackSocket, -1)
            server?.createContext("/$nonce", HttpCommandHandler())
            server?.executor = null // creates a default executor
            server?.start()
        } catch (e: IOException) {
            logger.error("Failed to start server to listen for commands", e)
            return
        }
    }

    fun stop() {
        server?.stop(0)
    }

}