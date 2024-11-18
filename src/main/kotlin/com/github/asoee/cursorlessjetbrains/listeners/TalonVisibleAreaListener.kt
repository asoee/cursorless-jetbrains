package com.github.asoee.cursorlessjetbrains.listeners

import com.intellij.openapi.editor.event.VisibleAreaEvent
import com.intellij.openapi.editor.event.VisibleAreaListener

class TalonVisibleAreaListener : VisibleAreaListener {
    override fun visibleAreaChanged(e: VisibleAreaEvent) {
//        markEditorChange("visible area listener -> visible area changed")
    }
}
