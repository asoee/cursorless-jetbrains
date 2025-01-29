package com.github.asoee.cursorlessjetbrains

import com.github.asoee.cursorlessjetbrains.commands.CommandExecutorService
import com.github.asoee.cursorlessjetbrains.commands.CommandExecutorServiceTest.MainJavaFixture
import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessCommand
import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessRange
import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessTarget
import com.github.asoee.cursorlessjetbrains.cursorless.HatsFormat
import com.github.asoee.cursorlessjetbrains.services.TalonApplicationService
import com.intellij.openapi.application.WriteAction
import com.intellij.openapi.components.service
import com.intellij.openapi.editor.CaretState
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.LogicalPosition
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.fileEditor.TextEditor
import com.intellij.openapi.project.Project
import com.intellij.openapi.util.TextRange
import com.intellij.openapi.wm.IdeFocusManager
import com.intellij.psi.PsiFile
import com.intellij.testFramework.EditorTestUtil
import com.intellij.testFramework.fixtures.BasePlatformTestCase
import com.intellij.testFramework.runInEdtAndWait
import junit.framework.TestCase
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.jsonPrimitive
import org.awaitility.kotlin.await
import org.junit.BeforeClass
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import java.util.concurrent.TimeUnit


@RunWith(JUnit4::class)
class TestCursorlessActions : BasePlatformTestCase() {

    override fun getTestDataPath() = "src/test/testData/commands"

    override fun runInDispatchThread(): Boolean {
        return false
    }

    @Test
    fun testHatsAllocated() {
        val fixture = mainJavaFixture()
        val editorHats: HatsFormat = awaitHats(fixture, fixture.editor)
        assertNotNull(editorHats)
        assertNotEmpty(editorHats.values)

//      target the main method, expect a default hat over 'm'
        val targetRange = CursorlessRange.fromLogicalPositions(fixture.editor, 3, 23, 3, 27)
        println("target: $targetRange")
        val clTarget = findHatForRange(fixture.editor, editorHats, targetRange)
        assertNotNull(clTarget)
        clTarget?.let {
            assertEquals("default", clTarget.color)
            assertEquals("default", clTarget.shape)
            assertEquals("m", clTarget.letter)
        }
    }

    @Test
    fun testTakeSingle() {
        val fixture = mainJavaFixture()
//      target the main method, expect a default hat over 'm'
        val targetRange = CursorlessRange.fromLogicalPositions(fixture.editor, 3, 23, 3, 27)
        println("target: $targetRange")
        val editorHats: HatsFormat = awaitHats(fixture, fixture.editor)
        val clTarget = findHatForRange(fixture.editor, editorHats, targetRange)
        assertNotNull(clTarget)
        if (clTarget != null) {
            val clCommand = "take " + clTarget.spokenForm()
            println("command: $clCommand")
            val refCountBefore = fixture.appService.jsDriver.runtime.referenceCount

            val res = fixture.appService.cursorlessEngine.executeCommand(CursorlessCommand.takeSingle(clTarget))
            println("command executed")
            assertNull(res.error)
            assertNull(res.returnValue)

            val refCountAfter = fixture.appService.jsDriver.runtime.referenceCount
            TestCase.assertEquals(refCountBefore, refCountAfter)

            runBlocking {
                delay(50)
            }

            println("queue assert")
            runInEdtAndWait {
                println("Asserting in EDT...")
                assertEquals("main", fixture.editor.selectionModel.selectedText)
                assertEquals(
                    targetRange.startOffset(fixture.editor),
                    fixture.editor.selectionModel.selectionStart
                )
                assertEquals(
                    targetRange.endOffset(fixture.editor),
                    fixture.editor.selectionModel.selectionEnd
                )
            }
        }
    }

