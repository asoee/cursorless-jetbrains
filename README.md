# cursorless-jetbrains

![Build](https://github.com/asoee/cursorless-jetbrains/workflows/Build/badge.svg)
[![Version](https://img.shields.io/jetbrains/plugin/v/MARKETPLACE_ID.svg)](https://plugins.jetbrains.com/plugin/MARKETPLACE_ID)
[![Downloads](https://img.shields.io/jetbrains/plugin/d/MARKETPLACE_ID.svg)](https://plugins.jetbrains.com/plugin/MARKETPLACE_ID)

## Description

<!-- Plugin description -->
Adds Talon and Cursorless support to jetbrains/Intellij.

Uses embedded javascript engine to run cursorless engine.

Strives to be backward compatible with the original voice-code plugin, but rewritten in kotlin, and compatible with more
recent version of Intellij.
<!-- Plugin description end -->

## Installation

1. install Talon
2. install the Community voice command set (https://github.com/talonhub/community)
3. install the talon side of cursorless: https://www.cursorless.org/docs/user/installation/#installing-the-talon-side
4. to the same .talon/user folder, clone https://github.com/asoee/cursorless-jetbrains-talon
5. open JetBrains and install the talon-cursorless-everywhere plugin
6. maybe(?) restart JetBrains + Talon

## Usage

For cursorless, see the cursorless guides.

## Issues and known limitations

- Targets jetbrains 2025.2+ (might work with older versions, but not tested)
- To configure hat shapes, you currently have to do it in VSCode, due to the current implementation in talon-cursorless.
- Does not work together with other talon intellij plugins (like voice-code or cursing-less)

## Credits

- [Cursorless](https://www.cursorless.org/)
- Original [Voice-code plugin](https://github.com/anonfunc/intellij-voicecode)
- [Corsorless everywhere engine](https://github.com/cursorless-dev/cursorless) (jetbrains integration currently
  maintained in [this fork](https://github.com/asoee/cursorless/tree/jetbrains-quickjs))
- The sidecar based [version of the plugin](https://github.com/cursorless-everywhere/cursorless-jetbrains)
- [Talon Voice](https://talonvoice.com/)
- [Javet](https://github.com/caoccao/Javet) embedded javascript engine for JVM


---
Plugin based on the [IntelliJ Platform Plugin Template][template].

[template]: https://github.com/JetBrains/intellij-platform-plugin-template
[docs:plugin-description]: https://plugins.jetbrains.com/docs/intellij/plugin-user-experience.html#plugin-description-and-presentation
