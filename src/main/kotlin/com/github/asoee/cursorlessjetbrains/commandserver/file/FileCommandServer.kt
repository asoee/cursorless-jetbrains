package com.github.asoee.cursorlessjetbrains.commandserver.file

import com.github.asoee.cursorlessjetbrains.javet.ExecutionResult
import com.github.asoee.cursorlessjetbrains.services.TalonProjectService
import com.intellij.openapi.components.service
import com.intellij.openapi.diagnostic.logger
import com.intellij.openapi.project.Project
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.BufferedReader
import java.io.IOException
import java.io.InputStreamReader
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import kotlin.io.path.Path
import kotlin.io.path.exists
import kotlin.io.path.readText
import kotlin.io.path.writeText


class FileCommandServer {

    companion object {
        private const val PREFIX = "jetbrains"
        val logger = logger<FileCommandServer>()
    }

    private val commandServerDir: Path
    private val signalsDir: Path

    init {
        logger.info("FileCommandServer: FilePlatform prefix: $PREFIX")

        val suffix = getUserIdSuffix()

        val commandServerDir = Path(System.getProperty("java.io.tmpdir"))
            .resolve("${PREFIX}-command-server$suffix")
        logger.info("FileCommandServer: dir: $commandServerDir")
        commandServerDir.toFile().mkdirs()
        this.commandServerDir = commandServerDir
        this.signalsDir = commandServerDir.resolve("signals")
        this.signalsDir.toFile().mkdirs()
    }

    private fun getUserIdSuffix(): String {
        val selfPath = Paths.get(System.getProperty("user.home"))
        if (!selfPath.exists()) {
            return ""
        }
        try {
            val uid = Files.getAttribute(selfPath, "unix:uid")
            return "-$uid"
        } catch (e: UnsupportedOperationException) {
            logger.warn("Error getting home uid attribute (not supported on this platform) " + e.message)
        }
        try {
            val userName = System.getProperty("user.name")
            val command = "id -u $userName"
            readProcessOutput(command).let {
                try {
                    Integer.parseInt(it)
                    return "-$it"
                } catch (e: NumberFormatException) {
                    logger.warn("Error parsing uid from id command output $it")
                }

            }
        } catch (e: IOException) {
            logger.warn("Error getting uid from id command " + e.message)
        }
        logger.warn("Fallback to no uid suffix")
        return ""
    }

    private fun readProcessOutput(command: String): String {
        val process = Runtime.getRuntime().exec(command)
        val output = StringBuilder()

        BufferedReader(InputStreamReader(process.inputStream)).use { reader ->
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                output.append(line).append("\n")
            }
        }
        process.waitFor()
        return output.toString()
    }

    fun checkAndHandleFileRquest(project: Project) {
        val requestPath = commandServerDir.resolve("request.json")
        if (requestPath.exists()) {
            readAndHandleFileRquest(requestPath, project)
        }
    }

    fun prePhraseVersion(): String? {
        val prePhrasePath = this.signalsDir.resolve("prePhrase")
        if (prePhrasePath.exists()) {
            val prePhraseVersion = prePhrasePath.toFile().lastModified().toString()
            return prePhraseVersion
        } else {
            return null
        }
    }

    private fun readAndHandleFileRquest(fullPath: Path?, project: Project) {
        fullPath?.readText().let {
            logger.debug("File content: $it")
            val request = Json.decodeFromString<CommandServerRequest>(it!!)
            val result = handleRequest(request, project)
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

    private fun writeResponse(response: CommandServerResponse) {
        val responsePath = commandServerDir.resolve("response.json")
        val responseJson = Json.encodeToString(response)
        responsePath.writeText(responseJson + "\n")
        logger.info("'Wrote response'...$responseJson")
    }

    private fun handleRequest(request: CommandServerRequest, project: Project): ExecutionResult {
        logger.info("Handling request..." + request.commandId + " " + request.args + " " + request.uuid)
        val service = project.service<TalonProjectService>()
        val executionResult = service.jsDriver.execute(request.args)
        return executionResult
    }

}