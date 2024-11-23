package com.github.asoee.cursorlessjetbrains.quickjs

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

}