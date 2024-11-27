package com.github.asoee.cursorlessjetbrains.commandserver.file

import java.nio.file.*

typealias FileChangeHandler = (Path) -> Unit

class FileWatcher(val path : Path, val handler: FileChangeHandler) {

    init {
        val watchService = FileSystems.getDefault().newWatchService()

        path.register(
            watchService,
            StandardWatchEventKinds.ENTRY_CREATE,
//            StandardWatchEventKinds.ENTRY_DELETE,
            StandardWatchEventKinds.ENTRY_MODIFY
        )

        var key: WatchKey
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
    }
}

