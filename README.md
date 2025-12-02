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

## Usage

To enable cursorless, you need som changes to talon
community. [They are maintained in this PR](https://github.com/talonhub/community/pull/1628/files)

## Issues and known limitations

- Targets jetbrains 2025.1+
- To configure hat shapes, you currently have to do it in VSCode, due to the current implementation in talon-cursorless.


## Credits

- [Cursorless](https://www.cursorless.org/)
- Original [Voice-code plugin](https://github.com/anonfunc/intellij-voicecode)
- [Corsorless everywhere engine](https://github.com/cursorless-dev/cursorless) (jetbrains integration currently
  maintained in [this fork](https://github.com/asoee/cursorless/tree/jetbrains-quickjs))
- The sidecar based [version of the plugin](https://github.com/cursorless-everywhere/cursorless-jetbrains)
- [Talon Voice](https://talonvoice.com/)
- [Javet](https://github.com/caoccao/Javet) embedded javascript engine for JVM

## Installation

- Using the IDE built-in plugin system:
  
  <kbd>Settings/Preferences</kbd> > <kbd>Plugins</kbd> > <kbd>Marketplace</kbd> > <kbd>Search for "cursorless-jetbrains"</kbd> >
  <kbd>Install</kbd>
  
- Using JetBrains Marketplace:

  Go to [JetBrains Marketplace](https://plugins.jetbrains.com/plugin/MARKETPLACE_ID) and install it by clicking the <kbd>Install to ...</kbd> button in case your IDE is running.

  You can also download the [latest release](https://plugins.jetbrains.com/plugin/MARKETPLACE_ID/versions) from JetBrains Marketplace and install it manually using
  <kbd>Settings/Preferences</kbd> > <kbd>Plugins</kbd> > <kbd>⚙️</kbd> > <kbd>Install plugin from disk...</kbd>

- Manually:

  Download the [latest release](https://github.com/asoee/cursorless-jetbrains/releases/latest) and install it manually using
  <kbd>Settings/Preferences</kbd> > <kbd>Plugins</kbd> > <kbd>⚙️</kbd> > <kbd>Install plugin from disk...</kbd>


---
Plugin based on the [IntelliJ Platform Plugin Template][template].

[template]: https://github.com/JetBrains/intellij-platform-plugin-template
[docs:plugin-description]: https://plugins.jetbrains.com/docs/intellij/plugin-user-experience.html#plugin-description-and-presentation
