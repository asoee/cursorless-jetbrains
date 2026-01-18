package com.github.asoee.cursorlessjetbrains.commands

import com.github.asoee.cursorlessjetbrains.cursorless.*
import com.github.asoee.cursorlessjetbrains.services.TalonProjectService
import com.intellij.openapi.components.service
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.fileEditor.TextEditor
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.newvfs.impl.VfsRootAccess
import com.intellij.psi.PsiFile
import com.intellij.testFramework.EditorTestUtil
import com.intellij.testFramework.fixtures.BasePlatformTestCase
import com.intellij.testFramework.runInEdtAndWait
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import org.awaitility.kotlin.await
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import java.nio.file.Paths
import java.util.concurrent.TimeUnit

@RunWith(JUnit4::class)
class CursorlessLanguageCommandsTest : BasePlatformTestCase() {

    override fun getTestDataPath() = "src/test/testData/languages"

    override fun runInDispatchThread(): Boolean {
        return false
    }

    override fun setUp() {
        super.setUp()
        val testDataPath = Paths.get(System.getProperty("user.dir"), "src", "test", "testData", "languages")
            .toAbsolutePath().toString()
        VfsRootAccess.allowRootAccess(myFixture.testRootDisposable, testDataPath)
    }

    // ==================== Java Tests ====================

    @Test
    fun testTakeFunkJavaGreet() {
        assertTakeFunk(
            filePath = "java/FunctionTest.java",
            functionName = "greet",
            line = 3,
            expectedContains = listOf("public void greet()", "System.out.println")
        )
    }

    @Test
    fun testTakeFunkJavaCalculate() {
        assertTakeFunk(
            filePath = "java/FunctionTest.java",
            functionName = "calculate",
            line = 7,
            expectedContains = listOf("public int calculate", "return x + y")
        )
    }

    // ==================== C# Tests ====================

    @Test
    fun testTakeFunkCSharpGreet() {
        assertTakeFunk(
            filePath = "csharp/FunctionTest.cs",
            functionName = "Greet",
            line = 4,
            expectedContains = listOf("public void Greet()", "Console.WriteLine")
        )
    }

    @Test
    fun testTakeFunkCSharpCalculate() {
        assertTakeFunk(
            filePath = "csharp/FunctionTest.cs",
            functionName = "Calculate",
            line = 9,
            expectedContains = listOf("public int Calculate", "return x + y")
        )
    }

    // ==================== Go Tests ====================

    @Test
    fun testTakeFunkGoGreet() {
        assertTakeFunk(
            filePath = "go/FunctionTest.go",
            functionName = "greet",
            line = 2,
            expectedContains = listOf("func greet()", "fmt.Println")
        )
    }

    @Test
    fun testTakeFunkGoCalculate() {
        assertTakeFunk(
            filePath = "go/FunctionTest.go",
            functionName = "calculate",
            line = 6,
            expectedContains = listOf("func calculate", "return x + y")
        )
    }

    // ==================== C++ Tests ====================

    @Test
    fun testTakeFunkCppGreet() {
        assertTakeFunk(
            filePath = "cpp/FunctionTest.cpp",
            functionName = "greet",
            line = 2,
            expectedContains = listOf("void greet()", "std::cout")
        )
    }

    @Test
    fun testTakeFunkCppCalculate() {
        assertTakeFunk(
            filePath = "cpp/FunctionTest.cpp",
            functionName = "calculate",
            line = 6,
            expectedContains = listOf("int calculate", "return x + y")
        )
    }

    // ==================== Rust Tests ====================

    @Test
    fun testTakeFunkRustGreet() {
        assertTakeFunk(
            filePath = "rust/FunctionTest.rs",
            functionName = "greet",
            line = 0,
            expectedContains = listOf("fn greet()", "println!")
        )
    }

    @Test
    fun testTakeFunkRustCalculate() {
        assertTakeFunk(
            filePath = "rust/FunctionTest.rs",
            functionName = "calculate",
            line = 4,
            expectedContains = listOf("fn calculate", "x + y")
        )
    }

    // ==================== Python Tests ====================

    @Test
    fun testTakeFunkPythonGreet() {
        assertTakeFunk(
            filePath = "python/FunctionTest.py",
            functionName = "greet",
            line = 0,
            expectedContains = listOf("def greet():", "print")
        )
    }

    @Test
    fun testTakeFunkPythonCalculate() {
        assertTakeFunk(
            filePath = "python/FunctionTest.py",
            functionName = "calculate",
            line = 3,
            expectedContains = listOf("def calculate", "return x + y")
        )
    }

    // ==================== JavaScript Tests ====================

    @Test
    fun testTakeFunkJavaScriptGreet() {
        assertTakeFunk(
            filePath = "javascript/FunctionTest.js",
            functionName = "greet",
            line = 0,
            expectedContains = listOf("function greet()", "console.log")
        )
    }

    @Test
    fun testTakeFunkJavaScriptCalculate() {
        assertTakeFunk(
            filePath = "javascript/FunctionTest.js",
            functionName = "calculate",
            line = 4,
            expectedContains = listOf("function calculate", "return x + y")
        )
    }

