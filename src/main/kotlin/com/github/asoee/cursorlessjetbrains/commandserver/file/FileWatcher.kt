package com.github.asoee.cursorlessjetbrains.commandserver.file

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.nio.file.*

typealias FileChangeHandler = (Path) -> Unit

class FileWatcher(val path: Path, val handler: FileChangeHandler) {

    private val watchService: WatchService

    init {
        watchService = FileSystems.getDefault().newWatchService()

        path.register(
            watchService,
            StandardWatchEventKinds.ENTRY_CREATE,
//            StandardWatchEventKinds.ENTRY_DELETE,
            StandardWatchEventKinds.ENTRY_MODIFY
        )

        val scope = CoroutineScope(Dispatchers.IO)

        scope.launch {
            var key: WatchKey
            try {
                while ((watchService.take().also { key = it }) != null) {
                    for (event in key.pollEvents()) {
                        val context = event.context()
                        println(
                            ("Event kind:" + event.kind()
                                    + ". File affected: " + context + ".")
                        )
                        if (context is Path) {
                            handler(context)
                        }
                    }
                    key.reset()
                }
            } catch (e: ClosedWatchServiceException) {
                println("Watcher closed")
            }
        }

    }

    fun dispose() {
        watchService.close()
    }
}

