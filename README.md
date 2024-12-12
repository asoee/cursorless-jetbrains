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

The plugin is not yet published to the JetBrains marketplace, so it requires manual installation in Intellij.

To enable cursorless, you need som changes to talon
community. [They are maintained in this PR](https://github.com/talonhub/community/pull/1628/files)

## Issues and known limitations

- Targets jetbrains 2024.2+ (might work with older versions, but not tested)
- Only default shape supported for corsorless hats
- Chaining commands is not supported yet
- Inconsistent multi-cursor support
- Multi-panel support is not implemented

## Credits

- [Cursorless](https://www.cursorless.org/)
- Original [Voice-code plugin](https://github.com/anonfunc/intellij-voicecode)
- [Corsorless everywhere engine](https://github.com/cursorless-dev/cursorless) (jetbrains integration currently
  maintained in [this fork](https://github.com/asoee/cursorless/tree/jetbrains-quickjs))
- The sidecar based [version of the plugin](https://github.com/cursorless-everywhere/cursorless-jetbrains)
- [Talon Voice](https://talonvoice.com/)
- [Javet](https://github.com/caoccao/Javet) embedded javascript engine for JVM

## Template ToDo list
- [x] Create a new [IntelliJ Platform Plugin Template][template] project.
- [x] Get familiar with the [template documentation][template].
- [x] Adjust the [pluginGroup](./gradle.properties) and [pluginName](./gradle.properties), as well as
  the [id](./src/main/resources/META-INF/plugin.xml) and [sources package](./src/main/kotlin).
- [x] Adjust the plugin description in `README` (see [Tips][docs:plugin-description])
- [x] Review
  the [Legal Agreements](https://plugins.jetbrains.com/docs/marketplace/legal-agreements.html?from=IJPluginTemplate).
- [x] [Publish a plugin manually](https://plugins.jetbrains.com/docs/intellij/publishing-plugin.html?from=IJPluginTemplate)
  for the first time.
- [ ] Set the `MARKETPLACE_ID` in the above README badges. You can obtain it once the plugin is published to JetBrains Marketplace.
- [ ] Set the [Plugin Signing](https://plugins.jetbrains.com/docs/intellij/plugin-signing.html?from=IJPluginTemplate) related [secrets](https://github.com/JetBrains/intellij-platform-plugin-template#environment-variables).
- [ ] Set the [Deployment Token](https://plugins.jetbrains.com/docs/marketplace/plugin-upload.html?from=IJPluginTemplate).
- [ ] Click the <kbd>Watch</kbd> button on the top of the [IntelliJ Platform Plugin Template][template] to be notified about releases containing new features and fixes.


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
