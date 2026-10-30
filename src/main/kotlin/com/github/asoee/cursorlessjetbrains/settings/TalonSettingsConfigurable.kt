package com.github.asoee.cursorlessjetbrains.settings

import com.intellij.openapi.application.ApplicationBundle
import com.intellij.openapi.components.service
import com.intellij.openapi.options.BoundConfigurable
import com.intellij.openapi.ui.DialogPanel
import com.intellij.ui.dsl.builder.*


/**
 * Provides controller functionality for application settings.
 */
private const val ID = "com.github.asoee.cursorlessjetbrains.settings.TalonSettingsConfigurable"

private const val DISPLAY_NAME = "Talon / Cursorless"

internal class TalonSettingsConfigurable : BoundConfigurable(DISPLAY_NAME, ID) {

    private val shapeSettingsModel = ShapesTableModel()
    private val colorSettingsModel = ColorTableModel()

    override fun createPanel(): DialogPanel {

        val settings = TalonSettings.instance

        val shapeSettingsTable = ShapeSettingsTable(shapeSettingsModel)
        val colorSettingsTable = ColorSettingsTable(colorSettingsModel)

        return panel {
            group("General") {
                row {
                    checkBox("Enable Cursorless hats")
                        .bindSelected(settings.state::enableHats)
                }
                row {
                    label("Hats vertical offset")
                    intTextField((-100..100), 1)
                        .bindIntText(settings.state::hatVerticalOffset)
                        .columns(4)
                        .gap(RightGap.SMALL)
                    @Suppress("DialogTitleCapitalization")
                    label("pixels")
                }
                row {
                    label("Hats scale factor")
                    intTextField((0..500), 5)
                        .bindIntText(settings.state::hatScaleFactor)
                        .columns(4)
                        .gap(RightGap.SMALL)
                    @Suppress("DialogTitleCapitalization")
                    label("percent")
                }
                row {
                    label("Flash range duration")
                    intTextField((1..5000), 50)
                        .bindIntText(settings.state::flashRangeDuration)
                        .columns(4)
//                    .enabledIf(model.enableHats)
                        .gap(RightGap.SMALL)
                    @Suppress("DialogTitleCapitalization")
                    label(ApplicationBundle.message("editbox.ms"))

                }
                row {
                    label("Maximum file size")
                    intTextField((64..10240), 64)
                        .bindIntText(settings.state::maxFileSizeKb)
                        .columns(6)
                        .gap(RightGap.SMALL)
                    @Suppress("DialogTitleCapitalization")
                    label("KB")
                        .comment("Files larger than this will not be sent to Cursorless to prevent engine overload")
                }
            }
            group("Hat sync") {
                row {
                    checkBox("Sync hat colors and shapes from VS Code's settings.json")
                        .bindSelected(settings.state::syncHatsFromVscode)
                        .comment("Keeps the hats drawn here in step with the hats Talon recognizes: cursorless.hatEnablement and cursorless.hatPenalties")
                }
            }
            group("Command history") {
                row {
                    checkBox("Record command history")
                        .bindSelected(settings.state::commandHistory)
                        .comment("Saves each command (without its spoken form or text) to ~/.cursorless/commandHistory, as VS Code's cursorless.commandHistory does, for \"cursorless stats\"")
                }
            }
            group("Troubleshooting") {
                row {
                    checkBox("Debug logging")
                        .bindSelected(settings.state::debugLogging)
                        .comment("Writes the engine's debug messages to idea.log, such as why a tutorial step says you've stepped off the path, as VS Code's cursorless.debug does")
                }
            }
            group("Colors") {
                row {
                    label("Color settings")
                }
                row {
                    cell(colorSettingsTable)
                        .align(Align.FILL)
                        .bind(
                            { table -> table.getValue() },
                            { table, value -> table.setValue(value) },
                            settings.state::hatColorSettings.toMutableProperty()
                        )
                }
            }
            group("Shapes") {
                row {
                    label("Shape settings")
                        .comment(
                            "Talon only recognizes the hats enabled in VS Code's settings.json (cursorless.hatEnablement). " +
                                    "With syncing on, changes made here are replaced the next time that file changes or the IDE restarts."
                        )
                }
                row {
                    cell(shapeSettingsTable)
                        .align(Align.FILL)
                        .bind(
                            ::getShapeSettings,
                            ::setShapeSettings,
                            settings.state::hatShapeSettings.toMutableProperty()
                        )
                }
            }
        }

    }

    fun getShapeSettings(tableComponent: ShapeSettingsTable): List<TalonSettings.ShapeSetting> {
        return tableComponent.getValue()
    }

    fun setShapeSettings(tableComponent: ShapeSettingsTable, settings: List<TalonSettings.ShapeSetting>) {
        return tableComponent.setValue(settings)
    }

    override fun apply() {
        val settings = TalonSettings.instance
        val wasSyncing = settings.state.syncHatsFromVscode
        super.apply()

        settings.fireSettingsChanged()
        // Sync straight away only when syncing was just turned on: otherwise every Apply would replace the hat
        // changes made here within seconds, rather than when settings.json next changes
        if (settings.state.syncHatsFromVscode && !wasSyncing) {
            service<VscodeHatSync>().resync()
        }
    }
}