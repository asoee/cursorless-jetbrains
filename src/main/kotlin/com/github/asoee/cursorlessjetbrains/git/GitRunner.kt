package com.github.asoee.cursorlessjetbrains.git

import com.intellij.openapi.progress.ProgressManager
import java.io.File
import java.util.concurrent.CompletableFuture
import java.util.concurrent.TimeUnit

/**
 * Runs git (from the PATH) in a file's repository, for the git actions, which call it under a cancellable progress
 * so the IDE doesn't freeze. A plain process, so the plugin doesn't need the Git plugin.
 */
class GitRunner private constructor(val root: File) {

    class GitException(message: String) : RuntimeException(message)

    data class Result(val exitCode: Int, val stdout: ByteArray, val stderr: String) {
        val text: String get() = String(stdout, Charsets.UTF_8)
    }

    companion object {
        /** The repository containing [file], or a GitException if there's none */
        fun forFile(file: File): GitRunner {
            val result = run(file.parentFile, listOf("rev-parse", "--show-toplevel"))
            if (result.exitCode != 0) {
                throw GitException("${file.name} isn't in a git repository")
            }
            return GitRunner(File(result.text.trim()))
        }

        private fun run(directory: File, args: List<String>, stdin: ByteArray? = null): Result {
            val process = try {
                ProcessBuilder(listOf("git") + args).directory(directory).start()
            } catch (e: java.io.IOException) {
                throw GitException("Couldn't run git: ${e.message}")
            }
            // Drain both pipes while git runs, so neither fills and blocks it, and so the timeout can fire
            val stdout = CompletableFuture.supplyAsync { process.inputStream.readBytes() }
            val stderr = CompletableFuture.supplyAsync { process.errorStream.bufferedReader().readText() }
            try {
                process.outputStream.use { input -> stdin?.let { input.write(it) } }
                val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(30)
                while (!process.waitFor(100, TimeUnit.MILLISECONDS)) {
                    // Cancelling the action's progress stops git too
                    ProgressManager.checkCanceled()
                    if (System.nanoTime() > deadline) {
                        throw GitException("git ${args.firstOrNull()} timed out")
                    }
                }
            } catch (e: Throwable) {
                process.destroyForcibly()
                throw e
            }
            return Result(process.exitValue(), stdout.join(), stderr.join().trim())
        }
    }

    /** [file]'s path relative to the repository, with forward slashes, as git expects */
    fun pathOf(file: File): String =
        root.canonicalFile.toPath().relativize(file.canonicalFile.toPath()).toString().replace('\\', '/')

    fun run(vararg args: String, stdin: ByteArray? = null): Result = run(root, args.toList(), stdin)

    /** Runs git, throwing its error message if it fails */
    fun check(vararg args: String, stdin: ByteArray? = null): Result {
        val result = run(*args, stdin = stdin)
        if (result.exitCode != 0) {
            throw GitException(result.stderr.ifEmpty { "git ${args.first()} failed" })
        }
        return result
    }

    /** The blob at [spec] (e.g. ":path" for the index, "HEAD:path"), or null if there is none */
    fun blob(spec: String): ByteArray? {
        val result = run("cat-file", "blob", spec)
        return if (result.exitCode == 0) result.stdout else null
    }

    /** Puts [content] in the index for [path], keeping its file mode */
    fun writeIndex(path: String, content: ByteArray) {
        val sha = check("hash-object", "-w", "--no-filters", "--stdin", stdin = content).text.trim()
        val mode = check("ls-files", "-s", "--", path).text.trim().substringBefore(' ').ifEmpty { "100644" }
        check("update-index", "--add", "--cacheinfo", "$mode,$sha,$path")
    }
}
