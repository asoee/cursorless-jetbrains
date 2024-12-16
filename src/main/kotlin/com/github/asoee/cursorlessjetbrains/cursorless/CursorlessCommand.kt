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

        fun bringImplicit(source: CursorlessTarget): CommandV7 {
            return CommandV7(
                spokenFormat = "bring " + source.spokenForm(),
                usePrePhraseSnapshot = false,
                action = BringMoveActionDescriptor(
                    name = replaceWithTarget,
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
                spokenFormat = "change every instance " + source.spokenForm(),
                usePrePhraseSnapshot = false,
                action = SimpleActionDescriptor(
                    name = clearAndSetSelection,
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

    }

    fun actionName(): String {
        return actionNameFromSpokenForm(command)
    }
}