    @Test
    fun testBringToEndOfLine() {
        val fixture = mainJavaFixture()
//      target the main method, expect a default hat over 'm'
        val targetRange = CursorlessRange.fromLogicalPositions(fixture.editor, 3, 23, 3, 27)
        println("target: $targetRange")
        val editorHats: HatsFormat = awaitHats(fixture, fixture.editor)
        val clTarget = findHatForRange(fixture.editor, editorHats, targetRange)
        assertNotNull(clTarget)
        if (clTarget != null) {
            //place cursor after the curly in the for loop
            moveCursorTo(fixture.editor, 7, 9)

            runBlocking {
                // wait for editor state to update with new cursor position
                delay(100)
            }

            val commandV7 = CursorlessCommand.bringImplicit(clTarget)
            println("clTarget: $clTarget")

            fixture.appService.cursorlessEngine.executeCommand(commandV7)

            runBlocking {
                delay(100)
            }

            runInEdtAndWait {
                val expected = "        }main"
                assertEquals(expected, getTextFromLine(fixture.editor, 7))
                val caretPos = fixture.editor.caretModel.currentCaret.logicalPosition
                val expectedPos = LogicalPosition(7, 13)
                assertEquals(expectedPos, caretPos)
            }
        }
    }

    @Test
    fun testChangeEveryInstance() {
        val fixture = mainJavaFixture()
//      target the println method method name
        val targetRange = CursorlessRange.fromLogicalPositions(fixture.editor, 4, 19, 4, 26)
        println("target: $targetRange")
        val editorHats: HatsFormat = awaitHats(fixture, fixture.editor)
        val clTarget = findHatForRange(fixture.editor, editorHats, targetRange)
        assertNotNull(clTarget)
        if (clTarget != null) {

            val commandV7 = CursorlessCommand.changeEveryInstance(clTarget)
            println("clTarget: $clTarget")

            fixture.appService.cursorlessEngine.executeCommand(commandV7)

            runBlocking {
                delay(50)
            }

            runInEdtAndWait {
                val expectedFirst = "        System.out.(\"Hello IDEA welcome!\");"
                assertEquals(expectedFirst, getTextFromLine(fixture.editor, 4))

                val expectedSecond = "        System.out.(\"i = \" + i);"
                assertEquals(expectedSecond, getTextFromLine(fixture.editor, 10))

                val carets = fixture.editor.caretModel.caretsAndSelections
                assertEquals(2, carets.size)

                assertEquals(carets[0].caretPosition, LogicalPosition(4, 19))
                assertEquals(carets[1].caretPosition, LogicalPosition(10, 19))

                myFixture.type("write")

                val expectedFirstAfter = "        System.out.write(\"Hello IDEA welcome!\");"
                assertEquals(expectedFirstAfter, getTextFromLine(fixture.editor, 4))

                val expectedSecondAfter = "        System.out.write(\"i = \" + i);"
                assertEquals(expectedSecondAfter, getTextFromLine(fixture.editor, 10))
            }
        }
    }

    @Test
    fun testDrink() {
        val fixture = mainJavaFixture()
//      target the println method method name in line 11
        val targetRange = CursorlessRange.fromLogicalPositions(fixture.editor, 10, 19, 10, 26)
        println("target: $targetRange")
        val editorHats: HatsFormat = awaitHats(fixture, fixture.editor)
        val clTarget = findHatForRange(fixture.editor, editorHats, targetRange)
        assertNotNull(clTarget)
        if (clTarget != null) {

            val commandV7 = CursorlessCommand.drink(clTarget)
            println("clTarget: $clTarget")

            fixture.appService.cursorlessEngine.executeCommand(commandV7)

            runBlocking {
                delay(50)
            }

            runInEdtAndWait {
                val expectedFirst = "        "
                assertEquals(expectedFirst, getTextFromLine(fixture.editor, 10))

                val carets = fixture.editor.caretModel.caretsAndSelections
                assertEquals(1, carets.size)

                assertEquals(carets[0].caretPosition, LogicalPosition(10, 8))
            }
        }
    }

