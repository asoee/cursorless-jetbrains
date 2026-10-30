package com.github.asoee.cursorlessjetbrains

import com.github.asoee.cursorlessjetbrains.commands.CommandExecutorService
import com.github.asoee.cursorlessjetbrains.commands.ShowCheatsheetCommand
import com.github.asoee.cursorlessjetbrains.commandserver.file.CommandServerRequest
import com.github.asoee.cursorlessjetbrains.commandserver.file.FileCommandServer
import com.github.asoee.cursorlessjetbrains.commands.CommandExecutorServiceTest.MainJavaFixture
import com.github.asoee.cursorlessjetbrains.cursorless.*
import com.github.asoee.cursorlessjetbrains.services.TalonProjectService
import com.intellij.find.EditorSearchSession
import com.intellij.notification.Notifications
import com.intellij.notification.Notification
import com.intellij.openapi.application.WriteAction
import com.intellij.openapi.command.undo.UndoManager
import com.intellij.openapi.components.service
import com.intellij.openapi.editor.CaretState
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.LogicalPosition
import com.intellij.openapi.editor.markup.EffectType
import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.fileEditor.TextEditor
import com.intellij.openapi.ide.CopyPasteManager
import java.awt.datatransfer.StringSelection
import com.intellij.openapi.fileEditor.impl.text.TextEditorProvider
import com.intellij.openapi.module.Module
import com.intellij.openapi.module.ModuleManager
import com.intellij.openapi.module.StdModuleTypes
import com.intellij.openapi.project.Project
import com.intellij.openapi.projectRoots.Sdk
import com.intellij.openapi.roots.ContentEntry
import com.intellij.openapi.roots.ModifiableRootModel
import com.intellij.openapi.roots.ModuleRootManager
import com.intellij.openapi.util.TextRange
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.openapi.vfs.newvfs.impl.VfsRootAccess
import com.intellij.openapi.wm.IdeFocusManager
import com.intellij.psi.PsiFile
import com.intellij.testFramework.EditorTestUtil
import com.intellij.testFramework.IdeaTestUtil
import com.intellij.testFramework.LightProjectDescriptor
import com.intellij.testFramework.fixtures.BasePlatformTestCase
import com.intellij.testFramework.fixtures.DefaultLightProjectDescriptor
import com.intellij.testFramework.runInEdtAndWait
import com.intellij.xdebugger.XDebuggerManager
import com.intellij.xdebugger.breakpoints.XLineBreakpoint
import junit.framework.TestCase
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonPrimitive
import org.awaitility.kotlin.await
import org.junit.BeforeClass
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import java.nio.file.Files
import java.nio.file.Paths
import java.util.concurrent.TimeUnit

class CursorlessJavaProjectDescriptor : DefaultLightProjectDescriptor() {
    override fun getModuleTypeId(): String {
        return StdModuleTypes.JAVA.id
    }

    override fun getSdk(): Sdk? {
        return IdeaTestUtil.getMockJdk17()
    }

    override fun configureModule(module: Module, model: ModifiableRootModel, contentEntry: ContentEntry) {
        super.configureModule(module, model, contentEntry)

        // Add src/main/java as the Java source root (following Maven/Gradle convention)
        val sourceRootUrl = contentEntry.url!! + "/src/main/java"
        contentEntry.addSourceFolder(sourceRootUrl, false)
    }
}

val cursorlessJavaProjectDescriptor = CursorlessJavaProjectDescriptor()

@RunWith(JUnit4::class)
class TestCursorlessActions : BasePlatformTestCase() {

    override fun getTestDataPath() = "src/test/testData/commands"

    override fun getProjectDescriptor(): LightProjectDescriptor? {
        return cursorlessJavaProjectDescriptor
    }
    

    override fun runInDispatchThread(): Boolean {
        return false
    }

