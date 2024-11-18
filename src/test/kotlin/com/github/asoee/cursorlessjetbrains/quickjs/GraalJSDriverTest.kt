package com.github.asoee.cursorlessjetbrains.quickjs

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
            val result= context.eval( source)

        }

    }


}