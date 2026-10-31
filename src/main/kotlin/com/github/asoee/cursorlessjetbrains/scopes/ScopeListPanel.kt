package com.github.asoee.cursorlessjetbrains.scopes

import com.intellij.ide.BrowserUtil
import com.intellij.openapi.Disposable
import com.intellij.openapi.actionSystem.DefaultActionGroup
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.service
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.project.DumbAwareAction
import com.intellij.openapi.project.Project
import com.intellij.openapi.util.Disposer
import com.intellij.ui.ColoredTreeCellRenderer
import com.intellij.ui.PopupHandler
import com.intellij.ui.ScrollPaneFactory
import com.intellij.ui.SimpleTextAttributes
import com.intellij.ui.TreeSpeedSearch
import com.intellij.ui.treeStructure.Tree
import com.intellij.util.ui.EmptyIcon
import java.awt.BorderLayout
import java.awt.event.KeyAdapter
import java.awt.event.KeyEvent
import java.awt.event.MouseAdapter
import java.awt.event.MouseEvent
import javax.swing.Icon
import javax.swing.JPanel
import javax.swing.JTree
import javax.swing.SwingUtilities
import javax.swing.tree.DefaultMutableTreeNode
import javax.swing.tree.DefaultTreeModel
import javax.swing.tree.TreePath

/**
 * VS Code's "Scopes" view: the scope types present in the active editor, those its language supports but it doesn't
 * contain, and those it doesn't support, each with its spoken forms. Clicking one shows it in the scope visualizer, or
 * hides the visualizer if it's the one shown.
 */
class ScopeListPanel(private val project: Project, parent: Disposable) : JPanel(BorderLayout()) {

    private class Category(val support: String, val title: String, val description: String) {
        val node = DefaultMutableTreeNode(this)
    }

    private val categories = listOf(
        Category("present", "Present", "in active editor"),
        Category("supported", "Supported", "but not present in active editor"),
        Category("unsupported", "Unsupported", "unsupported in language of active editor"),
    )

    private val root = DefaultMutableTreeNode()
    private val model = DefaultTreeModel(root)
    private val tree = Tree(model)

    /** The active file's icon, for scopes specific to its language */
    private var languageIcon: Icon? = null

    private val scopeList = project.service<CursorlessScopeList>()

    init {
        categories.forEach { root.add(it.node) }
        model.reload()
        tree.isRootVisible = false
        tree.showsRootHandles = true
        tree.cellRenderer = Renderer()
        // As in VS Code, the first two groups start open and "Unsupported" closed
        categories.take(2).forEach { tree.expandPath(TreePath(it.node.path)) }
        TreeSpeedSearch.installOn(tree, false) { path -> (itemAt(path))?.let { "${it.label} ${it.name}" } ?: "" }

        tree.addMouseListener(object : MouseAdapter() {
            override fun mouseClicked(e: MouseEvent) {
                if (!SwingUtilities.isLeftMouseButton(e) || e.clickCount != 1) return
                val path = tree.getPathForLocation(e.x, e.y) ?: return
                itemAt(path)?.let { scopeList.toggle(it) }
            }
        })
        tree.addKeyListener(object : KeyAdapter() {
            override fun keyPressed(e: KeyEvent) {
                if (e.keyCode != KeyEvent.VK_ENTER) return
                tree.selectionPath?.let(::itemAt)?.let { scopeList.toggle(it) }
                e.consume()
            }
        })
        PopupHandler.installPopupMenu(tree, contextMenu(), "CursorlessScopeList")

        add(ScrollPaneFactory.createScrollPane(tree, true), BorderLayout.CENTER)

        val removeListener = scopeList.addListener { list ->
            ApplicationManager.getApplication().invokeLater({ show(list) }, project.disposed)
        }
        Disposer.register(parent) { removeListener() }
        show(scopeList.list)
    }

    /** The items in one group: "present", "supported" or "unsupported" */
    internal fun itemsIn(support: String): List<ScopeListItem> {
        val node = categories.first { it.support == support }.node
        return (0 until node.childCount).map { (node.getChildAt(it) as DefaultMutableTreeNode).userObject as ScopeListItem }
    }

    private fun itemAt(path: TreePath): ScopeListItem? =
        (path.lastPathComponent as? DefaultMutableTreeNode)?.userObject as? ScopeListItem

    private fun selectedItem(): ScopeListItem? = tree.selectionPath?.let(::itemAt)

    /** Rebuilds the groups, keeping which are open and which scope is selected */
    private fun show(list: ScopeList) {
        val expanded = categories.filter { tree.isExpanded(TreePath(it.node.path)) }
        val selectedScopeType = selectedItem()?.scopeType
        languageIcon = FileEditorManager.getInstance(project).selectedFiles.firstOrNull()?.fileType?.icon

        var selectedPath: TreePath? = null
        for (category in categories) {
            category.node.removeAllChildren()
            for (item in list.items.filter { it.support == category.support }) {
                val node = DefaultMutableTreeNode(item)
                category.node.add(node)
                if (item.scopeType == selectedScopeType) selectedPath = TreePath(node.path)
            }
        }
        model.reload()
        expanded.forEach { tree.expandPath(TreePath(it.node.path)) }
        selectedPath?.let { tree.selectionPath = it }
    }

    private fun contextMenu(): DefaultActionGroup {
        fun visualize(text: String, visualizationType: String) = DumbAwareAction.create(text) {
            selectedItem()?.let { scopeList.visualize(it, visualizationType) }
        }
        return DefaultActionGroup(
            visualize("Visualize", "content"),
            visualize("Visualize Removal", "removal"),
            visualize("Visualize Iteration", "iteration"),
            DumbAwareAction.create("Hide Visualizer") { scopeList.visualize(null, "content") },
            DumbAwareAction.create("Open Documentation") { selectedItem()?.let { BrowserUtil.browse(it.docsUrl) } },
        )
    }

    private inner class Renderer : ColoredTreeCellRenderer() {
        override fun customizeCellRenderer(
            tree: JTree, value: Any?, selected: Boolean, expanded: Boolean, leaf: Boolean, row: Int, hasFocus: Boolean,
        ) {
            when (val userObject = (value as? DefaultMutableTreeNode)?.userObject) {
                is Category -> {
                    append(userObject.title)
                    append("  ${userObject.description}", SimpleTextAttributes.GRAYED_ATTRIBUTES)
                }

                is ScopeListItem -> {
                    icon = if (userObject.isLanguageSpecific) languageIcon ?: EmptyIcon.ICON_16 else EmptyIcon.ICON_16
                    // VS Code highlights the scope the visualizer shows
                    append(
                        userObject.label,
                        if (userObject.isVisualized) VISUALIZED_ATTRIBUTES else SimpleTextAttributes.REGULAR_ATTRIBUTES,
                    )
                    val containment = when (userObject.containment) {
                        "exact" -> "🎯 "
                        "contains" -> "📦 "
                        else -> ""
                    }
                    append("  $containment${userObject.name}", SimpleTextAttributes.GRAYED_ATTRIBUTES)
                    toolTipText = when (userObject.unspokenReason) {
                        "requiresTalonUpdate" -> "No spoken form: this needs a newer version of Cursorless's Talon files"
                        "disabled" -> "No spoken form: it's turned off in your Talon settings"
                        else -> userObject.label
                    }
                }
            }
        }
    }

    companion object {
        private val VISUALIZED_ATTRIBUTES = SimpleTextAttributes(
            SimpleTextAttributes.STYLE_BOLD or SimpleTextAttributes.STYLE_SEARCH_MATCH, null,
        )
    }
}
