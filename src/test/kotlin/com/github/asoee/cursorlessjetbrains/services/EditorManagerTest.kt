package com.github.asoee.cursorlessjetbrains.services

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import org.junit.Test

class EditorManagerTest {

    @Test
    fun editorChanged() {
    }

    @Test
    fun editorDebounce() {
        println("editorDebounce test")

        val scope = CoroutineScope(Dispatchers.Default)

        val flow = MutableSharedFlow<String>()

        val collectThread = Thread {
            println("Thread started")
            runBlocking {
                scope.launch(Dispatchers.Default) {
                    println("collect launched")
                    flow.collect {
                        println("collect: $it")
                    }
                }
            }
        }
        collectThread.start()
        Thread.sleep(100)
        runBlocking {
            scope.launch {
                println("tryEmit")
                flow.emit("test 1")
                flow.emit("test 2")
                flow.emit("test 3")
            }
//                .join()
        }
        Thread.sleep(1000)
    }
}