package com.github.asoee.cursorlessjetbrains.vscode

import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

class VsCodeSettings(val rawSettings: JsonObject) {

    public fun enabledHatShapes(): List<String> {
        return getEnabledElements(rawSettings, "cursorless.hatEnablement.shapes")
    }

    fun getEnabledElements(jsonObject: JsonObject, key: String): List<String> {
        return (jsonObject[key]?.jsonObject?.entries?.filter {
            it.value.jsonPrimitive.boolean
        }?.map { entry ->
            entry.key
        }?.toList() ?: emptyList())
    }
}