package com.github.asoee.cursorlessjetbrains.commands

import com.github.asoee.cursorlessjetbrains.services.TalonApplicationService
import com.intellij.openapi.components.service
import com.intellij.openapi.editor.CaretState
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.LogicalPosition
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.fileEditor.TextEditor
import com.intellij.openapi.ide.CopyPasteManager
import com.intellij.openapi.project.Project
import com.intellij.psi.PsiFile
import com.intellij.testFramework.fixtures.BasePlatformTestCase
import com.intellij.testFramework.runInEdtAndWait
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import java.awt.datatransfer.StringSelection

//@TestDataPath("\$CONTENT_ROOT/src/test/testData")
@RunWith(JUnit4::class)
class CommandExecutorServiceTest : BasePlatformTestCase() {

    override fun runInDispatchThread(): Boolean {
        return false
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
        val startPos = LogicalPosition(5, 31)
        val endPos = LogicalPosition(5, 32)
        runInEdtAndWait {
            fixture.editor.caretModel.caretsAndSelections = listOf(CaretState(endPos, startPos, endPos))
        }
        val command = IDEActionCommand(fixture.project, "IntroduceVariable")
        val result = fixture.commandExecutorService.execute(command)
        myFixture.checkResultByFile("org/example/Main.java")

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
        val appService: TalonApplicationService
    )

    private fun mainJavaFixture(): MainJavaFixture {
        val psiFile = myFixture.configureByFile("org/example/Main.java")
        val commandExecutorService = CommandExecutorService()
        val appService = service<TalonApplicationService>()
        val editor = getEditorFromPsiFile(psiFile)
        assertNotNull(editor)
        return MainJavaFixture(psiFile, commandExecutorService, psiFile.project, editor!!, appService)
    }

    private fun getEditorFromPsiFile(psiFile: PsiFile): Editor? {
        val project: Project = psiFile.project
        val virtualFile = psiFile.virtualFile
        val fileEditor = FileEditorManager.getInstance(project).getSelectedEditor(virtualFile)
        return (fileEditor as? TextEditor)?.editor
    }

    override fun getTestDataPath() = "src/test/testData/commands"

}