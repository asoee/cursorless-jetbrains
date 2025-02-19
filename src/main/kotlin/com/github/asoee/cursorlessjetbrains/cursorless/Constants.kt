package com.github.asoee.cursorlessjetbrains.cursorless

// Default hat colors.
val DEFAULT_COLORS = mapOf(
    "light" to mapOf(
        "default" to "#757180",
        "blue" to "#089ad3",
        "green" to "#36B33F",
        "red" to "#E02D28",
        "pink" to "#e0679f",
        "yellow" to "#edb62b",
        "userColor1" to "#6a00ff",
        "userColor2" to "#ffd8b1"
    ),
    "dark" to mapOf(
        "default" to "#aaa7bb",
        "blue" to "#089ad3",
        "green" to "#36B33F",
        "red" to "#E02D28",
        "pink" to "#E06CAA",
        "yellow" to "#E5C02C",
        "userColor1" to "#6a00ff",
        "userColor2" to "#ffd8b1"
    )
)

val ALL_COLORS = listOf(
    "default",
    "blue",
    "green",
    "red",
    "pink",
    "yellow",
    "userColor1",
    "userColor2"
)

val DEFAULT_ENABLED_COLORS = listOf(
    "default",
    "blue",
    "green",
    "red",
    "pink",
    "yellow",
)

val ALL_SHAPES = listOf(
    "default",
    "bolt",
    "crosshairs",
    "curve",
    "ex",
    "eye",
    "fox",
    "frame",
    "hole",
    "play",
    "wing",
)
// Format of the vscode-hats.json file.
typealias HatsFormat = HashMap<String, ArrayList<CursorlessRange>>

// Format of the colors.json.
typealias ColorsFormat = HashMap<String, HashMap<String, String>>
