package com.github.asoee.cursorlessjetbrains.commands

import com.github.asoee.cursorlessjetbrains.services.TalonApplicationService
import com.intellij.openapi.components.service
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.fileEditor.TextEditor
import com.intellij.openapi.project.Project
import com.intellij.psi.PsiFile
import com.intellij.testFramework.TestDataPath
import com.intellij.testFramework.fixtures.BasePlatformTestCase

@TestDataPath("\$CONTENT_ROOT/src/test/testData")
class CommandExecutorServiceTest : BasePlatformTestCase() {

    @org.junit.Test
    fun testInsertLineAfter() {
        val fixture = mainJavaFixture()
        val command = InsertLineAfterCommand(fixture.project, fixture.editor, listOf(LineRange(3, 3)).toTypedArray())
        val result = fixture.commandExecutorService.execute(command)
        myFixture.checkResultByFile("org/example/Main_after_insert_lines.java")
    }

    @org.junit.Test
    fun testCloneLine() {
        val fixture = mainJavaFixture()
        val command = CloneLineCommand(fixture.project, 7)
        val result = fixture.commandExecutorService.execute(command)
        myFixture.checkResultByFile("org/example/Main_after_clone_line.java")
    }

    @org.junit.Test
    fun testFind() {
        val fixture = mainJavaFixture()
        val command = FindCommand(fixture.project, "next", "print")
        val result = fixture.commandExecutorService.execute(command)
        myFixture.checkResultByFile("org/example/Main.java")
        val selectedText = fixture.editor.selectionModel.getSelectedText()
        assertEquals("print", selectedText)
        assertSelectedOffset(fixture, 106, 111)

    }

    @org.junit.Test
    fun testGoto() {
        val fixture = mainJavaFixture()
        val command = GotoCommand(fixture.project, 5, 20)
        val result = fixture.commandExecutorService.execute(command)
        myFixture.checkResultByFile("org/example/Main.java")
        assertSelectedOffset(fixture, 106, 106)

    }

    private fun assertSelectedOffset(fixture: MainJavaFixture, startOffset: Int, endOffset: Int) {
        val selectionStart = fixture.editor.selectionModel.selectionStart
        val selectionEnd = fixture.editor.selectionModel.selectionEnd
        assertEquals(startOffset, selectionStart)
        assertEquals(endOffset, selectionEnd)
    }

    data class MainJavaFixture(
        val psiFile: PsiFile,
        val commandExecutorService: CommandExecutorService,
        val project: Project,
        val editor: Editor
    )

    private fun mainJavaFixture(): MainJavaFixture {
        val psiFile = myFixture.configureByFile("org/example/Main.java")
        val commandExecutorService = CommandExecutorService()
        val appService = service<TalonApplicationService>()
        val editor = getEditorFromPsiFile(psiFile)
        assertNotNull(editor)
        return MainJavaFixture(psiFile, commandExecutorService, psiFile.project, editor!!)
    }

    fun getEditorFromPsiFile(psiFile: PsiFile): Editor? {
        val project: Project = psiFile.project
        val virtualFile = psiFile.virtualFile
        val fileEditor = FileEditorManager.getInstance(project).getSelectedEditor(virtualFile)
        return (fileEditor as? TextEditor)?.editor
    }

    override fun getTestDataPath() = "src/test/testData/commands"

}