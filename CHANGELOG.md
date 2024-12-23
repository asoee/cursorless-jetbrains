# cursorless-jetbrains Changelog

## [Unreleased]

### Added

- Add support for multiple hat shapes using SVG
- Add settings to tweak hat size and position
- Add setting to disable hats
- Add setting for flash range duration

## [0.0.6] - 2024-12-18

### Fixed

- Fix indentation and cursor position issues after cursorless `pour` command
- Fix hats sometimes not drawn, when editor size increases

### Added

- Add support for chaining commands, using `prePhraseSnapshot`

## [0.0.5] - 2024-12-17

### Fixed

- Fix selection position sometimes incorrect after cursorless edit actions
- Fix curorless paste action not working
- Removed unneeded dependency on VCS plugin
- Scroll to cursor after selection

### Added

- Improved multi-cursor support
- Improved multi-editor support (split panel)
- Add support for flashing ranges

## [0.0.4] - 2024-12-15

### Fixed

- Fix broken project resolution for http commands
- Fix some actions not executed with the right editor locks
- Fix deadlock when cursorless command triggered opening new editor

## [0.0.3] - 2024-12-13

### Added

- Include treesitter with cursorless engine, to support structural editing

### Changed

- Improve test coverage
- Target jetbrains 2024.2+

### Fixed

- Fix 2024 requires some actions being executed in explicit write action

## [0.0.2] - 2024-12-07

### Fixed

- Fix various issues when tab characters are used for indentation (hats, cursors and edits)

### Added

- Implement most of the cursorless commands

## [0.0.1] - 2024-12-05

### Added

- Initial scaffold created from [IntelliJ Platform Plugin Template](https://github.com/JetBrains/intellij-platform-plugin-template)
- Embedding cursorless engine using Javet javascript engine.
- Basic support for simple selection and edit using cursorless
- Communication with talon using both HTTP and file based command server
- Most voice-code commands added to the plugin

[Unreleased]: https://github.com/asoee/cursorless-jetbrains/compare/v0.0.6...HEAD
[0.0.6]: https://github.com/asoee/cursorless-jetbrains/compare/v0.0.5...v0.0.6
[0.0.5]: https://github.com/asoee/cursorless-jetbrains/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/asoee/cursorless-jetbrains/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/asoee/cursorless-jetbrains/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/asoee/cursorless-jetbrains/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/asoee/cursorless-jetbrains/commits/v0.0.1
