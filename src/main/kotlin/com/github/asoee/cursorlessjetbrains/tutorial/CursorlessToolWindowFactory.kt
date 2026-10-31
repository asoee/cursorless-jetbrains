package com.github.asoee.cursorlessjetbrains.tutorial

import com.github.asoee.cursorlessjetbrains.commands.CommandExecutorService
import com.github.asoee.cursorlessjetbrains.commands.TutorialCommand
import com.github.asoee.cursorlessjetbrains.scopes.CursorlessScopeList
import com.github.asoee.cursorlessjetbrains.scopes.ScopeListPanel
import com.intellij.ide.ui.LafManagerListener
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.service
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.project.DumbAware
import com.intellij.openapi.project.Project
import com.intellij.openapi.util.Disposer
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.openapi.wm.ToolWindowManager
import com.intellij.openapi.wm.ex.ToolWindowManagerListener
import com.intellij.ui.JBColor
import com.intellij.ui.components.JBLabel
import com.intellij.ui.content.Content
import com.intellij.ui.content.ContentFactory
import com.intellij.ui.content.ContentManagerEvent
import com.intellij.ui.content.ContentManagerListener
import com.intellij.ui.jcef.JBCefApp
import com.intellij.ui.jcef.JBCefBrowser
import com.intellij.ui.jcef.JBCefBrowserBase
import com.intellij.ui.jcef.JBCefJSQuery
import com.intellij.util.ui.JBUI
import com.intellij.util.ui.UIUtil
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.awt.Color
import javax.swing.SwingConstants
import javax.swing.SwingUtilities
import javax.swing.Timer

/**
 * The Cursorless tool window, VS Code's Cursorless sidebar: the tutorial and the Scopes list, each in a tab. The
 * tutorial is the VS Code extension's tutorial webview, bundled as-is, in JCEF. A small shim stands in for VS Code's
 * webview API: the page's messages come here, and tutorial states go back with window.postMessage.
 */
class CursorlessToolWindowFactory : ToolWindowFactory, DumbAware {

