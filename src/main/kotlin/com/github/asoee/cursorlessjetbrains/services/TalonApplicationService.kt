package com.github.asoee.cursorlessjetbrains.services

import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessEngine
import com.github.asoee.cursorlessjetbrains.javet.JavetDriver
import com.github.asoee.cursorlessjetbrains.listeners.*
import com.intellij.openapi.Disposable
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.EditorFactory
import com.intellij.openapi.editor.ex.EditorEventMulticasterEx

class TalonApplicationService : Disposable {

    private val cursorWatchers = mutableMapOf<Editor, TalonCaretListener>()
    private val selectionListeners =
        mutableMapOf<Editor, TalonSelectionListener>()
    private val visibleAreaListeners =
        mutableMapOf<Editor, TalonVisibleAreaListener>()
    private val documentListeners =
        mutableMapOf<Editor, TalonDocumentListener>()

    public val editorManager: EditorManager
    public var jsDriver: JavetDriver


    private var focusChangeListener: TalonFocusChangeListener


    init {
        println("application service init")

        val driver = JavetDriver()
        driver.loadCursorless()
        this.jsDriver = driver
        val cursorlessEngine = CursorlessEngine(driver)
        this.editorManager = EditorManager(cursorlessEngine)
        this.focusChangeListener = TalonFocusChangeListener(editorManager)

        // Listening for window changes is necessary, since we don't seem to get them from Talon.

        // https://intellij-support.jetbrains.com/hc/en-us/community/posts/4578776718354-How-do-I-listen-for-editor-focus-events-
        val m = EditorFactory.getInstance()
            .eventMulticaster as EditorEventMulticasterEx;
        m.addFocusChangeListener(this.focusChangeListener, this)

    }

    fun editorCreated(e: Editor) {
        println("editor created...")

        editorManager.editorCreated(e)

        val cw = TalonCaretListener(editorManager)
        e.caretModel.addCaretListener(cw)
        cursorWatchers[e] = cw

        val sl = TalonSelectionListener(editorManager)
        e.selectionModel.addSelectionListener(sl)
        selectionListeners[e] = sl

        val visibleAreaListener = TalonVisibleAreaListener(editorManager)
        e.scrollingModel.addVisibleAreaListener(visibleAreaListener)
        visibleAreaListeners[e] = visibleAreaListener

        val dl = TalonDocumentListener(editorManager)
        e.document.addDocumentListener(dl)
        documentListeners[e] = dl
    }

    fun rebindListeners() {
        println("rebinding listeners...")
        EditorFactory.getInstance().allEditors.forEach { e ->
            println("hi $e")
            this.editorCreated(e)
        }
//        ProjectManager.getInstance().openProjects.forEach { proj ->
//            println("project: ${proj} ${FileEditorManager.getInstance(proj).allEditors.size}")
//            FileEditorManager.getInstance(proj).allEditors.forEach { editor ->
//                run {
//                    println("editor: ${editor.edit}")
//
//                    this.editorCreated(editor.)
//                }
//            }
//        }
    }

    override fun dispose() {
        println("PHIL: disposing")
//        unlinkStateFile()
//        quickJs.close()

        println("PHIL: unhooking listeners")
        cursorWatchers.forEach { (e, l) -> e.caretModel.removeCaretListener(l) }
        selectionListeners.forEach { (e, l) ->
            e.selectionModel.removeSelectionListener(
                l
            )
        }
        visibleAreaListeners.forEach { (e, l) ->
            e.scrollingModel.removeVisibleAreaListener(
                l
            )
        }
        documentListeners.forEach { (e, l) ->
            e.document.removeDocumentListener(
                l
            )
        }

    }
}
