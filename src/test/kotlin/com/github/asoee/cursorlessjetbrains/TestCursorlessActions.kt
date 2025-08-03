package com.github.asoee.cursorlessjetbrains

import com.github.asoee.cursorlessjetbrains.commands.CommandExecutorService
import com.github.asoee.cursorlessjetbrains.commands.CommandExecutorServiceTest.MainJavaFixture
import com.github.asoee.cursorlessjetbrains.cursorless.*
import com.github.asoee.cursorlessjetbrains.services.TalonProjectService
import com.intellij.openapi.application.WriteAction
import com.intellij.openapi.components.service
import com.intellij.openapi.editor.CaretState
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.LogicalPosition
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.fileEditor.TextEditor
import com.intellij.openapi.project.Project
import com.intellij.openapi.util.TextRange
import com.intellij.openapi.vfs.newvfs.impl.VfsRootAccess
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
import java.nio.file.Paths
import java.util.concurrent.TimeUnit


@RunWith(JUnit4::class)
class TestCursorlessActions : BasePlatformTestCase() {

    override fun getTestDataPath() = "src/test/testData/commands"

    override fun runInDispatchThread(): Boolean {
        return false
    }

    override fun setUp() {
        super.setUp()
        // Allow access to test data directory
        val testDataPath =
            Paths.get(System.getProperty("user.dir"), "src", "test", "testData").toAbsolutePath().toString()
        VfsRootAccess.allowRootAccess(myFixture.testRootDisposable, testDataPath)
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
            assertEquals("i", clTarget.letter)
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
            val refCountBefore = fixture.projectService.jsDriver.runtime.referenceCount

            val res = fixture.projectService.cursorlessEngine.executeCommand(CursorlessCommand.takeSingle(clTarget))
            println("command executed")
            assertNull(res.error)
            assertNull(res.returnValue)

            val refCountAfter = fixture.projectService.jsDriver.runtime.referenceCount
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
//      target the main method, expect a default hat over 'i'
        val targetRange = CursorlessRange.fromLogicalPositions(fixture.editor, 3, 23, 3, 27)
        println("target: $targetRange")

        //place cursor after the curly in the for loop
        moveCursorTo(fixture.editor, 8, 9)

        runBlocking {
            // wait for editor state to update with new cursor position
            delay(100)
        }

        val editorHats: HatsFormat = awaitHats(fixture, fixture.editor)
        val clTarget = findHatForRange(fixture.editor, editorHats, targetRange)
        assertNotNull(clTarget)
        if (clTarget != null) {

            val commandV7 = CursorlessCommand.bringImplicit(clTarget)
            println("clTarget: $clTarget")

            fixture.projectService.cursorlessEngine.executeCommand(commandV7)

            runBlocking {
                delay(100)
            }

            runInEdtAndWait {
                val expected = "        }main"
                assertEquals(expected, getTextFromLine(fixture.editor, 8))
                val caretPos = fixture.editor.caretModel.currentCaret.logicalPosition
                val expectedPos = LogicalPosition(8, 13)
                assertEquals(expectedPos, caretPos)
            }
        }
    }

