package com.github.asoee.cursorlessjetbrains.util

import com.intellij.lang.Language
import com.intellij.openapi.editor.Editor
import com.intellij.psi.PsiDocumentManager
import com.intellij.psi.PsiElement
import com.intellij.psi.PsiFile
import com.intellij.psi.util.elementType

val methodTypes = listOf(
    "METHOD",
    "FUNCTION_DECLARATION",
    "FUNCTION_EXPRESSION",
    "Py:FUNCTION_DECLARATION",
    "FUN", // Kotlin
)

fun selectElementAtCaret(editor: Editor): PsiElement? {
    val psiFile =
        PsiDocumentManager.getInstance(editor.project!!)
            .getPsiFile(editor.document)
    var elementAtCaret: PsiElement? = null
    if (psiFile != null) {
        val selectedLanguage: Language = psiFile.language

        val viewProvider = psiFile.viewProvider

        elementAtCaret = viewProvider.findElementAt(
            editor.caretModel.offset,
            selectedLanguage
        )
        if (elementAtCaret != null && elementAtCaret.parent != null) {
            if (elementAtCaret.parent.children.isEmpty()) elementAtCaret =
                elementAtCaret.parent
        }
    }

    return elementAtCaret
}

fun findContainingFunction(element: PsiElement): PsiElement? {
    var current = element

    while (current.parent != null) {
        val currentType = current.elementType.toString()
        if (methodTypes.contains(currentType)) {
            return current
        }
        current = current.parent
    }

    return null
}

fun containingFunctionAtCaret(editor: Editor): PsiElement? {
    val elementAtCaret = selectElementAtCaret(editor)
    return elementAtCaret?.let { findContainingFunction(it) }
}

fun editorLanguage(editor: Editor): String? {
    if (editor.project == null) {
        return null
    }
    val psiFile =
        PsiDocumentManager.getInstance(editor.project!!)
            .getPsiFile(editor.document)
    return editorLanguage(psiFile)
}

/**
 * Map file extensions to language IDs that Cursorless supports.
 * This list should match the tree-sitter WASM parsers in extraFiles/treesitter/wasm/
 * When updating, check the upstream Cursorless project for new language support:
 * - WASM files: packages/cursorless-engine/src/languages/TreeSitterWasmLanguages.ts
 * - Language queries: packages/cursorless-engine/src/languages/LanguageDefinitions.ts
 */
private val extensionLanguages = mapOf(
    "agda" to "agda",
    "sh" to "bash",
    "bash" to "bash",
    "zsh" to "bash",
    "c" to "c",
    "h" to "c",
    "cs" to "csharp",
    "clj" to "clojure",
    "cljs" to "clojure",
    "cljc" to "clojure",
    "cpp" to "cpp",
    "cc" to "cpp",
    "cxx" to "cpp",
    "c++" to "cpp",
    "hpp" to "cpp",
    "hxx" to "cpp",
    "h++" to "cpp",
    "css" to "css",
    "dart" to "dart",
    "dtd" to "dtd",
    "ex" to "elixir",
    "exs" to "elixir",
    "elm" to "elm",
    "gdscript" to "gdscript",
    "gd" to "gdscript",
    "gleam" to "gleam",
    "go" to "go",
    "hs" to "haskell",
    "lhs" to "haskell",
    "hcl" to "hcl",
    "tf" to "hcl",
    "html" to "html",
    "htm" to "html",
    "java" to "java",
    "js" to "javascript",
    "mjs" to "javascript",
    "json" to "json",
    "jl" to "julia",
    "kt" to "kotlin",
    "kts" to "kotlin",
    "tex" to "latex",
    "lua" to "lua",
    "md" to "markdown",
    "markdown" to "markdown",
    "nix" to "nix",
    "pl" to "perl",
    "pm" to "perl",
    "php" to "php",
    "py" to "python",
    "pyw" to "python",
    "scm" to "query",
    "r" to "r",
    "rb" to "ruby",
    "rs" to "rust",
    "scala" to "scala",
    "sc" to "scala",
    "scss" to "scss",
    "sparql" to "sparql",
    "swift" to "swift",
    "talon" to "talon",
    "ts" to "typescript",
    "tsx" to "tsx",
    "xml" to "xml",
    "yaml" to "yaml",
    "yml" to "yaml",
    "txt" to "plaintext",
)

fun languageForExtension(extension: String): String? {
    return extensionLanguages[extension]
}

/** A file extension Cursorless maps to [language], e.g. for a new untitled document in that language */
fun extensionForLanguage(language: String): String? {
    return extensionLanguages.entries.firstOrNull { it.value == language }?.key
}

fun editorLanguage(psiFile: PsiFile?): String? {
    // Use file extension mapping as primary source of truth for Cursorless language IDs
    // This ensures consistent language names that match tree-sitter parser expectations
    val fileName = psiFile?.virtualFile?.name
    if (fileName != null) {
        val extension = fileName.substringAfterLast('.', "").lowercase()
        val mappedLanguage = languageForExtension(extension)
        if (mappedLanguage != null) {
            return mappedLanguage
        }
    }

    // Fall back to PSI language for extensions not in the mapping
    // The IDE's plain text language is "TEXT"; VS Code and Cursorless call it "plaintext"
    val psiLanguage = psiFile?.language?.id?.lowercase()?.takeUnless { it == "text" }
    return psiLanguage ?: "plaintext"
}
