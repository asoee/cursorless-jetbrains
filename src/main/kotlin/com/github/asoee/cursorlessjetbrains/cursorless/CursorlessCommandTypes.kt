@file:OptIn(ExperimentalSerializationApi::class)

package com.github.asoee.cursorlessjetbrains.cursorless

import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonClassDiscriminator


@Serializable
data class CommandV7(
    val version: Int,
    val spokenFormat: String?,
    val usePrePhraseSnapshot: Boolean,
    val action: ActionDescriptor
)

@Serializable
@JsonClassDiscriminator("name")
sealed interface ActionDescriptor

@Serializable
sealed class SimpleActionDescriptor : ActionDescriptor {
    abstract val target: PartialTargetDescriptor
}

@Serializable
@SerialName("setSelection")
class SetSelectionActionDescriptor(
    override val target: PartialTargetDescriptor,
) : SimpleActionDescriptor()

@Serializable
@SerialName("revealTypeDefinition")
class RevealTypeDefinitionActionDescriptor(
    override val target: PartialTargetDescriptor,
) : SimpleActionDescriptor()

@Serializable
@SerialName("followLink")
class FollowLinkActionDescriptor(
    override val target: PartialTargetDescriptor,
) : SimpleActionDescriptor()

@Serializable
@SerialName("clearAndSetSelection")
class ClearAndSetSelectionActionDescriptor(
    override val target: PartialTargetDescriptor,
) : SimpleActionDescriptor()

@Serializable
@SerialName("editNewLineBefore")
class EditNewLineBeforeActionDescriptor(
    override val target: PartialTargetDescriptor,
) : SimpleActionDescriptor()


@Serializable
@SerialName("editNewLineAfter")
class EditNewLineAfterActionDescriptor(
    override val target: PartialTargetDescriptor,
) : SimpleActionDescriptor()

@Serializable
@SerialName("wrapWithSnippet")
class WrapWithSnippetActionDescriptor(
    val target: PartialTargetDescriptor,
    val snippetDescription: SnippetDescription,
) : ActionDescriptor

@Serializable
data class SnippetDescription(
    val type: String,
    val fallbackLanguage: String? = null,
    val body: String? = null,
    val snippets: List<CustomSnippet>? = null
)

@Serializable
data class CustomSnippet(
    val type: String,
    val body: String,
    val variableName: String? = null,
    val scopeType: SnippetScopeType? = null,
    val languages: List<String>? = null
)

@Serializable
data class SnippetScopeType(
    val type: String
)

@Serializable
@SerialName("getText")
class GetTextActionDescriptor(
    val target: PartialTargetDescriptor,
    val options: GetTextActionOptions?,
) : ActionDescriptor

@Serializable
@SerialName("GetTextActionOptions")
class GetTextActionOptions(
    val showDecorations: Boolean?,
    val ensureSingleTarget: Boolean?,
)


@Serializable
sealed class BringMoveActionDescriptor : ActionDescriptor {
    abstract val source: PartialTargetDescriptor
    abstract val destination: DestinationDescriptor
}

@Serializable
@SerialName("replaceWithTarget")
class ReplaceWithTargetActionDescriptor(
    override val source: PartialTargetDescriptor,
    override val destination: DestinationDescriptor
) : BringMoveActionDescriptor()

@Serializable
@SerialName("moveToTarget")
class MoveToTargetActionDescriptor(
    override val source: PartialTargetDescriptor,
    override val destination: DestinationDescriptor
) : BringMoveActionDescriptor()

@Serializable
sealed interface PartialTargetDescriptor

@Serializable
@SerialName("primitive")
data class PartialPrimitiveTargetDescriptor(
    val mark: PartialMark,
    val modifiers: List<Modifier> = emptyList()
) : PartialTargetDescriptor

@Serializable
sealed interface PartialMark

@Serializable
@SerialName("decoratedSymbol")
data class DecoratedSymbolMark(
    val symbolColor: String,
    val character: String,
) : PartialMark {
    override fun toString(): String {
        return "$symbolColor $character"
    }
}

@Serializable
@SerialName("that")
class ThatMark() : PartialMark

@Serializable
sealed interface DestinationDescriptor

@Serializable
@SerialName("implicit")
data class ImplicitDestinationDescriptor(val implicit: Boolean = true) : DestinationDescriptor

typealias InsertionMode = String

const val before: InsertionMode = "before"
const val after: InsertionMode = "after"
const val to: InsertionMode = "to"

@Serializable
@SerialName("primitive")
data class PrimitiveDestinationDescriptor(
    val insertionMode: InsertionMode,
    val target: PartialTargetDescriptor
) : DestinationDescriptor

@Serializable
sealed interface Modifier

@Serializable
sealed interface ScopeType

@Serializable
@SerialName("instance")
class ScopeTypeInstance : ScopeType

@Serializable
@SerialName("everyScope")
data class EveryScopeModifier(
    val scopeType: ScopeType,
) : Modifier

@Serializable
@SerialName("containingScope")
data class ContainingScopeModifier(
    val scopeType: ScopeType,
) : Modifier

@Serializable
@SerialName("namedFunction")
class ScopeTypeNamedFunction : ScopeType