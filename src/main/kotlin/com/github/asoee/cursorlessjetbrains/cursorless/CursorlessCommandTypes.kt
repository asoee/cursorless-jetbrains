package com.github.asoee.cursorlessjetbrains.cursorless

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable


@Serializable
data class CommandV7(
    val version: Int = 7,
    val spokenFormat: String?,
    val usePrePhraseSnapshot: Boolean,
    val action: ActionDescriptor
)

@Serializable
sealed interface ActionDescriptor

typealias SimpleActionName = String
const val setSelection: SimpleActionName = "setSelection"
const val revealTypeDefinition: SimpleActionName = "revealTypeDefinition"

@Serializable
data class SimpleActionDescriptor(
    val name: SimpleActionName,
    val target: PartialTargetDescriptor
) : ActionDescriptor

typealias BringMoveActionName = String
val replaceWithTarget: BringMoveActionName = "replaceWithTarget"
val moveToTarget: BringMoveActionName = "moveToTarget"


@Serializable()
data class BringMoveActionDescriptor (
    val name: BringMoveActionName,
    val source: PartialTargetDescriptor,
    val destination: DestinationDescriptor
): ActionDescriptor


@Serializable
sealed interface PartialTargetDescriptor

@Serializable()
@SerialName("primitive")
data class PartialPrimitiveTargetDescriptor(
    val mark: PartialMark
) : PartialTargetDescriptor {
//    val modifiers: Modifier[]?;
}

@Serializable
sealed interface PartialMark

@Serializable
@SerialName("decoratedSymbol")
data class DecoratedSymbolMark(
    val symbolColor: String,
    val character: String
) : PartialMark

@Serializable
sealed interface DestinationDescriptor

@Serializable
@SerialName("implicit")
data class ImplicitDestinationDescriptor(val implicit: Boolean = true): DestinationDescriptor

typealias InsertionMode = String
val before: InsertionMode = "before"
val after: InsertionMode = "after"
val to: InsertionMode = "to"

@Serializable
@SerialName("primitive")
data class PrimitiveDestinationDescriptor(
    val insertionMode: InsertionMode,
    val target: PartialTargetDescriptor
): DestinationDescriptor {
}

