package com.github.asoee.cursorlessjetbrains.cursorless

import kotlinx.serialization.json.Json
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardOpenOption
import kotlin.io.path.extension
import kotlin.io.path.isRegularFile
import kotlin.io.path.listDirectoryEntries
import kotlin.io.path.name
import kotlin.io.path.readLines

/**
 * The engine's command history (for "cursorless stats"): one JSON line per command in monthly .jsonl files, in the
 * same ~/.cursorless/commandHistory directory the VS Code extension uses
 */
class CommandHistoryFiles(private val dir: Path = defaultDir()) {

    companion object {
        fun defaultDir(): Path = Paths.get(System.getProperty("user.home"), ".cursorless", "commandHistory")
    }

    fun append(fileName: String, entryJson: String) {
        // The engine names files from the date; refuse anything that would escape the directory
        require(Paths.get(fileName).name == fileName) { "Bad command history file name: $fileName" }
        Files.createDirectories(dir)
        Files.writeString(
            dir.resolve(fileName),
            entryJson + "\n",
            StandardOpenOption.CREATE,
            StandardOpenOption.APPEND,
        )
    }

    /** Every entry as a JSON array, oldest file first; unreadable lines are skipped */
    fun entriesJson(): String {
        if (!Files.isDirectory(dir)) {
            return "[]"
        }
        val lines = dir.listDirectoryEntries()
            .filter { it.isRegularFile() && it.extension == "jsonl" }
            .sortedBy { it.name }
            .flatMap { it.readLines() }
            .filter { it.isNotBlank() && runCatching { Json.parseToJsonElement(it) }.isSuccess }
        return lines.joinToString(",", "[", "]")
    }
}
