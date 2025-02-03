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
    return psiFile?.language?.id?.lowercase()
}