    // ==================== TypeScript Tests ====================

    @Test
    fun testTakeFunkTypeScriptGreet() {
        assertTakeFunk(
            filePath = "typescript/FunctionTest.ts",
            functionName = "greet",
            line = 0,
            expectedContains = listOf("function greet()", "console.log")
        )
    }

    @Test
    fun testTakeFunkTypeScriptCalculate() {
        assertTakeFunk(
            filePath = "typescript/FunctionTest.ts",
            functionName = "calculate",
            line = 4,
            expectedContains = listOf("function calculate", "return x + y")
        )
    }

    // ==================== Test Helper ====================

    /**
     * Executes a "take funk" command on the specified function and verifies the selection.
     *
     * @param filePath Path to the test file relative to testData/languages
     * @param functionName The name of the function to target
     * @param line The 0-indexed line number where the function name appears
     * @param expectedContains List of strings that should be present in the selected text
     */
    private fun assertTakeFunk(
        filePath: String,
        functionName: String,
        line: Int,
        expectedContains: List<String>
    ) {
        val fixture = configureFixture(filePath)
        val editorHats = awaitHats(fixture)

        val functionRange = findFunctionNameRange(fixture.editor, functionName, line)
        assertNotNull("Should find '$functionName' on line $line", functionRange)

        val target = findHatForRange(fixture.editor, editorHats, functionRange!!)
        assertNotNull("Should find a hat for '$functionName'", target)

        val command = CursorlessCommand.takeFunk(target!!)
        val result = fixture.projectService.cursorlessEngine.executeCommand(command)

        assertNull("Command should not have error: ${result.error}", result.error)
        assertTrue("Command should succeed", result.success)

        runBlocking { delay(100) }

        runInEdtAndWait {
            val selectedText = fixture.editor.selectionModel.selectedText
            assertNotNull("Should have selected text", selectedText)
            expectedContains.forEach { expected ->
                assertTrue(
                    "Selected text should contain '$expected'",
                    selectedText!!.contains(expected)
                )
            }
        }
    }

    data class LanguageFixture(
        val psiFile: PsiFile,
        val project: Project,
        val editor: Editor,
        val projectService: TalonProjectService
    )

    private fun configureFixture(filePath: String): LanguageFixture {
        val psiFile = myFixture.configureByFile(filePath)
        val project = psiFile.project
        val projectService = project.service<TalonProjectService>()
        val editor = getEditorFromPsiFile(psiFile)
        assertNotNull("Editor should not be null", editor)

        runInEdtAndWait {
            EditorTestUtil.setEditorVisibleSize(editor, 80, 20)
            projectService.editorManager.reloadAllEditors()
        }

        runBlocking { delay(100) }

        return LanguageFixture(psiFile, project, editor!!, projectService)
    }

    private fun awaitHats(fixture: LanguageFixture): HatsFormat {
        runBlocking { delay(500) }

        runInEdtAndWait {
            fixture.projectService.editorManager.reloadAllEditors()
        }

        var editorHats: HatsFormat? = null
        await.atMost(2, TimeUnit.SECONDS).until {
            editorHats = fixture.projectService.editorManager.getEditorHats(fixture.editor)
            editorHats != null && editorHats!!.isNotEmpty()
        }
        return editorHats!!
    }

    /**
     * Finds the range of a function name on a specific line (0-indexed).
     * This eliminates the need to manually calculate column positions for each test.
     *
     * @param editor The editor containing the document
     * @param functionName The name of the function to find
     * @param line The 0-indexed line number where the function name appears
     * @return The CursorlessRange for the function name, or null if not found
     */
    private fun findFunctionNameRange(editor: Editor, functionName: String, line: Int): CursorlessRange? {
        val document = editor.document
        if (line >= document.lineCount) {
            return null
        }

        val lineStartOffset = document.getLineStartOffset(line)
        val lineEndOffset = document.getLineEndOffset(line)
        val lineText = document.getText(com.intellij.openapi.util.TextRange(lineStartOffset, lineEndOffset))

        val startColumn = lineText.indexOf(functionName)
        if (startColumn == -1) {
            return null
        }

        val endColumn = startColumn + functionName.length
        return CursorlessRange.fromLogicalPositions(editor, line, startColumn, line, endColumn)
    }

    private fun findHatForRange(editor: Editor, editorHats: HatsFormat, target: CursorlessRange): CursorlessTarget? {
        editorHats.entries.forEach { entry ->
            entry.value.forEach { range ->
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
                    return CursorlessTarget(color, shape, letter)
                }
            }
        }
        return null
    }

    private fun getEditorFromPsiFile(psiFile: PsiFile): Editor? {
        val project = psiFile.project
        val virtualFile = psiFile.virtualFile
        val fileEditor = FileEditorManager.getInstance(project).getSelectedEditor(virtualFile)
        return (fileEditor as? TextEditor)?.editor
    }
}
