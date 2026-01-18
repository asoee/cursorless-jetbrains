package com.github.asoee.cursorlessjetbrains.sync

import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.fileEditor.TextEditor
import com.intellij.psi.PsiDocumentManager
import com.intellij.psi.PsiFile
import com.intellij.testFramework.fixtures.BasePlatformTestCase
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

@RunWith(JUnit4::class)
class StateWriterLanguageTest : BasePlatformTestCase() {

    override fun getTestDataPath() = "src/test/testData/languages"

    @Test
    fun testJavaLanguageDetection() {
        assertLanguageDetected("Test.java", "public class Test {}", "java")
    }

    @Test
    fun testKotlinLanguageDetection() {
        assertLanguageDetected("Test.kt", "fun main() {}", "kotlin")
    }

    @Test
    fun testPythonLanguageDetection() {
        assertLanguageDetected("test.py", "def main(): pass", "python")
    }

    @Test
    fun testTypeScriptLanguageDetection() {
        assertLanguageDetected("test.ts", "const x: number = 1", "typescript")
    }

    @Test
    fun testTsxLanguageDetection() {
        assertLanguageDetected("test.tsx", "const x = <div/>", "tsx")
    }

    @Test
    fun testJavaScriptLanguageDetection() {
        assertLanguageDetected("test.js", "const x = 1", "javascript")
    }

    @Test
    fun testJsonLanguageDetection() {
        assertLanguageDetected("test.json", "{\"key\": \"value\"}", "json")
    }

    @Test
    fun testHtmlLanguageDetection() {
        assertLanguageDetected("test.html", "<html></html>", "html")
    }

    @Test
    fun testCssLanguageDetection() {
        assertLanguageDetected("test.css", "body { color: red; }", "css")
    }

    @Test
    fun testXmlLanguageDetection() {
        assertLanguageDetected("test.xml", "<root/>", "xml")
    }

    @Test
    fun testYamlLanguageDetection() {
        assertLanguageDetected("test.yaml", "key: value", "yaml")
    }

    @Test
    fun testYmlLanguageDetection() {
        assertLanguageDetected("test.yml", "key: value", "yaml")
    }

    @Test
    fun testMarkdownLanguageDetection() {
        assertLanguageDetected("test.md", "# Header", "markdown")
    }

    @Test
    fun testBashLanguageDetection() {
        assertLanguageDetected("test.sh", "#!/bin/bash", "bash")
    }

    @Test
    fun testGoLanguageDetection() {
        assertLanguageDetected("test.go", "package main", "go")
    }

    @Test
    fun testRustLanguageDetection() {
        assertLanguageDetected("test.rs", "fn main() {}", "rust")
    }

    @Test
    fun testCLanguageDetection() {
        assertLanguageDetected("test.c", "int main() { return 0; }", "c")
    }

    @Test
    fun testCppLanguageDetection() {
        assertLanguageDetected("test.cpp", "int main() { return 0; }", "cpp")
    }

    @Test
    fun testCSharpLanguageDetection() {
        assertLanguageDetected("Test.cs", "class Test {}", "csharp")
    }

    @Test
    fun testRubyLanguageDetection() {
        assertLanguageDetected("test.rb", "def main; end", "ruby")
    }

    @Test
    fun testPhpLanguageDetection() {
        assertLanguageDetected("test.php", "<?php echo 'hello';", "php")
    }

    @Test
    fun testScalaLanguageDetection() {
        assertLanguageDetected("Test.scala", "object Test", "scala")
    }

    @Test
    fun testSwiftLanguageDetection() {
        assertLanguageDetected("test.swift", "func main() {}", "swift")
    }

    @Test
    fun testLuaLanguageDetection() {
        assertLanguageDetected("test.lua", "print('hello')", "lua")
    }

    @Test
    fun testElixirLanguageDetection() {
        assertLanguageDetected("test.ex", "defmodule Test do end", "elixir")
    }

    @Test
    fun testClojureLanguageDetection() {
        assertLanguageDetected("test.clj", "(defn main [])", "clojure")
    }

    @Test
    fun testHaskellLanguageDetection() {
        assertLanguageDetected("test.hs", "main = putStrLn \"hello\"", "haskell")
    }

    @Test
    fun testScssLanguageDetection() {
        assertLanguageDetected("test.scss", "\$color: red;", "scss")
    }

    @Test
    fun testTerraformLanguageDetection() {
        assertLanguageDetected("main.tf", "resource \"aws_instance\" \"example\" {}", "hcl")
    }

    @Test
    fun testNixLanguageDetection() {
        assertLanguageDetected("default.nix", "{ pkgs }: pkgs.hello", "nix")
    }

    private fun assertLanguageDetected(fileName: String, content: String, expectedLanguage: String) {
        val psiFile = myFixture.configureByText(fileName, content)
        val editor = getEditorFromPsiFile(psiFile)
        assertNotNull("Editor should not be null for $fileName", editor)

        val editorState = serializeEditor(editor!!, "test-editor", psiFile)

        assertEquals(
            "Language for $fileName should be $expectedLanguage",
            expectedLanguage,
            editorState.languageId
        )
    }

    private fun getEditorFromPsiFile(psiFile: PsiFile): com.intellij.openapi.editor.Editor? {
        val project = psiFile.project
        val document = PsiDocumentManager.getInstance(project).getDocument(psiFile)
        if (document != null) {
            val virtualFile = psiFile.virtualFile
            val fileEditor = FileEditorManager.getInstance(project).getSelectedEditor(virtualFile)
            return (fileEditor as? TextEditor)?.editor
        }
        return null
    }
}
