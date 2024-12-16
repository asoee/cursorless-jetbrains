# cursorless-jetbrains Changelog

## [Unreleased]

### Fixed

- Fix selection position sometimes incorrect after cursorless edit actions
- Fix curorless paste action not working
-

### Added

- Improved multi-cursor support
- Improved multi-editor support (split panel)

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

[Unreleased]: https://github.com/asoee/cursorless-jetbrains/compare/v0.0.4...HEAD
[0.0.4]: https://github.com/asoee/cursorless-jetbrains/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/asoee/cursorless-jetbrains/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/asoee/cursorless-jetbrains/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/asoee/cursorless-jetbrains/commits/v0.0.1