    @Test
    fun testBringToAfter() {
        val fixture = mainJavaFixture()
//      source the main method, expect a default hat over 'i'
        val sourceRange = CursorlessRange.fromLogicalPositions(fixture.editor, 3, 23, 3, 27)
//        dest is the curly brace at the end of the for loop in line 7
        val destRange = CursorlessRange.fromLogicalPositions(fixture.editor, 8, 8, 8, 9)
        println("sourceRange: $sourceRange")
        println("destRange: $destRange")

        //place cursor after the curly in the for loop
        moveCursorTo(fixture.editor, 8, 9)
        runBlocking {
            // wait for editor state to update with new cursor position
            delay(500)
        }

        val editorHats: HatsFormat = awaitHats(fixture, fixture.editor)
        val clSourceTarget = findHatForRange(fixture.editor, editorHats, sourceRange)
        println("clSourceTarget: $clSourceTarget")
        val clDestTarget = findHatForRange(fixture.editor, editorHats, destRange)
        println("clDestTarget: $clDestTarget")
        assertNotNull(clSourceTarget)
        assertNotNull(clDestTarget)
        if (clSourceTarget != null && clDestTarget != null) {
            val bringCmd = CursorlessCommand.bring(
                CursorlessCommand.sourceTarget(clSourceTarget),
                CursorlessCommand.destTarget(after, clDestTarget),
                "${clSourceTarget.spokenForm()} after ${clDestTarget.spokenForm()}"
            )

            fixture.projectService.cursorlessEngine.executeCommand(bringCmd)

            runBlocking {
                delay(100)
            }

            runInEdtAndWait {
                val expected = "        } main"
                assertEquals(expected, getTextFromLine(fixture.editor, 8))
                val caretPos = fixture.editor.caretModel.currentCaret.logicalPosition
                val expectedPos = LogicalPosition(8, 9)
                assertEquals("cursor should be unchanged", expectedPos, caretPos)
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

            fixture.projectService.cursorlessEngine.executeCommand(commandV7)

            runBlocking {
                delay(50)
            }

            runInEdtAndWait {
                val expectedFirst = "        System.out.(\"Hello IDEA welcome!\");"
                assertEquals(expectedFirst, getTextFromLine(fixture.editor, 4))

                val expectedSecond = "        System.out.(\"i = \" + i);"
                assertEquals(expectedSecond, getTextFromLine(fixture.editor, 11))

                val carets = fixture.editor.caretModel.caretsAndSelections
                assertEquals(2, carets.size)

                assertEquals(carets[0].caretPosition, LogicalPosition(4, 19))
                assertEquals(carets[1].caretPosition, LogicalPosition(11, 19))

                myFixture.type("write")

                val expectedFirstAfter = "        System.out.write(\"Hello IDEA welcome!\");"
                assertEquals(expectedFirstAfter, getTextFromLine(fixture.editor, 4))

                val expectedSecondAfter = "        System.out.write(\"i = \" + i);"
                assertEquals(expectedSecondAfter, getTextFromLine(fixture.editor, 11))
            }
        }
    }

    @Test
    fun testDrink() {
        val fixture = mainJavaFixture()
//      target the println method method name in line 11
        val targetRange = CursorlessRange.fromLogicalPositions(fixture.editor, 11, 19, 11, 26)
        println("target: $targetRange")
        val editorHats: HatsFormat = awaitHats(fixture, fixture.editor)
        val clTarget = findHatForRange(fixture.editor, editorHats, targetRange)
        assertNotNull(clTarget)
        if (clTarget != null) {

            val commandV7 = CursorlessCommand.drink(clTarget)
            println("clTarget: $clTarget")

            fixture.projectService.cursorlessEngine.executeCommand(commandV7)

            runBlocking {
                delay(50)
            }

            runInEdtAndWait {
                val expectedFirst = "        "
                assertEquals(expectedFirst, getTextFromLine(fixture.editor, 11))

                val carets = fixture.editor.caretModel.caretsAndSelections
                assertEquals(1, carets.size)

                assertEquals(carets[0].caretPosition, LogicalPosition(11, 8))
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

        val commandV7 = CursorlessCommand.pour(clTarget)
        println("clTarget: $clTarget")

        fixture.projectService.cursorlessEngine.executeCommand(commandV7)

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
        // Wait for the Cursorless system to initialize
        runBlocking {
            delay(500)
        }

        // Ensure the editor is properly loaded and hats are generated
        runInEdtAndWait {
            fixture.projectService.editorManager.reloadAllEditors()
        }

        var editorHats: HatsFormat? = null
        await.atMost(2, TimeUnit.SECONDS).until {
            editorHats = fixture.projectService.editorManager.getEditorHats(editor)
            println("Checking hats: ${editorHats?.size ?: "null"}")
            editorHats != null && editorHats!!.isNotEmpty()
        }
        return editorHats!!
    }

    // testTypeDefTarget moved to TestCursorlessActionsUI.kt for proper UI testing with focus management

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
            val res = fixture.projectService.cursorlessEngine.executeCommand(CursorlessCommand.takeSingle(clTarget))
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
            val res = fixture.projectService.cursorlessEngine.executeCommand(CursorlessCommand.change(clTarget))

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
            val refCountBefore = fixture.projectService.jsDriver.runtime.referenceCount

            val res = fixture.projectService.cursorlessEngine.executeCommand(CursorlessCommand.getText(clTarget))
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

            val refCountAfter = fixture.projectService.jsDriver.runtime.referenceCount
            TestCase.assertEquals(refCountBefore, refCountAfter)

        }
    }

    @Test
    fun testFollowToDifferentFile() {
        val fixture = mainJavaFixture()
        // Target the Tool.add method call on line 8 (0-indexed line 7)
        val targetRange = CursorlessRange.fromLogicalPositions(fixture.editor, 7, 24, 7, 27)
        println("target: $targetRange")
        val editorHats: HatsFormat = awaitHats(fixture, fixture.editor)
        val clTarget = findHatForRange(fixture.editor, editorHats, targetRange)
        assertNotNull("No target found for range $targetRange", clTarget)
        if (clTarget != null) {

            val followCommand = CursorlessCommand.follow(clTarget)
            println("clTarget: $clTarget")
            println("command: $followCommand")

            // Get the initial number of open editors and their names
            val initialEditorCount = FileEditorManager.getInstance(fixture.project).allEditors.size
            val initialOpenFiles = FileEditorManager.getInstance(fixture.project).openFiles.map { it.name }
            println("Initial editors: $initialEditorCount, files: $initialOpenFiles")

            val result = fixture.projectService.cursorlessEngine.executeCommand(followCommand)
            println("Command result: $result")

            runBlocking {
                delay(100) // Wait for navigation to complete
            }

            runInEdtAndWait {
                // Check what editors are open now
                val finalEditorCount = FileEditorManager.getInstance(fixture.project).allEditors.size
                val finalOpenFiles = FileEditorManager.getInstance(fixture.project).openFiles.map { it.name }
                println("Final editors: $finalEditorCount, files: $finalOpenFiles")

                // Verify that Tool.java is now open
                val toolJavaOpen = finalOpenFiles.contains("Tool.java")
                assertTrue("Expected Tool.java to be opened. Open files: $finalOpenFiles", toolJavaOpen)

                // Verify that the active editor is Tool.java
                val selectedEditor = FileEditorManager.getInstance(fixture.project).selectedEditor
                assertNotNull("No selected editor found", selectedEditor)
                val activeFileName = selectedEditor?.file?.name
                assertEquals("Expected active editor to be Tool.java", "Tool.java", activeFileName)

                // Verify that the cursor is positioned at the add() function
                if (selectedEditor is TextEditor) {
                    val editor = selectedEditor.editor
                    val caretPosition = editor.caretModel.logicalPosition
                    println("Cursor position: line ${caretPosition.line}, column ${caretPosition.column}")

                    // The add() function definition should be on line 4 (0-indexed line 3)
                    assertEquals(
                        "Expected cursor to be on line 4 (where add() function is defined)",
                        3,
                        caretPosition.line
                    )

                    // Verify the cursor is positioned at or near the function name "add"
                    val currentLineText = editor.document.getText(
                        TextRange(
                            editor.document.getLineStartOffset(caretPosition.line),
                            editor.document.getLineEndOffset(caretPosition.line)
                        )
                    )
                    println("Current line text: '$currentLineText'")
                    assertTrue(
                        "Expected current line to contain 'add' function definition",
                        currentLineText.contains("add(")
                    )

                    // More specific: verify cursor is positioned at or near the function name
                    val addFunctionIndex = currentLineText.indexOf("add")
                    assertTrue("Expected to find 'add' in the line", addFunctionIndex >= 0)

                    // Allow some flexibility in cursor positioning - it should be within the "add" function name
                    val addFunctionEndIndex = addFunctionIndex + 3 // "add" is 3 characters
                    assertTrue(
                        "Expected cursor to be positioned at or within the 'add' function name (between $addFunctionIndex and $addFunctionEndIndex, actual: ${caretPosition.column})",
                        caretPosition.column >= addFunctionIndex && caretPosition.column <= addFunctionEndIndex
                    )
                }
            }
        }
    }


    private fun awaitTargetForRange(
        fixture: MainJavaFixture,
        editor: Editor,
        range: CursorlessRange
    ): CursorlessTarget {
        var target: CursorlessTarget? = null
        await.atMost(2, TimeUnit.SECONDS).until {
            var editorHats = fixture.projectService.editorManager.getEditorHats(editor)
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
        // Also add Tool.java to the project to enable cross-file navigation
        myFixture.copyFileToProject("org/example/Tool.java", "org/example/Tool.java")
        val commandExecutorService = CommandExecutorService()
        val project = psiFile.project
        val appService = project.service<TalonProjectService>()
        val editor = getEditorFromPsiFile(psiFile)
        assertNotNull(editor)
        runInEdtAndWait {
            EditorTestUtil.setEditorVisibleSize(editor, 80, 20)
            appService.editorManager.reloadAllEditors()
        }

        // Give the Cursorless system time to initialize
        runBlocking {
            delay(100)
        }

        return MainJavaFixture(psiFile, commandExecutorService, project, editor!!, appService)
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