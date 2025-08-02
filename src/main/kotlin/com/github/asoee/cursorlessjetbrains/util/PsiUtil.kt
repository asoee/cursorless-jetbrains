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

fun editorLanguage(psiFile: PsiFile?): String? {
    val psiLanguage = psiFile?.language?.id?.lowercase()

    // If PSI gives us a real language (not generic text/plaintext), use it
    if (psiLanguage != null && psiLanguage != "text" && psiLanguage != "plaintext") {
        return psiLanguage
    }

    // Fall back to file extension mapping for non-PSI languages
    val fileName = psiFile?.virtualFile?.name ?: return psiLanguage
    val extension = fileName.substringAfterLast('.', "").lowercase()

    // Map file extensions to language IDs that Cursorless supports
    // This list should match the tree-sitter WASM parsers in extraFiles/treesitter/wasm/
    // When updating, check the upstream Cursorless project for new language support:
    // - WASM files: packages/cursorless-engine/src/languages/TreeSitterWasmLanguages.ts
    // - Language queries: packages/cursorless-engine/src/languages/LanguageDefinitions.ts
    return when (extension) {
        "talon" -> "talon"
        "scm" -> "query"  // tree-sitter query files
        "nix" -> "nix"
        "gleam" -> "gleam"
        "gdscript", "gd" -> "gdscript"
        "hcl", "tf" -> "hcl"
        "jl" -> "julia"
        "tex" -> "latex"
        "pl" -> "perl"
        "r" -> "r"
        "scala", "sc" -> "scala"
        "sparql" -> "sparql"
        "swift" -> "swift"
        "yaml", "yml" -> "yaml"
        "agda" -> "agda"
        "clj", "cljs", "cljc" -> "clojure"
        "dart" -> "dart"
        "dtd" -> "dtd"
        "ex", "exs" -> "elixir"
        "elm" -> "elm"
        "hs" -> "haskell"
        "lua" -> "lua"
        else -> psiLanguage ?: "plaintext"
    }
}
