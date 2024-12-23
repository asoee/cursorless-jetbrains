package com.github.asoee.cursorlessjetbrains.commands

import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessFlashRange
import com.github.asoee.cursorlessjetbrains.cursorless.FlashCharacterRange
import com.github.asoee.cursorlessjetbrains.cursorless.FlashLineRange
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
import java.util.Collections.unmodifiableMap


private const val FLASH_DURATION_MILLIS = 100L

private const val STYLE_REFERENCE = "reference"

private val COLOR_MAP: Map<String, Color> = unmodifiableMap(
    mapOf(
        STYLE_REFERENCE to parseHexColor("#00a2ff4d"),
        "justAdded" to parseHexColor("#09ff005b"),
        "pendingDelete" to parseHexColor("#ff00008a"),
        "pendingModification0" to parseHexColor("#8c00ff86"),
        "pendingModification1" to parseHexColor("#ff009d7e"),
        "highlight0" to parseHexColor("#d449ff42"),
        "highlight1" to parseHexColor("#60daff7a"),
    )
)

private fun parseHexColor(hexString: String): Color {
    if (hexString.length == 7 && hexString[0] == '#') {
        return Color.decode(hexString)
    } else if (hexString.length == 9 && hexString[0] == '#') {
        val rgbPart = hexString.substring(0, 7)
        val baseColor = Color.decode(rgbPart)
        val alphaPart = hexString.substring(7)
        val alpha = Integer.parseInt(alphaPart, 16)
        return Color(baseColor.red, baseColor.green, baseColor.blue, alpha)
    } else {
        throw IllegalArgumentException("Invalid hex color string: $hexString")
    }
}

class HighligthRangeCommand(project: Project, val rangesByEditor: Map<Editor?, List<CursorlessFlashRange>>) :
    VcCommand(project) {

    override fun executionMode(): ExecutionMode {
        return ExecutionMode.BACKGROUND
    }

    override fun execute(context: CommandContext): String {

        val flashDuration: Long = TalonSettings.instance.state.flashRangeDuration.toLong()

        val highlightsByEditor: MutableMap<Editor, List<RangeHighlighter?>> = mutableMapOf()
        ApplicationManager.getApplication().invokeAndWait {
            rangesByEditor.forEach({ (editor, flashRanges) ->
                if (editor == null || editor.isDisposed) {
                    return@forEach
                }
                val textAttributes = TextAttributes()
                val markupModel = editor.markupModel
                val rangeHighlighters = flashRanges.map { flashRange ->
                    textAttributes.backgroundColor = colorForStyle(flashRange)
                    if (flashRange.range is FlashLineRange) {
                        val lineRange: FlashLineRange = flashRange.range
                        val startOffset = editor.document.getLineStartOffset(lineRange.start)
                        val endOffset = editor.document.getLineEndOffset(lineRange.end)
                        markupModel.addRangeHighlighter(
                            startOffset,
                            endOffset,
                            HighlighterLayer.SELECTION,
                            textAttributes,
                            HighlighterTargetArea.LINES_IN_RANGE
                        )
                    } else if (flashRange.range is FlashCharacterRange) {
                        val characterRange = flashRange.range as FlashCharacterRange
                        val startOffset =
                            editor.document.getLineStartOffset(characterRange.start.line) + characterRange.start.character
                        val endOffset =
                            editor.document.getLineStartOffset(characterRange.end.line) + characterRange.end.character
                        markupModel.addRangeHighlighter(
                            startOffset,
                            endOffset,
                            HighlighterLayer.SELECTION,
                            textAttributes,
                            HighlighterTargetArea.EXACT_RANGE
                        )
                    } else {
                        null
                    }
                }
                highlightsByEditor[editor] = rangeHighlighters
            })
        }

        runBlocking {
            delay(flashDuration)
        }

        ApplicationManager.getApplication().invokeAndWait {
            highlightsByEditor.forEach({ (editor, highlighters) ->
                highlighters.forEach {
                    it?.let {
                        editor.markupModel.removeHighlighter(it)
                        it.dispose()
                    }
                }
            })
        }

        return "OK"
    }

    private fun colorForStyle(flashRange: CursorlessFlashRange) =
        COLOR_MAP[flashRange.style] ?: COLOR_MAP[STYLE_REFERENCE]
}
