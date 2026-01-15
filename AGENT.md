# AGENT.md - Cursorless JetBrains Plugin

## Build/Test Commands
- **Build**: `.\gradlew.bat build`
- **Test all**: `.\gradlew.bat test`
- **Test single class**: `.\gradlew.bat test --tests "ClassName"`
- **Run plugin**: `.\gradlew.bat runIde`
- **Coverage**: `.\gradlew.bat koverHtmlReport`
- **Lint/Quality**: `.\gradlew.bat qodanaScan`

## Architecture
Kotlin-based IntelliJ plugin integrating Cursorless voice-coding engine via embedded JavaScript (Javet). Core components:
- **TalonProjectService**: Main plugin service managing Cursorless engine and editor listeners
- **JavetDriver**: JavaScript engine wrapper for running Cursorless
- **EditorManager**: Manages IDE editor state sync with Cursorless
- **CommandExecutorService**: Executes Cursorless commands in IntelliJ

## Code Style
- **Language**: Kotlin 2.1.20, JVM 21
- **Test framework**: JUnit 4.13.2 + IntelliJ Platform test framework
- **Package structure**: `com.github.asoee.cursorlessjetbrains.{services|commands|cursorless|javet|listeners}`
- **Imports**: Group by framework (IntelliJ, Kotlin, external libs)
- **Services**: Use `@Service(Service.Level.PROJECT)` annotation
- **Error handling**: Use IntelliJ logger, avoid throwing unchecked exceptions in event handlers
