package com.github.asoee.cursorlessjetbrains.graaljs

import kotlinx.coroutines.runBlocking
import org.graalvm.polyglot.Context
import org.graalvm.polyglot.Source
import org.junit.Assert.*
import org.junit.Test

class GraalJSDriverTest {


    @Test
    fun testInit() {
        val driver = GraalJSDriver()
    }

    @Test
    fun testCreateEngine() {
        val driver = GraalJSDriver()
        runBlocking {
            driver.loadCursorless()
//            driver.evaluate(
//                """
//                |const {activate, createPlugin} = await import('./cursorless.js');
//                |
//                | """.trimMargin()
//            )
        }
    }
}

