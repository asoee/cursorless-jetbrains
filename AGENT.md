# AGENT.md

## Build/Test Commands

- **Build**: `./gradlew build` - Full build with all checks
- **Test**: `./gradlew test` - Run all tests with verbose output
- **Single Test**: `./gradlew test --tests "*TestClassName*"` - Run specific test class
- **Run IDE**: `./gradlew runIde` - Launch IntelliJ with plugin for testing
- **Coverage**: `./gradlew koverHtmlReport` - Generate HTML coverage report
- **Quality**: `./gradlew qodana` - Static code analysis

## Architecture Overview

This is a **JetBrains/IntelliJ plugin** that embeds Cursorless voice coding via **Javet** (Node.js-in-JVM). Core
components: **TalonProjectService** (main coordinator), **EditorManager** (editor sync), **CursorlessEngine** (JS
interface), **JavetDriver** (JS runtime). Communication via **file/HTTP command servers**. Uses **Tree-sitter** for
syntax parsing and **Kotlin Serialization** for data transfer.

## Code Style & Conventions

- **Package**: `com.github.asoee.cursorlessjetbrains.*`
- **Services**: Use `@Service(Service.Level.PROJECT)` annotation, implement `Disposable`
- **Imports**: Prefer explicit imports, use IntelliJ platform APIs, Kotlin serialization
- **Naming**: CamelCase classes, camelCase properties/functions, descriptive variable names
- **Error Handling**: Use IntelliJ Logger (`logger<ClassName>()`) for diagnostics
- **Types**: Kotlin nullable types (`?`), data classes for serialization, explicit return types
- **Resources**: JavaScript bundle at `src/main/resources/cursorless/cursorless.js`, WASM at
  `extraFiles/treesitter/wasm/`
- **Dependencies**: Main Cursorless source at `/home/soee/src2/cursorless`, build JS bundle there first before updating
  plugin
