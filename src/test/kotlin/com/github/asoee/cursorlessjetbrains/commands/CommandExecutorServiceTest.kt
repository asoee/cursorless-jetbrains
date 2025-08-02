package com.github.asoee.cursorlessjetbrains.commands

import com.github.asoee.cursorlessjetbrains.services.TalonProjectService
import com.intellij.openapi.components.service
import com.intellij.openapi.editor.CaretState
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.LogicalPosition
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.fileEditor.TextEditor
import com.intellij.openapi.ide.CopyPasteManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.newvfs.impl.VfsRootAccess
import com.intellij.psi.PsiFile
import com.intellij.testFramework.fixtures.BasePlatformTestCase
import com.intellij.testFramework.runInEdtAndWait
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import java.awt.datatransfer.StringSelection
import java.nio.file.Paths

//@TestDataPath("\$CONTENT_ROOT/src/test/testData")
@RunWith(JUnit4::class)
class CommandExecutorServiceTest : BasePlatformTestCase() {

    override fun runInDispatchThread(): Boolean {
        return false
    }

    override fun setUp() {
        super.setUp()
        // Allow access to test data directory
        val testDataPath = Paths.get(System.getProperty("user.dir"), "src", "test", "testData").toAbsolutePath().toString()
        VfsRootAccess.allowRootAccess(myFixture.testRootDisposable, testDataPath)
    }

    @Test
    fun testInsertLineAfter() {
        val fixture = mainJavaFixture()
        val command = InsertLineAfterCommand(fixture.project, fixture.editor, listOf(LineRange(3, 3)).toTypedArray())
        val result = fixture.commandExecutorService.execute(command)
        myFixture.checkResultByFile("org/example/Main_after_insert_lines.java")
    }

    @Test
    fun testCloneLine() {
        val fixture = mainJavaFixture()
        val command = CloneLineCommand(fixture.project, 7)
        val result = fixture.commandExecutorService.execute(command)
        myFixture.checkResultByFile("org/example/Main_after_clone_line.java")
    }

    @Test
    fun testFind() {
        val fixture = mainJavaFixture()
        val command = FindCommand(fixture.project, "next", "print")
        val result = fixture.commandExecutorService.execute(command)
        myFixture.checkResultByFile("org/example/Main.java")
        runInEdtAndWait {
            val selectedText = fixture.editor.selectionModel.selectedText
            assertEquals("print", selectedText)
            assertSelectedOffset(fixture, 106, 111)
        }
    }

    @Test
    fun testGoto() {
        val fixture = mainJavaFixture()
        val command = GotoCommand(fixture.project, 5, 20)
        val result = fixture.commandExecutorService.execute(command)
        myFixture.checkResultByFile("org/example/Main.java")
        assertSelectedOffset(fixture, 106, 106)

    }

    @Test
    fun testIdeActionCommandIntroduceVariable() {
        val fixture = mainJavaFixture()
        val startPos = LogicalPosition(7, 20)  // Select "Tool.add(i, 2)" expression
        val endPos = LogicalPosition(7, 34)
        runInEdtAndWait {
            fixture.editor.caretModel.caretsAndSelections = listOf(CaretState(endPos, startPos, endPos))
            val selectedText = fixture.editor.document.getText(
                com.intellij.openapi.util.TextRange(
                    fixture.editor.logicalPositionToOffset(startPos),
                    fixture.editor.logicalPositionToOffset(endPos),
                )
            )
            println("Selected text: '$selectedText'")

        }
        val command = IDEActionCommand(fixture.project, "IntroduceVariable")
        val result = fixture.commandExecutorService.execute(command)
        myFixture.checkResultByFile("org/example/Main_after_introduce_variable.java")

    }

    @Test
    fun testIdeActionCommandEditorPaste() {
        val fixture = mainJavaFixture()
        val startPos = LogicalPosition(6, 31)
        val endPos = LogicalPosition(6, 31)
        runInEdtAndWait {
            fixture.editor.caretModel.caretsAndSelections = listOf(CaretState(endPos, startPos, endPos))
        }
        val text = " // My comment here"
        CopyPasteManager.getInstance().setContents(StringSelection(text))
        val command = IDEActionCommand(fixture.project, "EditorPaste")
        println("execute")
        val result = fixture.commandExecutorService.execute(command)
        runBlocking {
            delay(50)
        }
        runInEdtAndWait {
            println("check")
            myFixture.checkResultByFile("org/example/Main_after_editor_paste.java")
        }
        println("bg done")

        println("test done")
    }


