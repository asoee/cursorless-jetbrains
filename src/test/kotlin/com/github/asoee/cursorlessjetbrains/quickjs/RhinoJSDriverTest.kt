package com.github.asoee.cursorlessjetbrains.quickjs

import kotlinx.coroutines.runBlocking
import org.junit.Test
import org.mozilla.javascript.Context

class RhinoJSDriverTest {

    @Test
    fun testCatch() {
        val cx: Context = Context.enter()
        cx.languageVersion = Context.VERSION_1_8
        val scope = cx.initStandardObjects()

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

            val result= cx.evaluateString(scope, js, "catch.js", 1, null)

        }

    }


}