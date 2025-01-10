package com.github.asoee.cursorlessjetbrains.settings

import com.intellij.openapi.application.ApplicationBundle
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
                            "While you can enable or disable shapes here, it will only affect the drawing of the shapes." +
                                    "Until some changes are done to talon-cursorless, talon will only recognize commands with the shapes that are enabled in VS-Code."
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
        super.apply()

        val settings = TalonSettings.instance
        settings.fireSettingsChanged()
    }
}