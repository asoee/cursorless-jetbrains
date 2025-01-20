package com.github.asoee.cursorlessjetbrains.javet

import com.caoccao.javet.javenode.JNEventLoop
import com.caoccao.javet.javenode.enums.JNModuleType
import com.github.asoee.cursorlessjetbrains.sync.Cursor
import com.github.asoee.cursorlessjetbrains.sync.EditorState
import com.github.asoee.cursorlessjetbrains.sync.Selection
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertNotNull
import org.junit.Test

class JavetDriverTest {

    @Test
    fun testLoadCursorless() {
        val driver = JavetDriver()
        driver.loadCursorless()
    }

    @Test
    fun testInit() {
        val driver = JavetDriver()
        assertNotNull(driver)

        val runtime = driver.runtime
        val eventLoop = JNEventLoop(runtime)
        eventLoop.loadStaticModules(JNModuleType.Console, JNModuleType.Timers)
        runtime.getExecutor(
            "const a = [];\n" +
                    "setTimeout(() => a.push('Hello Javenode'), 10);"
        ).executeVoid()
        eventLoop.await()
        runtime.getExecutor("console.log(a[0]);").executeVoid()

        val cursorlessJs = javaClass.getResource("/cursorless/cursorless.js").readText()

        val module = runtime.getExecutor(cursorlessJs)
            .setResourceName("./cursorless.js")
            .compileV8Module()
        module.executeVoid()

        if (runtime.containsV8Module("./module.js")) {
            println("./module.js is registered as a module.")
        }

        runtime.getExecutor("import { activate } from './cursorless.js'; globalThis.activate = activate; console.log(activate)")
            .setModule(true).setResourceName("./import.js").executeVoid()
        eventLoop.await()
        // Step 5: Call test() in global context.
        println("activate() -> " + runtime.getExecutor("activate(null)").executeVoid())
    }


    @Test
    fun testDocumentChanged() {

        val driver = JavetDriver()
        driver.loadCursorless()

        val cursorPos = Cursor(0, 0)
        val state = EditorState(
            id = "test",
            path = "/test/foo",
            text = "public static void main(String[] args) {\n\n}",
            active = true,
            languageId = "java",
            firstVisibleLine = 0,
            lastVisibleLine = 4,
            cursors = listOf(cursorPos),
            selections = listOf(
                Selection(
                    start = cursorPos,
                    end = cursorPos,
                    cursorPosition = cursorPos,
                    active = null,
                    anchor = null
                )
            ),
            visible = true,
            editable = true,
        )

        driver.editorChanged(state)

    }


    @Test
    fun testSetTimeout() {

        val driver = JavetDriver()

        runBlocking {
//            driver.loadTimeout()

            driver.loadCursorless()
            val js = """
              | async function main( ms ) {
              |   const noop = ( ) => { };
              |   const sleep = new Promise( function( resolve ) { setTimeout( resolve, ms ); } );
              |   console.log( 'Sleeping for 5 seconds...' );
              |   await sleep.then( );
              |   console.log( 'Done sleeping' );
              |   console.log( 'Hello, world!' );
              | }
              | main( 5000 );
            """.trimMargin()
//            driver.evaluate(js)


        }

    }
}
