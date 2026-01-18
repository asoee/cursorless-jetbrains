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
fun languageForExtension(extension: String): String? {
    return when (extension) {
        "agda" -> "agda"
        "sh", "bash", "zsh" -> "bash"
        "c", "h" -> "c"
        "cs" -> "csharp"
        "clj", "cljs", "cljc" -> "clojure"
        "cpp", "cc", "cxx", "c++", "hpp", "hxx", "h++" -> "cpp"
        "css" -> "css"
        "dart" -> "dart"
        "dtd" -> "dtd"
        "ex", "exs" -> "elixir"
        "elm" -> "elm"
        "gdscript", "gd" -> "gdscript"
        "gleam" -> "gleam"
        "go" -> "go"
        "hs", "lhs" -> "haskell"
        "hcl", "tf" -> "hcl"
        "html", "htm" -> "html"
        "java" -> "java"
        "js", "mjs" -> "javascript"
        "json" -> "json"
        "jl" -> "julia"
        "kt", "kts" -> "kotlin"
        "tex" -> "latex"
        "lua" -> "lua"
        "md", "markdown" -> "markdown"
        "nix" -> "nix"
        "pl", "pm" -> "perl"
        "php" -> "php"
        "py", "pyw" -> "python"
        "scm" -> "query"  // tree-sitter query files
        "r" -> "r"
        "rb" -> "ruby"
        "rs" -> "rust"
        "scala", "sc" -> "scala"
        "scss" -> "scss"
        "sparql" -> "sparql"
        "swift" -> "swift"
        "talon" -> "talon"
        "ts" -> "typescript"
        "tsx" -> "tsx"
        "xml" -> "xml"
        "yaml", "yml" -> "yaml"
        else -> null
    }
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
    val psiLanguage = psiFile?.language?.id?.lowercase()
    return psiLanguage ?: "plaintext"
}
