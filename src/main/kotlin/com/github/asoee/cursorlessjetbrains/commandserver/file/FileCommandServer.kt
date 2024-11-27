package com.github.asoee.cursorlessjetbrains.commandserver.file

import com.github.asoee.cursorlessjetbrains.javet.ExecutionResult
import com.github.asoee.cursorlessjetbrains.services.TalonApplicationService
import com.intellij.openapi.components.service
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.util.PlatformUtils
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import kotlin.io.path.*

class FileCommandServer {

    private val PREFIX = PlatformUtils.getPlatformPrefix()
    val LOG = thisLogger<FileCommandServer>()
    var watcher : FileWatcher? = null
    var commandServerDir : Path? = null


    public fun start() {
        println("Starting File Commandserver...")
        println("Platform prefix: $PREFIX")

        val suffix = getUserIdSuffix()

        val commandServerDir = Path(System.getProperty("java.io.tmpdir"))
            .resolve("$PREFIX-command-server$suffix")
        thisLogger().info("Command server dir: $commandServerDir")
        commandServerDir.toFile().mkdirs()
        this.commandServerDir = commandServerDir

        watcher = FileWatcher(commandServerDir, ::handleFileChanged)
    }


    fun getUserIdSuffix(): String {
        val selfPath = Paths.get(System.getProperty("user.home"))
        if (!selfPath.exists()) {
            return ""
        }
        val uid = Files.getAttribute(selfPath, "unix:uid")
        return "-$uid"
    }

    fun handleFileChanged(path: Path) {
        println("File changed: $path")
        if (path.name != "request.json") {
            println("Ignoring file: $path")
            return
        }
        val fullPath = commandServerDir?.resolve(path)
        readAndHandleFileRquest(fullPath)
    }

    private fun readAndHandleFileRquest(fullPath: Path?) {
        fullPath?.readText().let {
            println("File content: $it")
            val request = Json.decodeFromString<CommandServerRequest>(it!!)
            val result = handleRequest(request)
            if (result.success) {
                val response = CommandServerResponse(
                    request.uuid,
                    emptyArray(),
                    null,
                    TalonCommandReponse(result.returnValue),
                )
                writeResponse(response)
            } else {
                val response = CommandServerResponse(
                    request.uuid,
                    emptyArray(),
                    result.error,
                    TalonCommandReponse(null),
                )

                writeResponse(response)
            }
        }
    }

    fun writeResponse(response: CommandServerResponse) {
        val responsePath = commandServerDir?.resolve("response.json")
        val responseJson = Json.encodeToString(response)
        responsePath?.writeText(responseJson + "\n")
        println("'Wrote response'..." + responseJson)
    }

    fun handleRequest(request: CommandServerRequest): ExecutionResult {
        println("Handling request..." + request.commandId + " " + request.args + " " + request.uuid)
        val service = service<TalonApplicationService>()
        val executionResult = service.jsDriver.execute(request.args)
        return executionResult;
    }
}