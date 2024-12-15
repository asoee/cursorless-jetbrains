package com.github.asoee.cursorlessjetbrains

import com.github.asoee.cursorlessjetbrains.commands.CommandExecutorService
import com.github.asoee.cursorlessjetbrains.commands.CommandExecutorServiceTest.MainJavaFixture
import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessCommand
import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessRange
import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessTarget
import com.github.asoee.cursorlessjetbrains.cursorless.HatsFormat
import com.github.asoee.cursorlessjetbrains.services.TalonApplicationService
import com.intellij.openapi.components.service
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.fileEditor.TextEditor
import com.intellij.openapi.project.Project
import com.intellij.psi.PsiFile
import com.intellij.testFramework.EditorTestUtil
import com.intellij.testFramework.fixtures.BasePlatformTestCase
import com.intellij.testFramework.runInEdtAndWait
import junit.framework.TestCase
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking

class TestCursorlessActions : BasePlatformTestCase() {

    override fun getTestDataPath() = "src/test/testData/commands"

    override fun runInDispatchThread(): Boolean {
        return false
    }

    //    @Test
    fun testHatsAllocated() {
        val fixture = mainJavaFixture()
//        Thread.sleep(100)
        val editorHats = fixture.appService.editorManager.getEditorHats(fixture.editor)
        TestCase.assertNotNull(editorHats)
        assertNotEmpty(editorHats!!.values)

//      target the main method, expect a default hat over 'm'
        val targetRange = CursorlessRange.fromLogicalPositions(fixture.editor, 3, 23, 3, 27)
        println("target: $targetRange")
        val clTarget = findHatForRange(fixture.editor, editorHats, targetRange)
        TestCase.assertNotNull(clTarget)
        clTarget?.let {
            TestCase.assertEquals("default", clTarget.color)
            TestCase.assertEquals("default", clTarget.shape)
            TestCase.assertEquals("m", clTarget.letter)
        }
    }

    //    @Test
    fun testTakeSingle() {
        val fixture = mainJavaFixture()
//        Thread.sleep(50)
        val editorHats = fixture.appService.editorManager.getEditorHats(fixture.editor)
        TestCase.assertNotNull(editorHats)
        assertNotEmpty(editorHats!!.values)

//      target the main method, expect a default hat over 'm'
        val targetRange = CursorlessRange.fromLogicalPositions(fixture.editor, 3, 23, 3, 27)
        println("target: $targetRange")
        val clTarget = findHatForRange(fixture.editor, editorHats, targetRange)
        TestCase.assertNotNull(clTarget)
        if (clTarget != null) {
            val clCommand = "take " + clTarget.spokenForm()
            println("command: $clCommand")

            fixture.appService.cursorlessEngine.executeCommand(CursorlessCommand("take", clTarget))
            println("command executed")

            runBlocking {
                delay(50)
            }

            println("queue assert")
            runInEdtAndWait {
                println("Asserting in EDT...")
                TestCase.assertEquals("main", fixture.editor.selectionModel.selectedText)
                TestCase.assertEquals(
                    targetRange.startOffset(fixture.editor),
                    fixture.editor.selectionModel.selectionStart
                )
                TestCase.assertEquals(
                    targetRange.endOffset(fixture.editor),
                    fixture.editor.selectionModel.selectionEnd
                )
            }
        }
    }


    private fun findHatForRange(editor: Editor, editorHats: HatsFormat, target: CursorlessRange): CursorlessTarget? {
        editorHats.entries.forEach { entry ->
//            println("hat: ${entry.key}")
            entry.value.forEach { range ->
//                println("range: $range")
                if (target.contains(range)) {
                    val split = entry.key.split(" ")
                    var color = "default"
                    var shape = "default"
                    if (split.size >= 1) {
                        color = split[0]
                    }
                    if (split.size >= 2) {
                        shape = split[1]
                    }
                    val cursor = range.toLogicalRange(editor)
                    val letter = editor.document.getText(cursor.toTextRange(editor))

                    val result = CursorlessTarget(color, shape, letter)
                    println("found: $result")
                    return result
                }
            }
        }
        return null
    }


    private fun mainJavaFixture(): MainJavaFixture {
        val psiFile = myFixture.configureByFile("org/example/Main.java")
        val commandExecutorService = CommandExecutorService()
        val appService = service<TalonApplicationService>()
        val editor = getEditorFromPsiFile(psiFile)
        assertNotNull(editor)
        runInEdtAndWait {
            EditorTestUtil.setEditorVisibleSize(editor, 80, 20)
            appService.editorManager.reloadAllEditors()
        }

        return MainJavaFixture(psiFile, commandExecutorService, psiFile.project, editor!!, appService)
    }

    fun getEditorFromPsiFile(psiFile: PsiFile): Editor? {
        val project: Project = psiFile.project
        val virtualFile = psiFile.virtualFile
        val fileEditor = FileEditorManager.getInstance(project).getSelectedEditor(virtualFile)
        return (fileEditor as? TextEditor)?.editor
    }

}