package com.github.asoee.cursorlessjetbrains.commands

import com.intellij.codeInsight.template.TemplateManager
import com.intellij.codeInsight.template.impl.TemplateImpl
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.project.Project

class InsertSnippetCommand(project: Project, private val editor: Editor, private val snippet: String) :
    VcCommand(project) {

    override fun executionMode(): ExecutionMode {
        return ExecutionMode.WRITE
    }

    override fun execute(context: CommandContext): String {
        // Convert VSCode/TextMate snippet format to IntelliJ format and collect variables
        val (convertedSnippet, variables) = convertSnippetFormatWithVariables(snippet)
        thisLogger().info("insertSnippet: '$snippet' -> '$convertedSnippet' with variables: $variables")

        // Create a template from the converted snippet string
        val template = TemplateImpl("cursorless-snippet", convertedSnippet, "")
        template.isToReformat = true

        // Add variables to the template
        for (variable in variables) {
            template.addVariable(variable, "", "", true)
        }

        // Get the currently selected text
        val selectedText = editor.selectionModel.selectedText ?: ""

        // Prepare predefined variables map to pass selected text and other values
        val predefinedVars = mutableMapOf<String, String>()
        if (variables.contains("SELECTION")) {
            predefinedVars["SELECTION"] = selectedText
        }

        // Insert the template with predefined variables
        val templateManager = TemplateManager.getInstance(project)
        templateManager.startTemplate(
            editor,
            selectedText,
            template
        )
        
        return "OK"
    }

    private fun convertSnippetFormatWithVariables(snippet: String): Pair<String, Set<String>> {
        var converted = snippet
        val variables = mutableSetOf<String>()

        // Convert TM_SELECTED_TEXT to IntelliJ's $SELECTION$
        if (converted.contains("TM_SELECTED_TEXT")) {
            variables.add("SELECTION")
            converted = converted.replace("\${TM_SELECTED_TEXT}", "\$SELECTION\$")
        }

        // Convert numbered tab stops ($1, $2, etc.) to IntelliJ variable format ($VAR1$, $VAR2$, etc.)
        val tabStopRegex = Regex("""\$(\d+)""")
        converted = tabStopRegex.replace(converted) { matchResult ->
            val number = matchResult.groupValues[1]
            if (number == "0") {
                "\$END\$"  // $0 becomes $END$ (final cursor position)
            } else {
                val variableName = "VAR$number"
                variables.add(variableName)
                "\$$variableName\$"  // $1, $2, etc. become $VAR1$, $VAR2$, etc.
            }
        }

        // Convert placeholder format ${1:placeholder} to IntelliJ format $VAR1$
        val placeholderRegex = Regex("""\$\{(\d+):([^}]*)\}""")
        converted = placeholderRegex.replace(converted) { matchResult ->
            val number = matchResult.groupValues[1]
            val placeholder = matchResult.groupValues[2]
            if (number == "0") {
                "\$END\$"
            } else {
                val variableName = "VAR$number"
                variables.add(variableName)
                "\$$variableName\$"  // IntelliJ doesn't support default text in the same way, so we just use the variable
            }
        }

        // Convert simple placeholders ${1} to IntelliJ format $VAR1$
        val simplePlaceholderRegex = Regex("""\$\{(\d+)\}""")
        converted = simplePlaceholderRegex.replace(converted) { matchResult ->
            val number = matchResult.groupValues[1]
            if (number == "0") {
                "\$END\$"
            } else {
                val variableName = "VAR$number"
                variables.add(variableName)
                "\$$variableName\$"
            }
        }

        return Pair(converted, variables)
    }

    // Keep the old method for compatibility/testing
    private fun convertSnippetFormat(snippet: String): String {
        return convertSnippetFormatWithVariables(snippet).first
    }
}