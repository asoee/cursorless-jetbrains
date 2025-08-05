package com.github.asoee.cursorlessjetbrains.javet

import com.caoccao.javet.interop.V8Host
import com.caoccao.javet.interop.V8Runtime
import com.caoccao.javet.javenode.JNEventLoop
import com.caoccao.javet.javenode.enums.JNModuleType
import com.github.asoee.cursorlessjetbrains.cursorless.*
import com.github.asoee.cursorlessjetbrains.sync.Cursor
import com.github.asoee.cursorlessjetbrains.sync.EditorState
import com.github.asoee.cursorlessjetbrains.sync.HatRange
import com.github.asoee.cursorlessjetbrains.sync.Selection
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.lessThanOrEqualTo
import org.junit.Test

class JavetDriverTest {

    @Test
    fun testLoadCursorless() {
        val driver = JavetDriver()
        driver.loadCursorless()
        driver.close()
    }

    @Test
    fun testDocumentChanged() {

        val driver = JavetDriver()
        driver.loadCursorless()
        driver.setCursorlessCallback(CountingCallback())

        val cursorPos = Cursor(1, 1)
        val state = EditorState(
            id = "test",
            path = "/test/foo",
            text = """
                package com.github.asoee.cursorlessjetbrains.javet
                
                public static void main(String[] args) {
                    System.out.println("Hello, world!");
                }""".trimMargin(),
            active = true,
            languageId = "plaintext",
            firstVisibleLine = 0,
            lastVisibleLine = 4,
            cursors = listOf(cursorPos),
            selections = listOf(
                Selection(
                    start = cursorPos,
                    end = cursorPos,
                    cursorPosition = cursorPos,
                    active = cursorPos,
                    anchor = cursorPos
                )
            ),
            visible = true,
            editable = true,
            writable = true,
        )

        driver.editorChanged(state)

        driver.dumpMemoryInfo()
        for (i in 0..200) {
            driver.editorChanged(state)
        }
        driver.gc()
        driver.dumpMemoryInfo()
        assertThat(driver.runtime.referenceCount, lessThanOrEqualTo(3))
        driver.close()
    }


    @Test
    fun testSetTimeout() {

        val driver = JavetDriver()
        driver.loadCursorless()

        val runtime = driver.runtime
        val eventLoop = JNEventLoop(runtime)

//            driver.loadCursorless()
        val js = """
              | async function main( ms ) {
              |   const noop = ( ) => { console.log( 'noop' ); };
              |   const sleep = new Promise( function( noop ) { setTimeout( noop, ms ); } );
              |   console.log( 'Sleeping for 1 ms...' );
              |   await sleep.then( );
              |   console.log( 'Done sleeping' );
              |   console.log( 'Hello, world!' );
              | }
              | main( 1 );
            """.trimMargin()

        val js1 = """
              |   const noop = ( ) => { console.log( 'noop' ); };
            """.trimMargin()

        val js2 = """
              | (async () => {
              |   setTimeout( noop, 1 );
              |   console.log( 'Sleeping for 1000 ms...' );
              | })()
            """.trimMargin()
        runtime.getExecutor(js1).executeVoid()

        driver.dumpMemoryInfo()
        runtime.getExecutor(js2).executeVoid()
        eventLoop.await()
        driver.dumpMemoryInfo()
        runtime.getExecutor(js2).executeVoid()
        eventLoop.await()
        driver.dumpMemoryInfo()
        runtime.getExecutor(js2).executeVoid()
        eventLoop.await()
        driver.dumpMemoryInfo()

        driver.close()
    }

    @Test
    fun testSetTimeout2() {

        val runtime: V8Runtime = V8Host.getNodeI18nInstance().createV8Runtime()
        val eventLoop = JNEventLoop(runtime)

        eventLoop.loadStaticModules(JNModuleType.Console, JNModuleType.Timers)
//        eventLoop.loadStaticModules(JNModuleType.Console)

        val js1 = """
              |   const noop = ( ) => { console.log( 'noop' ); };
            """.trimMargin()

        val js2 = """
              | (async () => {
              |   setTimeout( noop, 1 );
              |   console.log( 'Sleeping for 1 ms...' );
              | })()
            """.trimMargin()
        runtime.getExecutor(js1).executeVoid()

        for (i in 0..10) {
            runtime.getExecutor(js2).executeVoid()
            eventLoop.await()
        }
        println("ref count: " + runtime.referenceCount)
        System.gc()
        runtime.lowMemoryNotification()
        System.gc()
        runtime.lowMemoryNotification()
        println("ref count: " + runtime.referenceCount)

        runtime.close()
    }
}

class CountingCallback : CursorlessCallback {

    override fun onHatUpdate(hatRanges: Array<HatRange>) {
//        println("Not yet implemented")
    }

    override fun setSelection(editorId: String, selections: Array<CursorlessRange>) {
//        println("Not yet implemented")
    }

    override fun documentUpdated(editorId: String, edit: CursorlessEditorEdit) {
//        println("Not yet implemented")
    }

    override fun clipboardCopy(editorId: String, selections: Array<CursorlessRange>) {
//        println("Not yet implemented")
    }

    override fun clipboardPaste(editorId: String) {
//        println("Not yet implemented")
    }

    override fun executeCommand(editorId: String, command: String, args: Array<String>) {
        println("Not yet implemented")
    }

    override fun insertLineAfter(editorId: String, ranges: Array<CursorlessRange>) {
        println("Not yet implemented")
    }

    override fun insertSnippet(editorId: String, snippet: String) {
//        println("Not yet implemented")
    }

    override fun executeRangeCommand(editorId: String, rangeCommand: CursorlessEditorCommand) {
        println("Not yet implemented")
    }

    override fun revealLine(editorId: String, line: Int, revealAt: String) {
        println("Not yet implemented")
    }

    override fun flashRanges(flashRanges: Array<CursorlessFlashRange>) {
    }

    override fun setHighlightRanges(
        highlightId: String?,
        editorId: String,
        ranges: Array<CursorlessGeneralizedRange>
    ) {
        println("Not yet implemented")
    }

    override fun prePhraseVersion(): String? {
//        println("Not yet implemented")
        return "asdf" + System.currentTimeMillis()
    }
}