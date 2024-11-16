package com.github.asoee.cursorlessjetbrains.listeners

import com.dokar.quickjs.QuickJs
import com.dokar.quickjs.binding.define
import com.github.asoee.cursorlessjetbrains.services.Console
import com.intellij.testFramework.fixtures.BasePlatformTestCase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking


class TalonAppLifecycleListenerTest : BasePlatformTestCase() {

    fun testAppStarted() {
        val sut = TalonAppLifecycleListener()

        sut.appStarted()

    }

    fun testPromiseCatch() {

        val quickJs =  QuickJs.create(Dispatchers.Default)
        runBlocking {
            execJs(quickJs)
        }
    }

    private suspend fun execJs(quickJs: QuickJs) {

        quickJs.define<Console>("console", Console())

//        val polyfill = """
//            console.error = value => std.err.puts(Print(value, {colours: true});
//            console.log = value => std.out.puts(Print(value, {colours: true});
//        """.trimIndent()
//
//        quickJs.evaluate<Any>(code = polyfill)

        val js = """
            async function ex() {
                console.log("start");
                await new Promise((resolve, reject) => {
                    reject("error");
                }).catch((e) => {
                    console.log(e);
                }).then(() => {
                    console.log("OK");
                })
                console.log("end");
            };
            
            try {
                ex().then(() => {
                  console.log("done");
                });
            } catch (e) {
                console.log("not done");
            }
        """.trimIndent()

        quickJs.evaluate<Any>(code = js)
    }


    fun testPromiseCatch2() {

        val quickJs =  QuickJs.create(Dispatchers.Default)
        runBlocking {
            execJs2(quickJs)
        }
    }

    private suspend fun execJs2(quickJs: QuickJs) {

        quickJs.define<Console>("console", Console())

        val js = """
            async function fetch() {
                throw Error("bad url");
            };
            
            fetch().catch((e) => {
                console.log(e);
            });
        """.trimIndent()

        quickJs.evaluate<Void>(code = js)
    }
}