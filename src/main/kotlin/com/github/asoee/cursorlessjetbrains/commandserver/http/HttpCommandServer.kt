package com.github.asoee.cursorlessjetbrains.commandserver.http

import com.intellij.notification.Notification
import com.intellij.notification.NotificationType
import com.intellij.notification.Notifications
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.diagnostic.logger
import com.intellij.util.PlatformUtils
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
        platformToPort[PlatformUtils.IDEA_PREFIX] = 8653
        platformToPort[PlatformUtils.IDEA_CE_PREFIX] = 8654
        platformToPort[PlatformUtils.APPCODE_PREFIX] = 8655
        platformToPort[PlatformUtils.CLION_PREFIX] = 8657
        platformToPort[PlatformUtils.PYCHARM_PREFIX] = 8658
        platformToPort[PlatformUtils.PYCHARM_CE_PREFIX] = 8658
        platformToPort[PlatformUtils.PYCHARM_EDU_PREFIX] = 8658
        platformToPort[PlatformUtils.RUBY_PREFIX] = 8661
        platformToPort[PlatformUtils.PHP_PREFIX] = 8662
        platformToPort[PlatformUtils.WEB_PREFIX] = 8663
        platformToPort[PlatformUtils.DBE_PREFIX] = 8664
        platformToPort[PlatformUtils.RIDER_PREFIX] = 8660
        platformToPort[PlatformUtils.GOIDE_PREFIX] = 8659
    }

    fun start() {
        logger.info("Starting Http Commandserver...")
        val random = SecureRandom()
        val bytes = ByteArray(20)
        random.nextBytes(bytes)
        val nonce = String(Base64.getUrlEncoder().encode(bytes))
        val portOverride = System.getProperty("talon.http.port")?.toIntOrNull()
        val port: Int = portOverride ?: platformToPort.getOrDefault(
            PlatformUtils.getPlatformPrefix(),
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