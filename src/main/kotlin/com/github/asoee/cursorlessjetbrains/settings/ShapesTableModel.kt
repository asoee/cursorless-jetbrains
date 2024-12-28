package com.github.asoee.cursorlessjetbrains.settings

import com.github.asoee.cursorlessjetbrains.cursorless.ALL_SHAPES
import com.github.asoee.cursorlessjetbrains.settings.ShapeSettingsTable.Companion.ENABLED_COLUMN
import com.github.asoee.cursorlessjetbrains.settings.ShapeSettingsTable.Companion.NAME_COLUMN
import com.github.asoee.cursorlessjetbrains.settings.ShapeSettingsTable.Companion.PENALTY_COLUMN
import javax.swing.table.DefaultTableModel



class ShapesTableModel : DefaultTableModel(defaultDataModel(), columnNames) {

    companion object {
        private val columnNames = arrayOf("Shape", "Enabled", "Penalty")

        private fun defaultDataModel(): Array<Array<Any>> {
            return ALL_SHAPES.map { snapeName ->
                arrayOf<Any>(
                    snapeName,  // name
                    snapeName == "default", // enabled
                    if (snapeName == "default") 0 else 1 // penalty
                )
            }.toTypedArray()
        }
    }

    fun setShapeSetting(settings: List<TalonSettings.ShapeSetting>) {

        ALL_SHAPES.forEach { name ->
            val setting = settings.find { it.shapeName == name }
            setting?.let {
                dataVector.find { it[NAME_COLUMN] == name }?.let { row ->
                    row[ENABLED_COLUMN] = setting.enabled
                    row[PENALTY_COLUMN] = setting.penalty
                }
            }
        }
        fireTableDataChanged()
    }


    fun getShapeSettings(): List<TalonSettings.ShapeSetting> {
        return ALL_SHAPES.mapNotNull { name ->
            dataVector.find { it[NAME_COLUMN] == name }?.let { row ->
                val shapeName = row[NAME_COLUMN] as String
                val shapeEnabled = row[ENABLED_COLUMN] as Boolean
                val penalty: Int = row[PENALTY_COLUMN] as Int
                TalonSettings.ShapeSetting(
                    shapeName,
                    shapeEnabled,
                    penalty
                )
            }
        }
    }

    override fun getColumnClass(columnIndex: Int): Class<*> {
        return when (columnIndex) {
            ENABLED_COLUMN -> Boolean::class.java
            PENALTY_COLUMN -> Int::class.java
            else -> String::class.java
        }
    }

    override fun isCellEditable(row: Int, column: Int): Boolean {
        return column != NAME_COLUMN
    }
}