    @Test
    fun testIdeActionCommandGotoDeclaration() {
        val fixture = mainJavaFixture()
        // Place cursor on the function call "doSomethingElse" on line 7
        val functionCallPos = LogicalPosition(6, 12) // 0-indexed line 6, character 12 (start of "doSomethingElse")
        runInEdtAndWait {
            fixture.editor.caretModel.caretsAndSelections =
                listOf(CaretState(functionCallPos, functionCallPos, functionCallPos))
        }

        // Get initial cursor position
        val initialPosition = runInEdtAndWait {
            fixture.editor.caretModel.logicalPosition
        }
        println("Initial cursor position: $initialPosition")

        val command = IDEActionCommand(fixture.project, "GotoDeclaration")
        println("Executing GotoDeclaration command")
        val result = fixture.commandExecutorService.execute(command)
        println("Command execution result: $result")

        runBlocking {
            delay(100) // Wait longer for navigation to complete
        }

        runInEdtAndWait {
            val finalPosition = fixture.editor.caretModel.logicalPosition
            println("Final cursor position: $finalPosition")

            // Get the text at the current cursor position for debugging
            val currentLine = fixture.editor.document.getText(
                com.intellij.openapi.util.TextRange(
                    fixture.editor.document.getLineStartOffset(finalPosition.line),
                    fixture.editor.document.getLineEndOffset(finalPosition.line)
                )
            )
            println("Text at final cursor line: '$currentLine'")

            // Verify that navigation worked - cursor should move to the function definition line
            if (finalPosition.line == 6) {
                println("Cursor remained on original line - GotoDeclaration may not have worked")
                fail("GotoDeclaration should have moved cursor to function definition")
            } else {
                println("Cursor moved to line ${finalPosition.line}")
                // The function definition should be on line 10 (0-indexed)
                assertEquals("GotoDeclaration should navigate to function definition line", 10, finalPosition.line)
                assertTrue("Should be on the function definition line", currentLine.contains("doSomethingElse"))
            }
        }
    }

    private fun assertSelectedOffset(fixture: MainJavaFixture, startOffset: Int, endOffset: Int) {
        runInEdtAndWait {
            val selectionStart = fixture.editor.selectionModel.selectionStart
            val selectionEnd = fixture.editor.selectionModel.selectionEnd
            assertEquals(startOffset, selectionStart)
            assertEquals(endOffset, selectionEnd)
        }
    }

    private fun moveCursorTo(editor: Editor, line: Int, column: Int) {
        setSelectionTo(editor, line, column, line, column)
    }

    private fun setSelectionTo(editor: Editor, startLine: Int, startColumn: Int, endLine: Int, endColumn: Int) {
        val startPos = LogicalPosition(startLine, startColumn)
        val endPos = LogicalPosition(endLine, endColumn)
        runInEdtAndWait {
            editor.caretModel.caretsAndSelections = listOf(CaretState(endPos, startPos, endPos))
        }
    }


    data class MainJavaFixture(
        val psiFile: PsiFile,
        val commandExecutorService: CommandExecutorService,
        val project: Project,
        val editor: Editor,
        val projectService: TalonProjectService
    )

    private fun mainJavaFixture(): MainJavaFixture {
        val psiFile = myFixture.configureByFile("org/example/Main.java")
        val project = psiFile.project
        val commandExecutorService = CommandExecutorService()
        val appService = project.service<TalonProjectService>()
        val editor = getEditorFromPsiFile(psiFile)
        assertNotNull(editor)
        return MainJavaFixture(psiFile, commandExecutorService, project, editor!!, appService)
    }

    private fun getEditorFromPsiFile(psiFile: PsiFile): Editor? {
        val project: Project = psiFile.project
        val virtualFile = psiFile.virtualFile
        val fileEditor = FileEditorManager.getInstance(project).getSelectedEditor(virtualFile)
        return (fileEditor as? TextEditor)?.editor
    }

    override fun getTestDataPath() = "src/test/testData/commands"

}