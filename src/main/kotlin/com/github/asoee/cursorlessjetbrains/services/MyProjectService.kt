package com.github.asoee.cursorlessjetbrains.services

import com.dokar.quickjs.QuickJs
import com.dokar.quickjs.binding.define
import com.intellij.openapi.components.Service
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.project.Project
import com.github.asoee.cursorlessjetbrains.MyBundle
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking

@Service(Service.Level.PROJECT)
class MyProjectService(
    private val project: Project,
)
  {

    private val quickJs: QuickJs

    init {
        thisLogger().info(MyBundle.message("projectService", project.name))
        thisLogger().warn("Don't forget to remove all non-needed sample code files with their corresponding registration entries in `plugin.xml`.")

        val talonJs = javaClass.getResource("/cursorless/cursorless.js").readText()
        thisLogger().warn("talon js script size: " + talonJs.length)
        quickJs =  QuickJs.create(Dispatchers.Default)
        runBlocking {
            initCursorless(talonJs)
        }
//        val talonJs = javaClass.getResource("/cursorless/talon.js").readText()
//        thisLogger().warn("talon js script size: " + talonJs.length)
//        quickJs =  QuickJs.create(Dispatchers.Default)
//        runBlocking {
//            quickJs.evaluate<Void>(code = talonJs, asModule = false)
//            quickJs.evaluate<Void>(code = "function calc(a,b) {return a*b;}")
//        }
    }

    private suspend fun initCursorless(talonJs: String) {
        thisLogger().warn("compile...")

        val nodeShimBc = quickJs.compile(talonJs, "node-shim.js", true)
        thisLogger().warn("addmodule (node-shim)...")
        quickJs.addModule(bytecode = nodeShimBc)

        val cursorlessBc = quickJs.compile(talonJs, "cursorless.js", true)
        thisLogger().warn("addmodule (cursorless)...")
        quickJs.addModule(bytecode = cursorlessBc)

        quickJs.define<Console>("console", Console())

        thisLogger().warn("eval 1...")
        //            quickJs.evaluate<Void>(code = talonJs, asModule = true, )
        thisLogger().warn("eval 2...")
        //            quickJs.evaluate<Void>(code = "function calc(a,b) {return a*b;}")
        thisLogger().warn("process")
        //            quickJs.evaluate<Void>(code = "var process = { env: { NODE_ENV:  \"dev\" } };", asModule = true)
        thisLogger().warn("log")
        //            quickJs.evaluate<Void>(code = "console.log('fooo');")
        //            thisLogger().warn("log process")
        //            quickJs.evaluate<Void>(code = "console.log(process);")
        thisLogger().warn("import entry")
        quickJs.evaluate<Void>(code = "const { entry } = await import('./cursorless.js');")
        thisLogger().warn("exec entry")
        quickJs.evaluate<Any>(code = "entry();")
        thisLogger().warn("done")
    }

    fun getRandomNumber() = (1..100).random()
}
