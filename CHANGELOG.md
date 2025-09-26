# cursorless-jetbrains Changelog

## [Unreleased]

### New

- `Cursorless settings` support

## [0.0.13] - 2025-08-05

### New

- Highlight support
- Snipped support

### Changed

- Inspection fixes

## [0.0.12] - 2025-08-03

### Added

- Add file-extension to tree-sitter language mapping, to avoid relying on know PSI languages.'
- Add support for `follow` command.

### Changed

- Update to newest cursorless engine, including new version of treesitter.
- Update various dependencies, including jetbrains-platform.

### Fixed

- Allow selection (take) in readonly files.

## [0.0.11] - 2025-05-06

### Changed

- Intellij 2025 support.
- updated dependencies

## [0.0.10] - 2025-02-03

### Fixed

- Fix occasional NPE for language detection
- Queue editor events and dispatch in single thread, to avoid threadpool exhaustion when many editors
  are changed at the same time (e.g. branch change with many tabs open), which results in UI freeze
- Avoid using setTimeout in JS, due to memory leak causing JVM crash. Replace with shim with immediate callback.
- Fix return values from cursorless not being returned to talon, causing commands like `format at` and `phones` to fail.

### Changed

- Load ICU and WASM files from plugin dir, instead of extracting to temp dir.
  This should reduce startup time, and give less clutter in temp dir.
- Reduce logging from JS engine.
- Re-enable cursorless actions on readonly files, to enable selection.
  Commands that changes the file will still fail.
- Use one cursorless engine per project, instead of a global one. This avoids unintended edits in background
  projects, and give more stable hats when multiple projects are open. At the cost of extra memory usage.

## [0.0.9] - 2025-01-10

### Changed

- Make "define" command "go to definition" instead of quick popup
- Propagate file editable state to cursorless
- Enable drawing on hats in readonly files
- Remove localOffset handling for painting hats

### Added

- Add list all tasks command
- Add CursorlessToggle command

### Fixed

- Fix hanging modal actions like "clippings" - use invokeLater
- Fix occasional NPE on startup due to editor without project

## [0.0.8] - 2024-12-28

### Added

- Add color settings for hats
- Add shape penalty settings
- Propagate hat settings to cursorless engine

### Changed

- Use anti-aliased hats on windows
- Removed dependency on VS-Code settings
- Improved settings page layout using DSL

## [0.0.7] - 2024-12-23

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

[Unreleased]: https://github.com/asoee/cursorless-jetbrains/compare/v0.0.13...HEAD
[0.0.13]: https://github.com/asoee/cursorless-jetbrains/compare/v0.0.12...v0.0.13
[0.0.12]: https://github.com/asoee/cursorless-jetbrains/compare/v0.0.11...v0.0.12
[0.0.11]: https://github.com/asoee/cursorless-jetbrains/compare/v0.0.10...v0.0.11
[0.0.10]: https://github.com/asoee/cursorless-jetbrains/compare/v0.0.9...v0.0.10
[0.0.9]: https://github.com/asoee/cursorless-jetbrains/compare/v0.0.8...v0.0.9
[0.0.8]: https://github.com/asoee/cursorless-jetbrains/compare/v0.0.7...v0.0.8
[0.0.7]: https://github.com/asoee/cursorless-jetbrains/compare/v0.0.6...v0.0.7
[0.0.6]: https://github.com/asoee/cursorless-jetbrains/compare/v0.0.5...v0.0.6
[0.0.5]: https://github.com/asoee/cursorless-jetbrains/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/asoee/cursorless-jetbrains/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/asoee/cursorless-jetbrains/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/asoee/cursorless-jetbrains/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/asoee/cursorless-jetbrains/commits/v0.0.1
