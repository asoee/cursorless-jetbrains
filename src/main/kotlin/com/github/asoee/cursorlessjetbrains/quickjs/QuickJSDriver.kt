package com.github.asoee.cursorlessjetbrains.quickjs

import com.dokar.quickjs.QuickJs
import com.dokar.quickjs.binding.JsObject
import com.dokar.quickjs.binding.define
import com.dokar.quickjs.binding.toJsObject
import com.dokar.quickjs.converter.JsObjectConverter
import com.github.asoee.cursorlessjetbrains.services.Console
import kotlinx.coroutines.Dispatchers
import kotlin.reflect.KType
import kotlin.reflect.typeOf

class QuickJSDriver() {

    data class GenericException(val message: String)

    // interface JsObjectConverter<T : Any?> : TypeConverter<JsObject, T>
    object GenericExceptionConverter : JsObjectConverter<GenericException> {
        override val targetType: KType = typeOf<GenericException>()

        override fun convertToTarget(value: JsObject): GenericException = GenericException(
            message = value["message"] as String,
        )

        override fun convertToSource(value: GenericException): JsObject =
            mapOf("message" to value.message).toJsObject()
    }


    private val quickJs : QuickJs

    init {
        println("ASOEE: QuickJSDriver created")
        quickJs = QuickJs.create(Dispatchers.Default)
        quickJs.define<Console>("console", Console())
        quickJs.addTypeConverters(GenericExceptionConverter)

    }

    suspend fun evaluate(js: String ) {
        quickJs.evaluate<Void>(code = js)
    }



}