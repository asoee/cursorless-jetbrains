package com.github.asoee.cursorlessjetbrains.services

import com.github.asoee.cursorlessjetbrains.MyBundle
import com.intellij.openapi.components.Service
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.project.Project

@Service(Service.Level.PROJECT)
class MyProjectService(
    private val project: Project,
)
  {

    init {
        thisLogger().info(MyBundle.message("projectService", project.name))
        thisLogger().warn("Don't forget to remove all non-needed sample code files with their corresponding registration entries in `plugin.xml`.")

//        val talonJs = javaClass.getResource("/cursorless/cursorless.js").readText()
//        thisLogger().warn("talon js script size: " + talonJs.length)
//        quickJs =  QuickJs.create(Dispatchers.Default)
//        runBlocking {
//            initCursorless(talonJs)
//        }
//        val talonJs = javaClass.getResource("/cursorless/talon.js").readText()
//        thisLogger().warn("talon js script size: " + talonJs.length)
//        quickJs =  QuickJs.create(Dispatchers.Default)
//        runBlocking {
//            quickJs.evaluate<Void>(code = talonJs, asModule = false)
//            quickJs.evaluate<Void>(code = "function calc(a,b) {return a*b;}")
//        }
    }


    fun getRandomNumber() = (1..100).random()
}
