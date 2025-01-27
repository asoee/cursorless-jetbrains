package com.github.asoee.cursorlessjetbrains.cursorless


class CursorlessCommand(val command: String, val target: CursorlessTarget) {


    companion object {
        fun actionNameFromSpokenForm(spokenform: String): String {
            return when {
                spokenform.startsWith("take") -> "setSelection"
                spokenform.startsWith("type deaf") -> "revealTypeDefinition"
                else -> "unknown"
            }
        }

        fun takeSingle(source: CursorlessTarget): CommandV7 {
            return CommandV7(
                version = 7,
                spokenFormat = "take " + source.spokenForm(),
                usePrePhraseSnapshot = false,
                action = SetSelectionActionDescriptor(
                    target = PartialPrimitiveTargetDescriptor(
                        mark = DecoratedSymbolMark(
                            symbolColor = source.color,
                            character = source.letter
                        )
                    )
                )
            )
        }
        fun getText(source: CursorlessTarget): CommandV7 {
            return CommandV7(
                version = 7,
                spokenFormat = "format title at " + source.spokenForm(),
                usePrePhraseSnapshot = false,
                action = GetTextActionDescriptor(
                    target = PartialPrimitiveTargetDescriptor(
                        mark = DecoratedSymbolMark(
                            symbolColor = source.color,
                            character = source.letter
                        )
                    ),
                    options = GetTextActionOptions(
                        showDecorations = false,
                        ensureSingleTarget = null
                    )
                )
            )
        }

        fun typeDeaf(source: CursorlessTarget): CommandV7 {
            return CommandV7(
                version = 7,
                spokenFormat = "type deaf " + source.spokenForm(),
                usePrePhraseSnapshot = false,
                action = RevealTypeDefinitionActionDescriptor(
                    target = PartialPrimitiveTargetDescriptor(
                        mark = DecoratedSymbolMark(
                            symbolColor = source.color,
                            character = source.letter
                        )
                    )
                )
            )
        }

        fun bringImplicit(source: CursorlessTarget): CommandV7 {
            return CommandV7(
                version = 7,
                spokenFormat = "bring " + source.spokenForm(),
                usePrePhraseSnapshot = false,
                action = ReplaceWithTargetActionDescriptor(
                    source = PartialPrimitiveTargetDescriptor(
                        mark = DecoratedSymbolMark(
                            symbolColor = source.color,
                            character = source.letter
                        )
                    ),
                    destination = ImplicitDestinationDescriptor()
                )
            )

        }

        fun changeEveryInstance(source: CursorlessTarget): CommandV7 {
            return CommandV7(
                version = 7,
                spokenFormat = "change every instance " + source.spokenForm(),
                usePrePhraseSnapshot = false,
                action = ClearAndSetSelectionActionDescriptor(
                    target = PartialPrimitiveTargetDescriptor(
                        mark = DecoratedSymbolMark(
                            symbolColor = source.color,
                            character = source.letter,
                        ),
                        modifiers = listOf(
                            EveryScopeModifier(
                                scopeType = ScopeTypeInstance()
                            )
                        )
                    )
                )
            )

        }

        fun drink(source: CursorlessTarget): CommandV7 {
            return CommandV7(
                version = 7,
                spokenFormat = "drink " + source.spokenForm(),
                usePrePhraseSnapshot = false,
                action = EditNewLineBeforeActionDescriptor(
                    target = PartialPrimitiveTargetDescriptor(
                        mark = DecoratedSymbolMark(
                            symbolColor = source.color,
                            character = source.letter,
                        ),
                    )
                )
            )
        }

        fun pour(source: CursorlessTarget): CommandV7 {
            return CommandV7(
                version = 7,
                spokenFormat = "pour " + source.spokenForm(),
                usePrePhraseSnapshot = false,
                action = EditNewLineAfterActionDescriptor(
                    target = PartialPrimitiveTargetDescriptor(
                        mark = DecoratedSymbolMark(
                            symbolColor = source.color,
                            character = source.letter,
                        ),
                    )
                )
            )
        }
    }

    fun actionName(): String {
        return actionNameFromSpokenForm(command)
    }
}
