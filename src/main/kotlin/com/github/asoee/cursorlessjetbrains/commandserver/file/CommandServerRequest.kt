package com.github.asoee.cursorlessjetbrains.commandserver.file

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationException
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.nullable
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive

@Serializable
data class CommandServerRequest(
    val commandId: String,
    @Serializable(with = MixedArgsSerializer::class)
    val args: List<String?>,
    val waitForFinish: Boolean,
    val returnCommandOutput: Boolean,
    val uuid: String,
)

object MixedArgsSerializer : KSerializer<List<String?>> {
    private val delegateSerializer = ListSerializer(String.serializer().nullable)
    override val descriptor: SerialDescriptor = delegateSerializer.descriptor

    override fun serialize(encoder: Encoder, value: List<String?>) {
        delegateSerializer.serialize(encoder, value)
    }

    override fun deserialize(decoder: Decoder): List<String?> {
        val jsonDecoder = decoder as? JsonDecoder ?: throw SerializationException("Expected JsonDecoder")
        val jsonArray = jsonDecoder.decodeJsonElement() as JsonArray

        return jsonArray.map { element ->
            when {
                element is JsonNull -> null
                element is JsonPrimitive && element.isString -> element.content
                element is JsonPrimitive -> element.toString()
                else -> element.toString()
            }
        }
    }
}