    override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
        val component = if (JBCefApp.isSupported()) {
            createBrowser(project, toolWindow).component
        } else {
            JBLabel("The Cursorless tutorial needs JCEF, which this IDE doesn't support", SwingConstants.CENTER)
        }
        val contentFactory = ContentFactory.getInstance()
        toolWindow.contentManager.addContent(contentFactory.createContent(component, CursorlessTutorial.TUTORIAL_TAB, false))
        val scopes = contentFactory.createContent(ScopeListPanel(project, toolWindow.disposable), SCOPES_TAB, false)
        toolWindow.contentManager.addContent(scopes)
        watchScopesVisibility(project, toolWindow, scopes)
    }

    /** The engine keeps the Scopes list up to date only while it's on screen */
    private fun watchScopesVisibility(project: Project, toolWindow: ToolWindow, scopes: Content) {
        val scopeList = project.service<CursorlessScopeList>()
        fun update() = scopeList.setVisible(toolWindow.isVisible && scopes.isSelected)

        toolWindow.contentManager.addContentManagerListener(object : ContentManagerListener {
            override fun selectionChanged(event: ContentManagerEvent) = update()
        })
        project.messageBus.connect(toolWindow.disposable)
            .subscribe(ToolWindowManagerListener.TOPIC, object : ToolWindowManagerListener {
                override fun stateChanged(toolWindowManager: ToolWindowManager) = update()
            })
        Disposer.register(toolWindow.disposable) { scopeList.setVisible(false) }
        update()
    }

    private fun createBrowser(project: Project, toolWindow: ToolWindow): JBCefBrowser {
        val browser = JBCefBrowser()
        Disposer.register(toolWindow.disposable, browser)
        val tutorial = project.service<CursorlessTutorial>()

        // JCEF's off-screen rendering can miss parts of a page change, leaving an earlier step's controls or text on
        // screen. Once the page has rendered the new state, have Chromium redraw all of it, then repaint
        val repaint = Timer(150) {
            browser.cefBrowser.invalidate()
            browser.component.repaint()
        }.apply { isRepeats = false }
        Disposer.register(browser) { repaint.stop() }

        fun postState(stateJson: String) {
            browser.cefBrowser.executeJavaScript("window.postMessage($stateJson, '*');", browser.cefBrowser.url, 0)
            SwingUtilities.invokeLater { repaint.restart() }
        }

        val query = JBCefJSQuery.create(browser as JBCefBrowserBase)
        Disposer.register(browser, query)
        query.addHandler { messageJson ->
            handleMessage(project, messageJson, ::postState)
            null
        }

        val removeListener = tutorial.addListener(::postState)
        Disposer.register(browser) { removeListener() }

        browser.loadHTML(html(query))
        // The page takes its colors from the IDE theme, so rebuild it when the theme changes
        ApplicationManager.getApplication().messageBus.connect(browser)
            .subscribe(LafManagerListener.TOPIC, LafManagerListener { browser.loadHTML(html(query)) })
        return browser
    }

    /** The webview's messages, as VS Code's tutorial view handles them */
    private fun handleMessage(project: Project, messageJson: String, postState: (String) -> Unit) {
        val message = runCatching { Json.parseToJsonElement(messageJson).jsonObject }.getOrNull() ?: return
        val command = when (message["type"]?.jsonPrimitive?.content) {
            "getInitialState" -> {
                postState(project.service<CursorlessTutorial>().stateJson)
                return
            }
            "start" -> TutorialCommand(project, "tutorialStart", message["tutorialId"]?.toString() ?: return)
            "list" -> TutorialCommand(project, "tutorialList")
            "previous" -> TutorialCommand(project, "tutorialPrevious")
            "next" -> TutorialCommand(project, "tutorialNext")
            else -> {
                thisLogger().warn("Unknown tutorial webview message: $messageJson")
                return
            }
        }
        ApplicationManager.getApplication().executeOnPooledThread {
            project.service<CommandExecutorService>().execute(command)
        }
    }

    private fun html(query: JBCefJSQuery): String {
        val script = resource("index.js")
        val style = resource("index.css")
        val font = UIUtil.getLabelFont()
        val link = css(JBUI.CurrentTheme.Link.Foreground.ENABLED)
        // The webview's stylesheet uses VS Code's theme variables; give them the IDE theme's colors
        val theme = """
            :root {
              --vscode-foreground: ${css(UIUtil.getLabelForeground())};
              --vscode-sideBar-background: ${css(JBUI.CurrentTheme.ToolWindow.background())};
              --vscode-textLink-activeForeground: $link;
              --vscode-walkthrough-stepTitle\.foreground: ${css(UIUtil.getLabelForeground())};
              --vscode-welcomePage-progress\.background: ${css(JBColor.border())};
              --vscode-welcomePage-progress\.foreground: $link;
            }
            /* VS Code adds these base styles to every webview, and the page relies on them */
            body {
              color: var(--vscode-foreground);
              background-color: var(--vscode-sideBar-background);
              font-family: ${JsonPrimitive(font.family)}, sans-serif;
              font-size: ${font.size}px;
            }
            a { color: var(--vscode-textLink-activeForeground); }
        """.trimIndent()
        val shim = """
            window.acquireVsCodeApi = () => ({
              postMessage: (message) => { const request = JSON.stringify(message); ${query.inject("request")} },
              getState: () => undefined,
              setState: () => {},
            });
        """.trimIndent()
        return "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><title>Cursorless tutorial</title>" +
            "<style>$style</style><style>$theme</style></head><body><div id=\"root\"></div>" +
            "<script>$shim</script><script>$script</script></body></html>"
    }

    private fun resource(name: String): String =
        javaClass.getResource("/cursorless/tutorial-webview/$name")?.readText()
            ?: throw IllegalStateException("Tutorial webview $name missing from the plugin")

    private fun css(color: Color) = "#%02x%02x%02x".format(color.red, color.green, color.blue)

    companion object {
        const val SCOPES_TAB = "Scopes"
    }
}