    override fun setUp() {
        super.setUp()
        // Allow access to test data directory structure
        val testDataPath =
            Paths.get(System.getProperty("user.dir"), "src", "test", "testData").toAbsolutePath().toString()
        VfsRootAccess.allowRootAccess(myFixture.testRootDisposable, testDataPath)

        // Also allow access to the Java source directory within test data
        val javaSourcePath =
            Paths.get(System.getProperty("user.dir"), "src", "test", "testData", "commands", "src", "main", "java")
                .toAbsolutePath().toString()
        VfsRootAccess.allowRootAccess(myFixture.testRootDisposable, javaSourcePath)
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
    fun testProjectDescriptorConfiguration() {
        val fixture = mainJavaFixture()

        // Verify that the module is properly configured as a Java module
        val modules = ModuleManager.getInstance(fixture.psiFile.project).modules
        val module = modules.first()

        // Check that the module has the correct type
        val moduleTypeId = module.moduleTypeName
        println("Module type: $moduleTypeId")

        // Check that there are source roots configured
        val rootManager = ModuleRootManager.getInstance(module)
        val sourceRoots: Array<VirtualFile> = rootManager.sourceRoots
        println("Source roots count: ${sourceRoots.size}")

        sourceRoots.forEachIndexed { index, root ->
            println("Source root $index: ${root.path}")
        }

        // Verify that Java files are properly recognized
        assertTrue("Module should be configured as Java module", moduleTypeId == "JAVA_MODULE")
        assertTrue("Should have at least one source root", sourceRoots.isNotEmpty())

        // Check that the Java file is properly indexed and recognized
        assertNotNull("Main.java should be accessible as PSI file", fixture.psiFile)
        assertEquals("Main", fixture.psiFile.name.substringBeforeLast("."))
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
        val xmlFile = myFixture.configureByFile("references/book-catalog.xml")
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

    private fun getTextFromRange(editor: Editor, range: CursorlessRange): String {
        val document = editor.document
        val startOffset = range.startOffset(editor)
        val endOffset = range.endOffset(editor)
        return document.getText(TextRange(startOffset, endOffset))
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
    fun testGetTextReturnsJsonArrayThroughCommandServer() {
        // Regression: "format camel at <hat>" needs Talon to receive ["main"], not the string "[\"main\"]"
        val fixture = mainJavaFixture()
        val targetRange = CursorlessRange.fromLogicalPositions(fixture.editor, 3, 23, 3, 27)
        val editorHats: HatsFormat = awaitHats(fixture, fixture.editor)
        val clTarget = findHatForRange(fixture.editor, editorHats, targetRange)
        assertNotNull(clTarget)

        val commandJson = Json.encodeToString(CursorlessCommand.getText(clTarget!!))
        val request = Json.decodeFromString<CommandServerRequest>(
            """{"commandId": "cursorless.command", "args": [$commandJson, null], "waitForFinish": true, "returnCommandOutput": true, "uuid": "get-text-test"}"""
        )
        val response = FileCommandServer().buildResponse(request, fixture.project)

        assertNull(response.error)
        assertEquals(JsonArray(listOf(JsonPrimitive("main"))), (response.returnValue as JsonObject)["returnValue"])
        assertTrue(
            Json.encodeToString(response).contains(""""returnValue":{"returnValue":["main"]}""")
        )
    }

    @Test
    fun testCustomIdeCommandRunsActionOnTarget() {
        val fixture = mainJavaFixture()
        val target = awaitTargetForRange(fixture, fixture.editor, CursorlessRange.fromLogicalPositions(fixture.editor, 4, 19, 4, 26))

        val res = fixture.projectService.cursorlessEngine.executeCommand(
            listOf(actionCommand("""{"name": "executeCommand", "commandId": "CommentByLineComment", "target": ${targetJson(target)}}"""))
        )

        assertNull(res.error)
        runInEdtAndWait {
            assertEquals("//        System.out.println(\"Hello IDEA welcome!\");", getTextFromLine(fixture.editor, 4))
        }
    }

    @Test
    fun testCustomIdeCommandRejectsUnknownAction() {
        val fixture = mainJavaFixture()
        val target = awaitTargetForRange(fixture, fixture.editor, CursorlessRange.fromLogicalPositions(fixture.editor, 4, 19, 4, 26))

        val res = fixture.projectService.cursorlessEngine.executeCommand(
            listOf(actionCommand("""{"name": "executeCommand", "commandId": "NoSuchAction", "target": ${targetJson(target)}}"""))
        )

        assertFalse(res.success)
        assertTrue("error was ${res.error}", res.error?.contains("Unknown IDE action: NoSuchAction") == true)
    }

    @Test
    fun testScoutOpensFindWithTargetText() {
        val fixture = mainJavaFixture()
        val target = awaitTargetForRange(fixture, fixture.editor, CursorlessRange.fromLogicalPositions(fixture.editor, 3, 23, 3, 27))

        val res = fixture.projectService.cursorlessEngine.executeCommand(
            listOf(actionCommand("""{"name": "findInDocument", "target": ${targetJson(target)}}"""))
        )

        assertNull(res.error)
        runInEdtAndWait {
            val session = EditorSearchSession.get(fixture.editor)
            assertNotNull("find bar should be open", session)
            assertEquals("main", session!!.textInField)
        }
    }

    @Test
    fun testHoverActionsAreSupported() {
        val fixture = mainJavaFixture()
        val target = awaitTargetForRange(fixture, fixture.editor, CursorlessRange.fromLogicalPositions(fixture.editor, 4, 19, 4, 26))

        for (action in listOf("showHover", "showDebugHover")) {
            val res = fixture.projectService.cursorlessEngine.executeCommand(
                listOf(actionCommand("""{"name": "$action", "target": ${targetJson(target)}}"""))
            )
            assertTrue("$action failed: ${res.error}", res.success)
        }
    }

    @Test
    fun testBreakPointTogglesLineBreakpoint() {
        val fixture = mainJavaFixture()
        val target = awaitTargetForRange(fixture, fixture.editor, CursorlessRange.fromLogicalPositions(fixture.editor, 4, 19, 4, 26))
        val breakpointManager = XDebuggerManager.getInstance(fixture.project).breakpointManager

        val res = fixture.projectService.cursorlessEngine.executeCommand(
            listOf(actionCommand("""{"name": "toggleLineBreakpoint", "target": ${targetJson(target)}}"""))
        )

        assertTrue("toggleLineBreakpoint failed: ${res.error}", res.success)
        // Toggling is asynchronous in recent platform versions
        await.atMost(3, TimeUnit.SECONDS).until {
            breakpointManager.allBreakpoints.mapNotNull { (it as? XLineBreakpoint<*>)?.line } == listOf(4)
        }
    }

    @Test
    fun testSnipMakeOpensNewSnippetFile() {
        val fixture = mainJavaFixture()
        val target = awaitTargetForRange(fixture, fixture.editor, CursorlessRange.fromLogicalPositions(fixture.editor, 4, 19, 4, 26))
        // The real path: on macOS the temp folder is a symlink (/var -> /private/var), and the VFS uses the target
        val snippetsDir = Files.createTempDirectory("cursorless-snippets").toRealPath()
        VfsRootAccess.allowRootAccess(myFixture.testRootDisposable, snippetsDir.toString())

        // With snippetName given, the engine skips the name prompt
        val res = fixture.projectService.cursorlessEngine.executeCommand(
            listOf(actionCommand("""{"name": "generateSnippet", "target": ${targetJson(target)}, "directory": ${Json.encodeToString(snippetsDir.toString())}, "snippetName": "printSnippet"}"""))
        )

        assertNull(res.error)
        val snippetPath = snippetsDir.resolve("printSnippet.snippet")
        assertTrue("snippet file should exist", Files.exists(snippetPath))
        runInEdtAndWait {
            val editor = FileEditorManager.getInstance(fixture.project).selectedTextEditor!!
            assertEquals(snippetPath.toFile().canonicalPath, FileDocumentManager.getInstance().getFile(editor.document)?.path?.let { java.io.File(it).canonicalPath })
            assertTrue(editor.document.text, editor.document.text.contains("println"))
        }
    }

    @Test
    fun testScopeVisualizerHighlightsAndClears() {
        val fixture = mainJavaFixture()
        awaitHats(fixture, fixture.editor)
        val engine = fixture.projectService.cursorlessEngine
        fun scopeHighlighters() = fixture.editor.markupModel.allHighlighters
            .filter { it.getTextAttributes(null)?.effectType == EffectType.BOXED }

        engine.showScopeVisualizer("""{"type": "namedFunction"}""", "content")

        // main and doSomethingElse: each function is highlighted with its domain and content
        await.atMost(2, TimeUnit.SECONDS).until { scopeHighlighters().isNotEmpty() }
        runInEdtAndWait {
            val highlighted = scopeHighlighters().map { fixture.editor.document.getText(it.textRange) }
            assertTrue(highlighted.toString(), highlighted.any { it.contains("public static void main") })
            assertTrue(highlighted.toString(), highlighted.any { it.contains("doSomethingElse(int i)") })
        }

        engine.hideScopeVisualizer()

        await.atMost(2, TimeUnit.SECONDS).until { scopeHighlighters().isEmpty() }
    }

    @Test
    fun testCheatsheetIsWrittenWithSpokenForms() {
        val fixture = mainJavaFixture()
        val outputPath = Files.createTempDirectory("cursorless-cheatsheet").resolve("cheatsheet.html")

        val command = ShowCheatsheetCommand.fromArgs(
            fixture.project, listOf("""{"version": 1, "outputPath": ${Json.encodeToString(outputPath.toString())}}""")
        )!!
        fixture.commandExecutorService.execute(command)

        val html = Files.readString(outputPath)
        val data = html.substringAfter("document.cheatsheetInfo = ").substringBefore(";\n")
        val sections = (Json.parseToJsonElement(data.substringBefore("</script>").trimEnd(';')) as JsonObject)["sections"]
        assertTrue(html.contains("<script id=\"cheatsheet-data\">document.cheatsheetInfo = {\"sections\":"))
        assertNotNull(sections)
        assertTrue(sections.toString(), sections.toString().contains("\"name\":\"Actions\""))
    }

    @Test
    fun testCheatsheetInjectionEscapesScriptEnd() {
        val html = ShowCheatsheetCommand.injectCheatsheetInfo(
            "<html><script id=\"cheatsheet-data\">old</script></html>",
            JsonPrimitive("</script><b>")
        )
        assertEquals("<html><script id=\"cheatsheet-data\">document.cheatsheetInfo = \"\\u003c/script>\\u003cb>\";</script></html>", html)
    }

    @Test
    fun testGiveRemovesOneOfSeveralSelections() {
        val fixture = mainJavaFixture()
        // Line 8: "int x = Tool.add(i, 2);" - target the "i" argument
        val line = 7
        val column = getTextFromLine(fixture.editor, line)!!.indexOf("add(") + 4
        val target = awaitTargetForRange(fixture, fixture.editor, CursorlessRange.fromLogicalPositions(fixture.editor, line, column, line, column + 1))
        val engine = fixture.projectService.cursorlessEngine

        engine.executeCommand(listOf(actionCommand("""{"name": "setSelection", "target": {"type": "primitive", "mark": {"type": "decoratedSymbol", "symbolColor": "${target.color}", "character": "${target.letter}"}, "modifiers": [{"type": "everyScope", "scopeType": {"type": "argumentOrParameter"}}]}}""")))
        runInEdtAndWait {
            assertEquals(listOf("i", "2"), fixture.editor.caretModel.allCarets.map { it.selectedText })
        }

        val res = engine.executeCommand(listOf(actionCommand("""{"name": "deselect", "target": ${targetJson(target)}}""")))

        assertNull(res.error)
        runInEdtAndWait {
            assertEquals(listOf("2"), fixture.editor.caretModel.allCarets.map { it.selectedText })
        }
    }

    @Test
    fun testOneUndoRevertsEditAndCursorMove() {
        // Regression: after "drink <target>", Talon's "nope" undid only the cursor move, leaving the new line
        val fixture = mainJavaFixture()
        val target = awaitTargetForRange(fixture, fixture.editor, CursorlessRange.fromLogicalPositions(fixture.editor, 4, 19, 4, 26))
        val textBefore = fixture.editor.document.text
        val commandJson = actionCommand("""{"name": "editNewLineBefore", "target": ${targetJson(target)}}""")
        val request = Json.decodeFromString<CommandServerRequest>(
            """{"commandId": "cursorless.command", "args": [$commandJson], "waitForFinish": true, "returnCommandOutput": true, "uuid": "undo-test"}"""
        )

        val response = FileCommandServer().buildResponse(request, fixture.project)

        assertNull(response.error)
        runInEdtAndWait {
            assertEquals(textBefore.lines().size + 1, fixture.editor.document.text.lines().size)
            val textEditor = TextEditorProvider.getInstance().getTextEditor(fixture.editor)
            UndoManager.getInstance(fixture.project).undo(textEditor)
            assertEquals(textBefore, fixture.editor.document.text)
        }
    }

    @Test
    fun testOneUndoRevertsPasteAfter() {
        val fixture = mainJavaFixture()
        val target = awaitTargetForRange(fixture, fixture.editor, CursorlessRange.fromLogicalPositions(fixture.editor, 4, 19, 4, 26))
        val textBefore = fixture.editor.document.text
        CopyPasteManager.getInstance().setContents(StringSelection("pasted"))
        val commandJson = actionCommand("""{"name": "pasteFromClipboard", "destination": {"type": "primitive", "insertionMode": "after", "target": ${targetJson(target)}}}""")
        val request = Json.decodeFromString<CommandServerRequest>(
            """{"commandId": "cursorless.command", "args": [$commandJson], "waitForFinish": true, "returnCommandOutput": true, "uuid": "undo-paste-test"}"""
        )

        val response = FileCommandServer().buildResponse(request, fixture.project)

        assertNull(response.error)
        // The engine must see the paste's edit, so "that" (and the flash) cover the pasted text
        val that = fixture.projectService.cursorlessEngine.executeCommand(listOf(actionCommand("""{"name": "getText", "target": {"type": "primitive", "mark": {"type": "that"}}}""")))
        assertEquals(JsonArray(listOf(JsonPrimitive("pasted"))), that.returnValue)
        runInEdtAndWait {
            assertTrue(fixture.editor.document.text.contains("pasted"))
            val textEditor = TextEditorProvider.getInstance().getTextEditor(fixture.editor)
            UndoManager.getInstance(fixture.project).undo(textEditor)
            assertEquals(textBefore, fixture.editor.document.text)
        }
    }

    @Test
    fun testOneUndoRevertsIndentAndRestoresCursor() {
        // Regression: "indent <target>" took two undos, one for the IDE's indent action and one for the cursor
        val fixture = mainJavaFixture()
        val target = awaitTargetForRange(fixture, fixture.editor, CursorlessRange.fromLogicalPositions(fixture.editor, 4, 19, 4, 26))
        val textBefore = fixture.editor.document.text
        val caretBefore = runReadActionOnEdt { fixture.editor.caretModel.logicalPosition }
        val commandJson = actionCommand("""{"name": "indentLine", "target": ${targetJson(target)}}""")
        val request = Json.decodeFromString<CommandServerRequest>(
            """{"commandId": "cursorless.command", "args": [$commandJson], "waitForFinish": true, "returnCommandOutput": true, "uuid": "undo-indent-test"}"""
        )

        val response = FileCommandServer().buildResponse(request, fixture.project)

        assertNull(response.error)
        runInEdtAndWait {
            assertFalse(textBefore == fixture.editor.document.text)
            val textEditor = TextEditorProvider.getInstance().getTextEditor(fixture.editor)
            UndoManager.getInstance(fixture.project).undo(textEditor)
            assertEquals(textBefore, fixture.editor.document.text)
            assertEquals(caretBefore, fixture.editor.caretModel.logicalPosition)
        }
    }

    private fun <T> runReadActionOnEdt(block: () -> T): T {
        var result: T? = null
        runInEdtAndWait { result = block() }
        @Suppress("UNCHECKED_CAST")
        return result as T
    }

    @Test
    fun testSelectionOnlyCommandIsNotAnUndoStep() {
        // As in VS Code, moving the cursor is not undoable: undo after "take <target>" undoes the last edit instead.
        // In Rider, async refactorings ("extract") edit after the command, so a selection step needed its own undo
        val fixture = mainJavaFixture()
        val target = awaitTargetForRange(fixture, fixture.editor, CursorlessRange.fromLogicalPositions(fixture.editor, 4, 19, 4, 26))
        val textEditor = runReadActionOnEdt { TextEditorProvider.getInstance().getTextEditor(fixture.editor) }
        assertFalse(runReadActionOnEdt { UndoManager.getInstance(fixture.project).isUndoAvailable(textEditor) })
        val commandJson = actionCommand("""{"name": "setSelection", "target": ${targetJson(target)}}""")
        val request = Json.decodeFromString<CommandServerRequest>(
            """{"commandId": "cursorless.command", "args": [$commandJson], "waitForFinish": true, "returnCommandOutput": true, "uuid": "undo-select-test"}"""
        )

        val response = FileCommandServer().buildResponse(request, fixture.project)

        assertNull(response.error)
        runInEdtAndWait {
            assertEquals("println", fixture.editor.selectionModel.selectedText)
            assertFalse(UndoManager.getInstance(fixture.project).isUndoAvailable(textEditor))
        }
    }

    @Test
    fun testCommandHistoryIsRecordedOnlyWhenEnabledAndStatsOpensAReport() {
        val fixture = mainJavaFixture()
        val service = fixture.projectService
        val historyDir = Files.createTempDirectory("cursorless-history")
        service.editorManager.commandHistoryFiles = CommandHistoryFiles(historyDir)
        val target = awaitTargetForRange(fixture, fixture.editor, CursorlessRange.fromLogicalPositions(fixture.editor, 4, 19, 4, 26))
        val take = listOf(actionCommand("""{"name": "setSelection", "target": ${targetJson(target)}}"""))

        // Off by default, as in VS Code
        assertNull(service.cursorlessEngine.executeCommand(take).error)
        assertEquals(0, historyDir.toFile().list()!!.size)

        // With no history, stats warns instead of opening a report
        val notifications = mutableListOf<Notification>()
        fixture.project.messageBus.connect(testRootDisposable)
            .subscribe(Notifications.TOPIC, object : Notifications {
                override fun notify(notification: Notification) {
                    notifications.add(notification)
                }
            })
        service.cursorlessEngine.analyzeCommandHistory()
        runInEdtAndWait {
            assertTrue(notifications.any { it.content.contains("No command history entries found") })
        }

        service.cursorlessEngine.setCommandHistory(true)
        try {
            assertNull(service.cursorlessEngine.executeCommand(take).error)
            val historyFile = historyDir.toFile().listFiles()!!.single()
            assertTrue(historyFile.name.startsWith("cursorlessCommandHistory_"))
            assertTrue(historyFile.readText().contains("\"setSelection\""))

            service.cursorlessEngine.analyzeCommandHistory()

            runInEdtAndWait {
                val report = FileEditorManager.getInstance(fixture.project).selectedTextEditor!!.document.text
                assertTrue(report, report.contains("# Totals"))
                assertTrue(report, report.contains("Command count: 1"))
                assertTrue(report, report.contains("setSelection"))
            }
        } finally {
            service.cursorlessEngine.setCommandHistory(false)
        }
    }

    private fun targetJson(target: CursorlessTarget): String {
        return """{"type": "primitive", "mark": {"type": "decoratedSymbol", "symbolColor": "${target.color}", "character": "${target.letter}"}}"""
    }

    private fun actionCommand(actionJson: String): JsonObject {
        return Json.decodeFromString<JsonObject>(
            """{"version": 7, "spokenForm": "test", "usePrePhraseSnapshot": false, "action": $actionJson}"""
        )
    }

    @Test
    fun testDocumentUpdatedIgnoresUnknownEditor() {
        val fixture = mainJavaFixture()
        val textBefore = fixture.editor.document.text
        val edit = CursorlessEditorEdit().apply {
            changes = listOf(CursorlessEditorChange().apply { text = "x"; rangeOffset = 0; rangeLength = 0 })
        }

        fixture.projectService.editorManager.documentUpdated("no-such-editor", edit)

        assertEquals(textBefore, fixture.editor.document.text)
    }

    @Test
    fun testSnippetIfWrap() {
        val fixture = mainJavaFixture()

        // Target the doSomethingElse function call in line 7 (0-indexed line 6)
        // "doSomethingElse(i);" is at line 7 in the file
        // Let's target just the function name to match the hat system
        val targetRange = CursorlessRange.fromLogicalPositions(fixture.editor, 6, 12, 6, 27)
        println("Targeting range: $targetRange")

        // Print the text we're targeting to verify it's correct
        val targetText = getTextFromRange(fixture.editor, targetRange)
        println("Target text: '$targetText'")

        val editorHats: HatsFormat = awaitHats(fixture, fixture.editor)

        val clTarget = findHatForRange(fixture.editor, editorHats, targetRange)
        assertNotNull("Should find a target for doSomethingElse function call", clTarget)

        if (clTarget != null) {
            println("Found target: $clTarget")

            runBlocking {
                delay(200) // Wait for command execution
            }

            // Create the wrapWithSnippet command to wrap the function call with an if statement
            val wrapCommand = CursorlessCommand.wrapWithSnippet(clTarget, "if wrap")
            println("Executing command: $wrapCommand")

            val result = fixture.projectService.cursorlessEngine.executeCommand(wrapCommand)
            println("Command result: success=${result.success}, error=${result.error}")

            runBlocking {
                delay(200) // Wait for command execution
            }

            runInEdtAndWait {
                // Verify the command succeeded
                assertNull("Command should not have error: ${result.error}", result.error)
                assertTrue("Command should succeed", result.success)

                myFixture.checkResultByFile("references/Main_after_snippet_if_wrap.java")

            }
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
        val psiFile = myFixture.configureByFile("src/main/java/org/example/Main.java")
        // Also add Tool.java to the project to enable cross-file navigation
        myFixture.copyFileToProject("src/main/java/org/example/Tool.java", "src/main/java/org/example/Tool.java")

        val commandExecutorService = CommandExecutorService()
        val project = psiFile.project
        val appService = project.service<TalonProjectService>()
        val editor = getEditorFromPsiFile(psiFile)
        assertNotNull(editor)
        runInEdtAndWait {
            EditorTestUtil.setEditorVisibleSize(editor!!, 80, 20)
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