# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- **Build**: `./gradlew build` - Compiles the plugin and runs all checks
- **Test**: `./gradlew test` - Runs all unit tests with verbose output
- **Run IDE with Plugin**: `./gradlew runIde` - Launches IntelliJ IDEA with the plugin loaded for testing
- **Run UI Tests**: `./gradlew runIdeForUiTests` - Launches IDE with robot server for UI testing
- **Code Quality**: `./gradlew qodana` - Runs static code analysis
- **Coverage**: `./gradlew koverHtmlReport` - Generates code coverage reports
- **Publish**: `./gradlew publishPlugin` - Publishes plugin to JetBrains Marketplace

## Architecture Overview

This is a JetBrains/IntelliJ plugin that brings Cursorless voice coding capabilities to JetBrains IDEs. The plugin embeds a JavaScript engine (Javet) to run the Cursorless engine directly within the IDE.

### Build Dependencies

- **Cursorless Engine Source**: The main Cursorless monorepo is located at `/home/soee/src2/cursorless`
- **JavaScript Bundle**: `src/main/resources/cursorless/cursorless.js` is built from `packages/cursorless-jetbrains` in the main Cursorless repo
- **Development Workflow**: Changes to Cursorless engine functionality must be made in the main Cursorless repo, built there, and then the resulting JavaScript bundle updated in this plugin

### Core Components

1. **JavetDriver** (`src/main/kotlin/.../javet/JavetDriver.kt`) - JavaScript runtime wrapper using Javet (Node.js-in-JVM) that loads and executes the Cursorless JavaScript engine
2. **CursorlessEngine** (`src/main/kotlin/.../cursorless/CursorlessEngine.kt`) - High-level interface to the Cursorless functionality
3. **TalonProjectService** (`src/main/kotlin/.../services/TalonProjectService.kt`) - Main service that coordinates editor management and plugin lifecycle
4. **EditorManager** (`src/main/kotlin/.../services/EditorManager.kt`) - Manages editor state synchronization with Cursorless
5. **CommandExecutorService** (`src/main/kotlin/.../commands/CommandExecutorService.kt`) - Executes Cursorless commands and IDE actions

### Communication Architecture

- **File-based Command Server** (`commandserver/file/`) - Receives commands from Talon via temporary files
- **HTTP Command Server** (`commandserver/http/`) - Alternative HTTP-based communication channel
- **State Synchronization** (`sync/`) - Keeps editor state in sync between IDE and Cursorless engine

### Key Dependencies

- **Javet** (v4.1.5) - Embedded Node.js JavaScript engine for JVM
- **Tree-sitter** - Syntax parsing (WASM modules loaded from `extraFiles/treesitter/wasm/`)
- **Kotlin Serialization** - JSON serialization for command/state transfer
- **JetBrains Platform** - IntelliJ plugin SDK (targets 2024.2+)

### Plugin Resources

- **Cursorless JavaScript** (`src/main/resources/cursorless/cursorless.js`) - Main Cursorless engine bundled with plugin (built from `/home/soee/src2/cursorless/packages/cursorless-jetbrains`)
- **Tree-sitter Queries** (`src/main/resources/cursorless/queries/`) - Language-specific syntax queries
- **WASM Modules** (`extraFiles/treesitter/wasm/`) - Tree-sitter parsers for different languages
- **Hat Icons** (`src/main/resources/icons/`) - Visual markers for Cursorless targets

## Development Notes

- The plugin requires manual installation as it's not yet published to JetBrains Marketplace
- Talon community modifications are needed for JetBrains integration (see README.md PR link)
- Hat shape configuration currently requires VSCode due to Talon-Cursorless implementation
- The plugin is backward compatible with the original voice-code plugin but rewritten in Kotlin
- Supports JetBrains 2025.1+ (may work with 2024.2+ but not extensively tested)

## Testing

Tests are located in `src/test/kotlin/` with test data in `src/test/testData/`. The plugin includes:
- Unit tests for core components
- Integration tests for command execution
- Test data files for various programming languages