package com.github.asoee.cursorlessjetbrains.settings

import com.github.asoee.cursorlessjetbrains.cursorless.ALL_SHAPES
import javax.swing.table.DefaultTableModel

private const val NAME_COLUMN = 0
private const val ENABLED_COLUMN = 1

class ShapesTableModel : DefaultTableModel(defaultDataModel(), columnNames) {

    companion object {
        private val columnNames = arrayOf("Shape", "Enabled")

        private fun defaultDataModel(): Array<Array<Any>> {
            return ALL_SHAPES.map {
                arrayOf<Any>(it, it == "default")
            }.toTypedArray()
        }
    }

    fun setShapeSetting(settings: List<TalonSettings.ShapeSetting>) {

        ALL_SHAPES.forEach { name ->
            val setting = settings.find { it.shapeName == name }
            setting?.let {
                dataVector.find { it[NAME_COLUMN] == name }?.let { row ->
                    row[ENABLED_COLUMN] = setting.enabled
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
                val penalty: Int = if (shapeName == "default") 0 else 1
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
            else -> String::class.java
        }
    }

    override fun isCellEditable(row: Int, column: Int): Boolean {
        return column != NAME_COLUMN
    }
}