    @Test
    fun testPour() {
        val fixture = mainJavaFixture()
        // auto-indent does not work for java files in BasePlatformTestCase, so use xml instead
        val xmlFile = myFixture.configureByFile("org/example/book-catalog.xml")
        val xmlEditor = getEditorFromPsiFile(xmlFile)!!
        runInEdtAndWait {
            EditorTestUtil.setEditorVisibleSize(xmlEditor, 80, 20)
            IdeFocusManager.getGlobalInstance().requestFocus(xmlEditor.contentComponent, true)
        }
//      target the Computer genre in line 6
        val targetRange = CursorlessRange.fromLogicalPositions(xmlEditor, 5, 15, 5, 23)
        println("target: $targetRange")

        val clTarget = awaitTargetForRange(fixture, xmlEditor, targetRange)

        if (clTarget != null) {

            val commandV7 = CursorlessCommand.pour(clTarget)
            println("clTarget: $clTarget")

            fixture.appService.cursorlessEngine.executeCommand(commandV7)

            runBlocking {
                delay(150)
            }

            runInEdtAndWait {
                val expectedFirst = "        "
                assertEquals(expectedFirst, getTextFromLine(xmlEditor, 6))

                val carets = xmlEditor.caretModel.caretsAndSelections
                assertEquals(1, carets.size)

                assertEquals(carets[0].caretPosition, LogicalPosition(6, 8))
            }
        }
    }

    fun getTextFromLine(editor: Editor, lineNumber: Int): String? {
        val document = editor.document
        return if (lineNumber in 0 until document.lineCount) {
            val startOffset = document.getLineStartOffset(lineNumber)
            val endOffset = document.getLineEndOffset(lineNumber)
            document.getText(TextRange(startOffset, endOffset))
        } else {
            null
        }
    }

    private fun awaitHats(fixture: MainJavaFixture, editor: Editor): HatsFormat {
        runBlocking {
            delay(150)
        }
        var editorHats: HatsFormat? = null
        await.atMost(2, TimeUnit.SECONDS).until {
            editorHats = fixture.appService.editorManager.getEditorHats(editor)
            editorHats != null && editorHats!!.isNotEmpty()
        }
        return editorHats!!
    }

    @Test
    fun testTypeDefTarget() {
        val fixture = mainJavaFixture()
        val editorHats: HatsFormat = awaitHats(fixture, fixture.editor)
        assertNotEmpty(editorHats.values)

//      target the println call in visual line 5
        val targetRange = CursorlessRange.fromLogicalPositions(fixture.editor, 4, 19, 4, 26)
        println("target: $targetRange")
        val clTarget = findHatForRange(fixture.editor, editorHats, targetRange)
        assertNotNull(clTarget)
        if (clTarget != null) {
            fixture.appService.cursorlessEngine.executeCommand(CursorlessCommand.typeDeaf(clTarget))
            println("command executed")

            runBlocking {
                delay(150)
            }

            println("queue assert")
            runInEdtAndWait {
                println("Asserting in EDT...")
                assertEquals("println", fixture.editor.selectionModel.selectedText)
                assertEquals(
                    targetRange.startOffset(fixture.editor),
                    fixture.editor.selectionModel.selectionStart
                )
                assertEquals(
                    targetRange.endOffset(fixture.editor),
                    fixture.editor.selectionModel.selectionEnd
                )
            }
        }
    }

    @Test
    fun testTakeReadonly() {
        val fixture = mainJavaFixture()
        runInEdtAndWait {
            WriteAction.runAndWait<Throwable> {
                fixture.psiFile.virtualFile.isWritable = false
            }
        }

        val editorHats: HatsFormat = awaitHats(fixture, fixture.editor)
        assertNotEmpty(editorHats.values)

//      target the println call in visual line 5
        val targetRange = CursorlessRange.fromLogicalPositions(fixture.editor, 4, 19, 4, 26)
        println("target: $targetRange")
        val clTarget = findHatForRange(fixture.editor, editorHats, targetRange)
        assertNotNull(clTarget)
        if (clTarget != null) {
            val res = fixture.appService.cursorlessEngine.executeCommand(CursorlessCommand.takeSingle(clTarget))
            println("command executed")

            assertNull(res.error)
            assertNull(res.returnValue)

            runBlocking {
                delay(150)
            }

            println("queue assert")
            runInEdtAndWait {
                println("Asserting in EDT...")
                assertEquals("println", fixture.editor.selectionModel.selectedText)
                assertEquals(
                    targetRange.startOffset(fixture.editor),
                    fixture.editor.selectionModel.selectionStart
                )
                assertEquals(
                    targetRange.endOffset(fixture.editor),
                    fixture.editor.selectionModel.selectionEnd
                )
            }
        }
    }

