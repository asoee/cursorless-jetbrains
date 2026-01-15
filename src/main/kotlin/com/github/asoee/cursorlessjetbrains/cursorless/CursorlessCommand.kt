package com.github.asoee.cursorlessjetbrains.cursorless


class CursorlessCommand(val command: String, val target: CursorlessTarget) {


    companion object {
        fun actionNameFromSpokenForm(spokenform: String): String {
            return when {
                spokenform.startsWith("take") -> "setSelection"
                spokenform.startsWith("type deaf") -> "revealTypeDefinition"
                spokenform.startsWith("follow") -> "followLink"
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

        fun follow(source: CursorlessTarget): CommandV7 {
            return CommandV7(
                version = 7,
                spokenFormat = "follow " + source.spokenForm(),
                usePrePhraseSnapshot = false,
                action = FollowLinkActionDescriptor(
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

        fun sourceTarget(source: CursorlessTarget): PartialPrimitiveTargetDescriptor {
            return PartialPrimitiveTargetDescriptor(
                mark = DecoratedSymbolMark(
                    symbolColor = source.color,
                    character = source.letter
                )
            )
        }

        fun destTarget(mode: InsertionMode, target: CursorlessTarget): DestinationDescriptor {
            return PrimitiveDestinationDescriptor(
                insertionMode = mode,
                target = PartialPrimitiveTargetDescriptor(
                    mark = DecoratedSymbolMark(
                        symbolColor = target.color,
                        character = target.letter
                    )
                )
            )
        }

        fun bring(
            source: PartialPrimitiveTargetDescriptor,
            destination: DestinationDescriptor,
            spokenform: String
        ): CommandV7 {
            return CommandV7(
                version = 7,
                spokenFormat = "bring " + spokenform,
                usePrePhraseSnapshot = false,
                action = ReplaceWithTargetActionDescriptor(
                    source = source,
                    destination = destination
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

        fun change(source: CursorlessTarget): CommandV7 {
            return CommandV7(
                version = 7,
                spokenFormat = "change " + source.spokenForm(),
                usePrePhraseSnapshot = false,
                action = ClearAndSetSelectionActionDescriptor(
                    target = PartialPrimitiveTargetDescriptor(
                        mark = DecoratedSymbolMark(
                            symbolColor = source.color,
                            character = source.letter,
                        ),
                        modifiers = emptyList()
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

        fun wrapWithSnippet(source: CursorlessTarget, spokenForm: String = "if wrap"): CommandV7 {
            return CommandV7(
                version = 7,
                spokenFormat = "$spokenForm ${source.spokenForm()}",
                usePrePhraseSnapshot = false,
                action = WrapWithSnippetActionDescriptor(
                    target = PartialPrimitiveTargetDescriptor(
                        mark = DecoratedSymbolMark(
                            symbolColor = source.color,
                            character = source.letter,
                        ),
                    ),
                    snippetDescription = SnippetDescription(
                        type = "list",
                        fallbackLanguage = "java",
                        snippets = listOf(
                            CustomSnippet(
                                type = "custom",
                                body = "if (\$1) {\n\t\$0\n}",
                                variableName = "0",
                                scopeType = SnippetScopeType(type = "statement"),
                                languages = listOf(
                                    "c",
                                    "cpp",
                                    "csharp",
                                    "java",
                                    "javascript",
                                    "typescript",
                                    "javascriptreact",
                                    "typescriptreact",
                                    "php",
                                    "scala",
                                    "kotlin",
                                    "r"
                                )
                            ),
                            CustomSnippet(
                                type = "custom",
                                body = "if \$1:\n\t\$0",
                                variableName = "0",
                                scopeType = SnippetScopeType(type = "statement"),
                                languages = listOf("python")
                            ),
                            CustomSnippet(
                                type = "custom",
                                body = "if \$1 then\n\t\$0\nend",
                                variableName = "0",
                                scopeType = SnippetScopeType(type = "statement"),
                                languages = listOf("lua")
                            ),
                            CustomSnippet(
                                type = "custom",
                                body = "if \$1\n\t\$0\nend",
                                variableName = "0",
                                scopeType = SnippetScopeType(type = "statement"),
                                languages = listOf("ruby")
                            ),
                            CustomSnippet(
                                type = "custom",
                                body = "if \$1\n\t\$0\nendif",
                                variableName = "0",
                                scopeType = SnippetScopeType(type = "statement"),
                                languages = listOf("vimscript")
                            ),
                            CustomSnippet(
                                type = "custom",
                                body = "if \$1 {\n\t\$0\n}",
                                variableName = "0",
                                scopeType = SnippetScopeType(type = "statement"),
                                languages = listOf("rust", "stata", "go")
                            ),
                            CustomSnippet(
                                type = "custom",
                                body = "if \$1 do\n\t\$0\nend",
                                variableName = "0",
                                scopeType = SnippetScopeType(type = "statement"),
                                languages = listOf("elixir")
                            )
                        )
                    )
                )
            )
        }
    }

    fun actionName(): String {
        return actionNameFromSpokenForm(command)
    }
}
