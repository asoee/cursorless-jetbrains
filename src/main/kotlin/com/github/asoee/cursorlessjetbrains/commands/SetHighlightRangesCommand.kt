package com.github.asoee.cursorlessjetbrains.commands

import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessCharacterRange
import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessGeneralizedRange
import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessLineRange
import com.github.asoee.cursorlessjetbrains.settings.TalonSettings
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.markup.HighlighterLayer
import com.intellij.openapi.editor.markup.HighlighterTargetArea
import com.intellij.openapi.editor.markup.RangeHighlighter
import com.intellij.openapi.editor.markup.TextAttributes
import com.intellij.openapi.project.Project
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import java.awt.Color

class SetHighlightRangesCommand(
    project: Project,
    private val editor: Editor,
    private val highlightId: String?,
    private val ranges: List<CursorlessGeneralizedRange>
) : VcCommand(project) {

    companion object {
        // Track active highlights by highlightId (or null for default) and editor
        private val activeHighlights = mutableMapOf<Pair<String?, Editor>, List<RangeHighlighter>>()
        
        // Use the same purple color as flash ranges for better visibility
        // This makes highlights distinct from text selection
        private val HIGHLIGHT_COLORS = mapOf(
            "highlight0" to Color(0x8c, 0x00, 0xff, 0x86),  // Purple (same as pendingModification0)
            "highlight1" to Color(0xff, 0x00, 0x9d, 0x7e),  // Pink-purple (same as pendingModification1)
            null to Color(0x8c, 0x00, 0xff, 0x86)  // Default to purple
        )
    }

    override fun executionMode(): ExecutionMode {
        return ExecutionMode.BACKGROUND
    }

    override fun execute(context: CommandContext): String {
        // Clear existing highlights for this highlightId and editor
        val key = Pair(highlightId, editor)
        val existingHighlights = activeHighlights[key]
        
        ApplicationManager.getApplication().invokeAndWait {
            // Remove existing highlights
            existingHighlights?.forEach { highlighter ->
                if (!editor.isDisposed) {
                    editor.markupModel.removeHighlighter(highlighter)
                    highlighter.dispose()
                }
            }
            
            // If ranges is empty, just clear highlights (user said "highlight nothing")
            if (ranges.isEmpty()) {
                activeHighlights.remove(key)
                return@invokeAndWait
            }
            
            // Add new highlights
            val newHighlighters = mutableListOf<RangeHighlighter>()
            val textAttributes = TextAttributes()
            textAttributes.backgroundColor = HIGHLIGHT_COLORS[highlightId] ?: HIGHLIGHT_COLORS[null]
            
            ranges.forEach { range ->
                when (range) {
                    is CursorlessLineRange -> {
                        val startOffset = editor.document.getLineStartOffset(range.start)
                        val endOffset = editor.document.getLineEndOffset(range.end)
                        val highlighter = editor.markupModel.addRangeHighlighter(
                            startOffset,
                            endOffset,
                            HighlighterLayer.SELECTION - 1,  // Slightly below selection layer
                            textAttributes,
                            HighlighterTargetArea.LINES_IN_RANGE
                        )
                        newHighlighters.add(highlighter)
                    }
                    
                    is CursorlessCharacterRange -> {
                        val startOffset = editor.document.getLineStartOffset(range.start.line) + range.start.character
                        val endOffset = editor.document.getLineStartOffset(range.end.line) + range.end.character
                        val highlighter = editor.markupModel.addRangeHighlighter(
                            startOffset,
                            endOffset,
                            HighlighterLayer.SELECTION - 1,  // Slightly below selection layer
                            textAttributes,
                            HighlighterTargetArea.EXACT_RANGE
                        )
                        newHighlighters.add(highlighter)
                    }
                }
            }
            
            activeHighlights[key] = newHighlighters
        }
        
        return "OK"
    }
}