package com.github.asoee.cursorlessjetbrains.settings

import com.github.asoee.cursorlessjetbrains.cursorless.ALL_COLORS
import com.github.asoee.cursorlessjetbrains.cursorless.DEFAULT_COLORS
import com.github.asoee.cursorlessjetbrains.cursorless.DEFAULT_ENABLED_COLORS
import com.github.asoee.cursorlessjetbrains.settings.ColorSettingsTable.Companion.ENABLED_COLUMN
import com.github.asoee.cursorlessjetbrains.settings.ColorSettingsTable.Companion.NAME_COLUMN
import com.github.asoee.cursorlessjetbrains.settings.ColorSettingsTable.Companion.DARK_COLUMN
import com.github.asoee.cursorlessjetbrains.settings.ColorSettingsTable.Companion.LIGHT_COLUMN
import com.github.asoee.cursorlessjetbrains.settings.ColorSettingsTable.Companion.PENALTY_COLUMN
import java.awt.Color
import javax.swing.table.DefaultTableModel



class ColorTableModel : DefaultTableModel(defaultDataModel(), columnNames) {

    companion object {
        private val columnNames = arrayOf("Color", "Enabled", "Dark", "Light", "Penalty")

        private fun defaultDataModel(): Array<Array<Any>> {
            return ALL_COLORS.map {
                arrayOf<Any>(
                    it,  // name
                    it == "default", // enabled
                    Color.decode(DEFAULT_COLORS["dark"]!!["default"]), // dark
                    Color.decode(DEFAULT_COLORS["light"]!!["default"]), // light
                    0 // penalty
                )
            }.toTypedArray()
        }
    }

    fun setColorSetting(settings: List<TalonSettings.ColorSetting>) {

        ALL_COLORS.forEach { name ->
            val setting = settings.find { it.colorName == name }
            if  (setting != null) {
                dataVector.find { it[NAME_COLUMN] == name }?.let { row ->
                    row[ENABLED_COLUMN] = setting.enabled
                    row[DARK_COLUMN] = setting.dark
                    row[LIGHT_COLUMN] = setting.light
                    row[PENALTY_COLUMN] = setting.penalty
                }
            } else {
                dataVector.find { it[NAME_COLUMN] == name }?.let { row ->
                    row[ENABLED_COLUMN] = DEFAULT_ENABLED_COLORS.contains(name)
                    row[DARK_COLUMN] = Color.decode(DEFAULT_COLORS["dark"]?.get(name)?: "#000000")
                    row[LIGHT_COLUMN] = Color.decode(DEFAULT_COLORS["light"]?.get(name)?: "#000000")
                    row[PENALTY_COLUMN] = if (name == "default") 0 else 1
                }
            }
        }
        fireTableDataChanged()
    }


    fun getColorSettings(): List<TalonSettings.ColorSetting> {
        return ALL_COLORS.mapNotNull { name ->
            dataVector.find { it[NAME_COLUMN] == name }?.let { row ->
                val colorName = row[NAME_COLUMN] as String
                val enabled = row[ENABLED_COLUMN] as Boolean
                val dark = row[DARK_COLUMN] as Color
                val light = row[LIGHT_COLUMN] as Color
                val penalty: Int =  row[PENALTY_COLUMN] as Int
                TalonSettings.ColorSetting(
                    colorName = colorName,
                    enabled = enabled,
                    dark = dark,
                    light = light,
                    penalty = penalty
                )
            }
        }
    }

    override fun getColumnClass(columnIndex: Int): Class<*> {
        return when (columnIndex) {
            ENABLED_COLUMN -> Boolean::class.java
            DARK_COLUMN -> Color::class.java
            LIGHT_COLUMN -> Color::class.java
            PENALTY_COLUMN -> Number::class.java
            else -> String::class.java
        }
    }

    override fun isCellEditable(row: Int, column: Int): Boolean {
        return column != NAME_COLUMN
    }
}