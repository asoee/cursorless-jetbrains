package com.github.asoee.cursorlessjetbrains.listeners

import com.intellij.testFramework.fixtures.BasePlatformTestCase


class TalonAppLifecycleListenerTest : BasePlatformTestCase() {

    fun testAppStarted() {
        val sut = TalonAppLifecycleListener()

        sut.appStarted()

    }


}