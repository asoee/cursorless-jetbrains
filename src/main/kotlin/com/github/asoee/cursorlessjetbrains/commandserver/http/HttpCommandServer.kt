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

class HttpCommandServer {

    private val DEFAULT_PORT: Int = 8652

    private val PLATFORM_TO_PORT: MutableMap<String, Int> = HashMap()
    private val LOG: Logger = logger<HttpCommandServer>()

    private var pathToNonce: Path? = null
    private var server: HttpServer? = null

    init {
        PLATFORM_TO_PORT[PlatformUtils.IDEA_PREFIX] = 8653;
        PLATFORM_TO_PORT[PlatformUtils.IDEA_CE_PREFIX] = 8654;
        PLATFORM_TO_PORT[PlatformUtils.APPCODE_PREFIX] = 8655;
        PLATFORM_TO_PORT[PlatformUtils.CLION_PREFIX] = 8657;
        PLATFORM_TO_PORT[PlatformUtils.PYCHARM_PREFIX] = 8658;
        PLATFORM_TO_PORT[PlatformUtils.PYCHARM_CE_PREFIX] = 8658;
        PLATFORM_TO_PORT[PlatformUtils.PYCHARM_EDU_PREFIX] = 8658;
        PLATFORM_TO_PORT[PlatformUtils.RUBY_PREFIX] = 8661;
        PLATFORM_TO_PORT[PlatformUtils.PHP_PREFIX] = 8662;
        PLATFORM_TO_PORT[PlatformUtils.WEB_PREFIX] = 8663;
        PLATFORM_TO_PORT[PlatformUtils.DBE_PREFIX] = 8664;
        PLATFORM_TO_PORT[PlatformUtils.RIDER_PREFIX] = 8660;
        PLATFORM_TO_PORT[PlatformUtils.GOIDE_PREFIX] = 8659;
    }

    fun start() {
        LOG.info("Starting Http Commandserver...")
        val random = SecureRandom()
        val bytes = ByteArray(20)
        random.nextBytes(bytes)
//        val nonce = String(Base64.getUrlEncoder().encode(bytes))
        val nonce = "localdev";
        val port: Int = PLATFORM_TO_PORT.getOrDefault(
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
            LOG.error("Failed to write nonce file", e)
        }

        val notification = Notification(
            "vc-idea",
            "Voicecode Plugin", "Listening on http://localhost:$port/$nonce",
            NotificationType.INFORMATION
        )
        Notifications.Bus.notify(notification)

        // https://stackoverflow.com/questions/3732109/simple-http-server-in-java-using-only-java-se-api#3732328
        val loopbackSocket = InetSocketAddress(InetAddress.getLoopbackAddress(), port)
        try {
            server = HttpServer.create(loopbackSocket, -1)
            server?.createContext("/$nonce", HttpCommandHandler())
            server?.setExecutor(null) // creates a default executor
            server?.start()
        } catch (e: IOException) {
            LOG.error("Failed to start server to listen for commands", e)
            return
        }
    }
}