package com.github.asoee.cursorlessjetbrains.quickjs

import app.cash.zipline.EngineApi
import app.cash.zipline.Zipline
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import org.junit.Test

class QuickJSDriverTest {

    @Test
    fun testCatch() {
        val driver = QuickJSDriver()


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

            val result= driver.evaluate(js)
        }

    }

    @OptIn(EngineApi::class)
    @Test
    fun testZipline() {
         val zipline = Zipline.create(dispatcher = Dispatchers.Default)

        runBlocking {

            val js = """
            console.log("start")
            async function fetch() {
              console.log("fetch")
              throw Error("bad url");
            };
            
            await fetch().catch((e) => {
                console.log("caught exception: " + e);
            });
            console.log("end")
        """.trimIndent()

            val result= zipline.quickJs.evaluate(js)
        }

    }

}