    @Test
    fun testChangeReadonly() {
        val fixture = mainJavaFixture()
        runInEdtAndWait {
            WriteAction.runAndWait<Throwable> {
                fixture.psiFile.virtualFile.isWritable = false
            }
        }

        val editorHats: HatsFormat = awaitHats(fixture, fixture.editor)
        assertNotEmpty(editorHats.values)

//      target the println call in visual line 5
        val targetRange = CursorlessRange.fromLogicalPositions(fixture.editor, 4, 19, 4, 26)
        println("target: $targetRange")
        val clTarget = findHatForRange(fixture.editor, editorHats, targetRange)
        assertNotNull(clTarget)
        if (clTarget != null) {
            val res = fixture.appService.cursorlessEngine.executeCommand(CursorlessCommand.change(clTarget))

            TestCase.assertFalse(res.success)
            assertNotNull(res.error)
            assertNull(res.returnValue)
        }
    }


    @Test
    fun testGetText() {
        val fixture = mainJavaFixture()
//      target the main method, expect a default hat over 'm'
        val targetRange = CursorlessRange.fromLogicalPositions(fixture.editor, 3, 23, 3, 27)
        println("target: $targetRange")
        val editorHats: HatsFormat = awaitHats(fixture, fixture.editor)
        val clTarget = findHatForRange(fixture.editor, editorHats, targetRange)
        assertNotNull(clTarget)
        if (clTarget != null) {
            val clCommand = "take " + clTarget.spokenForm()
            println("command: $clCommand")
            val refCountBefore = fixture.appService.jsDriver.runtime.referenceCount

            val res = fixture.appService.cursorlessEngine.executeCommand(CursorlessCommand.getText(clTarget))
            println("command executed")
            assertNull(res.error)
            assertNotNull(res.returnValue)
            if (res.returnValue is JsonArray) {
                val returnValue = res.returnValue as JsonArray
                assertEquals(1, returnValue.size)
                assertEquals("main", returnValue[0].jsonPrimitive.content)
            } else {
                fail("Expected JsonArray")
            }

            val refCountAfter = fixture.appService.jsDriver.runtime.referenceCount
            TestCase.assertEquals(refCountBefore, refCountAfter)

        }
    }


    private fun awaitTargetForRange(
        fixture: MainJavaFixture,
        editor: Editor,
        range: CursorlessRange
    ): CursorlessTarget {
        var target: CursorlessTarget? = null
        await.atMost(2, TimeUnit.SECONDS).until {
            var editorHats = fixture.appService.editorManager.getEditorHats(editor)
            if (editorHats != null && editorHats!!.isNotEmpty()) {
                target = findHatForRange(editor, editorHats, range)
                target != null
            } else {
                false
            }
        }
        return target!!

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
                    if (split.isNotEmpty()) {
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

    private fun getEditorFromPsiFile(psiFile: PsiFile): Editor? {
        val project: Project = psiFile.project
        val virtualFile = psiFile.virtualFile
        val fileEditor = FileEditorManager.getInstance(project).getSelectedEditor(virtualFile)
        return (fileEditor as? TextEditor)?.editor
    }


    private fun moveCursorTo(editor: Editor, line: Int, column: Int) {
        println("moving cursor to $line, $column")
        setSelectionTo(editor, line, column, line, column)
    }

    private fun setSelectionTo(editor: Editor, startLine: Int, startColumn: Int, endLine: Int, endColumn: Int) {
        val startPos = LogicalPosition(startLine, startColumn)
        val endPos = LogicalPosition(endLine, endColumn)
        runInEdtAndWait {
            editor.caretModel.caretsAndSelections = listOf(CaretState(endPos, startPos, endPos))
        }
    }

    companion object {
        @JvmStatic
        @BeforeClass
        fun beforeClass() {
            System.setProperty(
                "java.util.logging.config.file",
                ClassLoader.getSystemResource("logging.properties").path
            )
        }
    }

}