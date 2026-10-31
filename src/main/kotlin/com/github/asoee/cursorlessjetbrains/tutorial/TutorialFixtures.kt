package com.github.asoee.cursorlessjetbrains.tutorial

import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import org.yaml.snakeyaml.LoaderOptions
import org.yaml.snakeyaml.Yaml
import org.yaml.snakeyaml.constructor.SafeConstructor

/**
 * The tutorials' recorded fixtures (upstream resources/fixtures/recorded/tutorial), bundled as resources. The engine
 * has no YAML parser, so they go to it as JSON.
 */
object TutorialFixtures {

    private val namePattern = Regex("[A-Za-z0-9_-]+(\\.yml)?")

    fun readAsJson(tutorialId: String, fixtureName: String): String {
        require(namePattern.matches(tutorialId) && namePattern.matches(fixtureName)) {
            "Bad tutorial fixture: $tutorialId/$fixtureName"
        }
        val yaml = javaClass.getResource("/cursorless/tutorial/$tutorialId/$fixtureName")?.readText()
            ?: throw IllegalArgumentException("No tutorial fixture $tutorialId/$fixtureName")
        return toJson(Yaml(SafeConstructor(LoaderOptions())).load(yaml)).toString()
    }

    internal fun toJson(value: Any?): JsonElement = when (value) {
        null -> JsonNull
        is Map<*, *> -> JsonObject(value.entries.associate { (key, item) -> key.toString() to toJson(item) })
        is List<*> -> JsonArray(value.map(::toJson))
        is Boolean -> JsonPrimitive(value)
        is Number -> JsonPrimitive(value)
        else -> JsonPrimitive(value.toString())
    }
}
