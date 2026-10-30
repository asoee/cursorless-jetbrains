package com.github.asoee.cursorlessjetbrains.commands

import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessCharacterRange
import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessGeneralizedRange
import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessLineRange
import com.github.asoee.cursorlessjetbrains.settings.TalonSettings
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.markup.EffectType
import com.intellij.openapi.editor.markup.HighlighterLayer
import com.intellij.openapi.editor.markup.HighlighterTargetArea
import com.intellij.openapi.editor.markup.RangeHighlighter
import com.intellij.openapi.editor.markup.TextAttributes
import com.intellij.openapi.project.Project
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import com.intellij.ui.JBColor
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

        // Scope visualizer ("visualize funk"): VS Code's default colors, background plus a solid border
        private val SCOPE_VISUALIZER_COLORS = mapOf(
            "scopeVisualizer.domain" to Pair(
                Color(0x00, 0xe1, 0xff, 0x18),
                JBColor(Color(0x19, 0x17, 0x19, 0x84), Color(0xeb, 0xde, 0xec, 0x84))
            ),
            "scopeVisualizer.content" to Pair(Color(0xad, 0x00, 0xbc, 0x5b), Color(0xee, 0x00, 0xff, 0x78)),
            "scopeVisualizer.removal" to Pair(Color(0xff, 0x00, 0x00, 0x2d), Color(0xff, 0x00, 0x00, 0x78)),
            "scopeVisualizer.iteration" to Pair(Color(0x00, 0x72, 0x5f, 0x6c), Color(0x00, 0xff, 0xd5, 0x78)),
        )

        private fun textAttributesFor(highlightId: String?): TextAttributes {
            val textAttributes = TextAttributes()
            // A domain that equals its nested range is drawn in the nested range's colors
            val scopeColors = SCOPE_VISUALIZER_COLORS[highlightId?.removeSuffix(".equalsDomain")]
            if (scopeColors != null) {
                textAttributes.backgroundColor = scopeColors.first
                textAttributes.effectColor = scopeColors.second
                textAttributes.effectType = EffectType.BOXED
            } else {
                textAttributes.backgroundColor = HIGHLIGHT_COLORS[highlightId] ?: HIGHLIGHT_COLORS[null]
            }
            return textAttributes
        }
    }

    override fun executionMode(): ExecutionMode {
        return ExecutionMode.BACKGROUND
    }

    override fun execute(context: CommandContext): String {
        // Clear existing highlights for this highlightId and editor
        val key = Pair(highlightId, editor)

        // Queue rather than wait: this is called from inside the JS engine, which may be redrawing the scope
        // visualizer on a background thread while the UI thread waits to enter the engine. invokeLater keeps
        // updates in order, so a later clear still runs after an earlier draw.
        ApplicationManager.getApplication().invokeLater {
            val existingHighlights = activeHighlights[key]

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
                return@invokeLater
            }
            
            // Add new highlights
            val newHighlighters = mutableListOf<RangeHighlighter>()
            val textAttributes = textAttributesFor(highlightId)
            
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