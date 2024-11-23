package com.github.asoee.cursorlessjetbrains.quickjs

import com.github.asoee.cursorlessjetbrains.graaljs.GraalJSDriver
import com.github.asoee.cursorlessjetbrains.sync.Cursor
import com.github.asoee.cursorlessjetbrains.sync.EditorState
import kotlinx.coroutines.runBlocking
import org.junit.Test
import javax.script.ScriptEngineManager
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Source

class GraalJSDriverTest {

    @Test
    fun testCatch() {

        val context = Context.create()


        runBlocking {

            val js = """
            console.log("start");
            async function fetch() {
              console.log("fetch");
              throw Error("bad url");
            };
            
            async function main() {
                fetch().catch((e) => {
                    console.log("caught exception: " + e);
                }).then(() => {
                    console.log("then...");
                });
            }    
            main();    
            console.log("end");
        """.trimIndent()

            val source = Source.newBuilder("js", js, "src.js").build()
            val result = context.eval(source)

        }

    }


    @Test
    fun testDocumentChanged() {

        val context = Context.create()

        val driver = GraalJSDriver()

        runBlocking {
            driver.loadCursorless()

            val state = EditorState(
                "test",
                "/test/foo",
                "public static void main(String[] args) {\n\n}",
                true,
                null,
                0,
                4,
                listOf(Cursor(0, 0)),
                emptyList(),
                emptyList(),
                emptyList()
            )

            driver.editorChanged(state)

        }

    }

    @Test
    fun testSetTimeout() {

        val context = Context.create()

        val driver = GraalJSDriver()

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
            driver.evaluate(js)


        }

    }

}
