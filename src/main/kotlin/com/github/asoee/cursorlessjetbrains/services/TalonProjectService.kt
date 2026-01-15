package com.github.asoee.cursorlessjetbrains.services

import com.github.asoee.cursorlessjetbrains.cursorless.CursorlessEngine
import com.github.asoee.cursorlessjetbrains.javet.JavetDriver
import com.github.asoee.cursorlessjetbrains.javet.JavetDriverRestartListener
import com.github.asoee.cursorlessjetbrains.listeners.*
import com.github.asoee.cursorlessjetbrains.settings.TalonSettings
import com.intellij.openapi.Disposable
import com.intellij.openapi.components.Service
import com.intellij.openapi.diagnostic.logger
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.EditorFactory
import com.intellij.openapi.editor.ex.EditorEventMulticasterEx
import com.intellij.openapi.project.Project
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

@Service(Service.Level.PROJECT)
class TalonProjectService(private val project: Project, private val cs: CoroutineScope) : Disposable {

    var cursorlessEngine: CursorlessEngine
        get() {
            return field
        }
    private val cursorWatchers = mutableMapOf<Editor, TalonCaretListener>()
    private val selectionListeners =
        mutableMapOf<Editor, TalonSelectionListener>()
    private val visibleAreaListeners =
        mutableMapOf<Editor, TalonVisibleAreaListener>()
    private val documentListeners =
        mutableMapOf<Editor, TalonDocumentListener>()
    private val logger = logger<TalonProjectService>()

    val editorManager: EditorManager
    var jsDriver: JavetDriver


    private var focusChangeListener: TalonFocusChangeListener

    @Volatile
    private var isRestarting = false


    init {
        logger.info("TalonProjectService service init")

        val (driver, engine) = createV8EngineAndCursorless()
        this.jsDriver = driver
        this.cursorlessEngine = engine
        this.editorManager = EditorManager(cursorlessEngine, this, cs)
        this.focusChangeListener = TalonFocusChangeListener(editorManager, project)

        // https://intellij-support.jetbrains.com/hc/en-us/community/posts/4578776718354-How-do-I-listen-for-editor-focus-events-
        val m = EditorFactory.getInstance()
            .eventMulticaster as EditorEventMulticasterEx
        m.addFocusChangeListener(this.focusChangeListener, this)

        settingsUpdated(TalonSettings.instance.state)

        logger.info("reloading all")
        this.editorManager.reloadAllEditors()
        logger.info("reloaded all")
    }

    private fun createV8EngineAndCursorless(): Pair<JavetDriver, CursorlessEngine> {
        val driver = JavetDriver()

        driver.setRestartListener(object : JavetDriverRestartListener {
            override fun onRestartRequested(reason: String) {
                logger.error("V8 engine restart requested: $reason")
                cs.launch {
                    restartV8Engine(reason)
                }
            }
        })

        driver.loadCursorless()
        return Pair(driver, CursorlessEngine(driver))
    }

    fun onProjectOpened() {
        logger.info("TalonProjectService project opened")
    }

    fun editorCreated(e: Editor) {
        logger.info("editor created...")

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


    override fun dispose() {
        logger.info("Disposing TalonProjectService")
        jsDriver.close()

    }

    fun editorReleased(editor: Editor) {
        cursorWatchers[editor]?.let {
            editor.caretModel.removeCaretListener(it)
        }
        cursorWatchers.remove(editor)

        visibleAreaListeners[editor]?.let {
            thisLogger().info("removing visible area listener")
            editor.scrollingModel.removeVisibleAreaListener(it)
        }
        visibleAreaListeners.remove(editor)

        documentListeners[editor]?.let {
            editor.document.removeDocumentListener(it)
        }
        documentListeners.remove(editor)

        selectionListeners[editor]?.let {
            editor.selectionModel.removeSelectionListener(it)
        }
        selectionListeners.remove(editor)

        this.editorManager.editorClosed(editor)
    }

    fun settingsUpdated(settings: TalonSettings.State) {
        this.editorManager.settingsUpdated(settings)
        updateCursorlessEngineSettings(settings)
    }

    private fun updateCursorlessEngineSettings(settings: TalonSettings.State) {
        val enabledShapes = settings.hatShapeSettings
            .filter { it.enabled }
            .map { it.shapeName }
        cursorlessEngine.setEnabledHatShapes(enabledShapes)

        val shapePenalties = settings.hatShapeSettings
            .associate { it.shapeName to it.penalty }
        cursorlessEngine.setHatShapePenalties(shapePenalties)

        val enabledColors = settings.hatColorSettings
            .filter { it.enabled }
            .map { it.colorName }
        cursorlessEngine.setEnabledHatColors(enabledColors)

        val colorPenalties = settings.hatColorSettings
            .associate { it.colorName to it.penalty }
        cursorlessEngine.setHatColorPenalties(colorPenalties)
    }

    @Synchronized
    private fun restartV8Engine(reason: String) {
        if (isRestarting) {
            logger.warn("V8 engine restart already in progress, ignoring duplicate request")
            return
        }

        try {
            isRestarting = true
            logger.warn("Starting V8 engine restart due to: $reason")

            logger.info("Closing old V8 runtime...")
            jsDriver.close()

            logger.info("Creating new V8 runtime...")
            val (newDriver, newEngine) = createV8EngineAndCursorless()
            jsDriver = newDriver
            cursorlessEngine = newEngine

            editorManager.updateEngine(cursorlessEngine)

            settingsUpdated(TalonSettings.instance.state)

            logger.info("Reloading all editors after V8 restart...")
            editorManager.reloadAllEditors()

            logger.warn("V8 engine successfully restarted")
        } catch (e: Exception) {
            logger.error("Failed to restart V8 engine: ${e.message}", e)
        } finally {
            isRestarting = false
        }
    }

}
