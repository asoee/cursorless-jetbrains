import org.gradle.api.tasks.testing.logging.TestExceptionFormat
import org.jetbrains.changelog.Changelog
import org.jetbrains.changelog.markdownToHTML
import org.jetbrains.intellij.platform.gradle.TestFrameworkType
import org.jetbrains.intellij.platform.gradle.tasks.PrepareSandboxTask

plugins {
    id("java") // Java support
    alias(libs.plugins.kotlin) // Kotlin support
    alias(libs.plugins.intelliJPlatform) // IntelliJ Platform Gradle Plugin
    alias(libs.plugins.changelog) // Gradle Changelog Plugin
    alias(libs.plugins.qodana) // Gradle Qodana Plugin
    alias(libs.plugins.kover) // Gradle Kover Plugin
    kotlin("plugin.serialization") version "2.1.20"
}

group = providers.gradleProperty("pluginGroup").get()
version = providers.gradleProperty("pluginVersion").get()

// Set the JVM language level used to build the project.
kotlin {
    jvmToolchain(21)
}

// Configure project's dependencies
repositories {
    mavenCentral()
    google()

    // IntelliJ Platform Gradle Plugin Repositories Extension - read more: https://plugins.jetbrains.com/docs/intellij/tools-intellij-platform-gradle-plugin-repositories-extension.html
    intellijPlatform {
        defaultRepositories()
    }
}

// Create integrationTest source set (following official JetBrains guide)
sourceSets {
    create("integrationTest") {
        compileClasspath += sourceSets.main.get().output
        runtimeClasspath += sourceSets.main.get().output
    }
}

// Create configuration for integrationTest source set
val integrationTestImplementation: Configuration by configurations.getting {
    extendsFrom(configurations.testImplementation.get())
}

// Dependencies are managed with Gradle version catalog - read more: https://docs.gradle.org/current/userguide/platforms.html#sub:version-catalog
dependencies {
    // Test dependencies
    testImplementation(libs.junit)
    testImplementation(libs.awaitility)
    // Adding JUnit 5 support
//    testImplementation("org.junit.jupiter:junit-jupiter:5.10.2")
//    testImplementation("org.junit.vintage:junit-vintage-engine:5.10.2") // For JUnit 4 compatibility

//    testImplementation("com.jetbrains.intellij.platform:test-framework")

    // Integration test specific dependencies (for UI tests only)
    integrationTestImplementation("org.junit.jupiter:junit-jupiter:5.10.2")
    integrationTestImplementation("org.kodein.di:kodein-di-jvm:7.20.2")
    integrationTestImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-core-jvm:1.10.1")

    integrationTestImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-core-jvm:1.10.1")

    implementation(libs.kotlinSerializationJson)
    implementation(libs.bundles.javet)
    implementation(libs.jsvg)

    // IntelliJ Platform Gradle Plugin Dependencies Extension - read more: https://plugins.jetbrains.com/docs/intellij/tools-intellij-platform-gradle-plugin-dependencies-extension.html
    intellijPlatform {
        create(providers.gradleProperty("platformType"), providers.gradleProperty("platformVersion"))

        // Plugin Dependencies. Uses `platformBundledPlugins` property from the gradle.properties file for bundled IntelliJ Platform plugins.
        bundledPlugins(providers.gradleProperty("platformBundledPlugins").map { it.split(',') })

        // Plugin Dependencies. Uses `platformPlugins` property from the gradle.properties file for plugin from JetBrains Marketplace.
        plugins(providers.gradleProperty("platformPlugins").map { it.split(',') })

//        instrumentationTools()
        pluginVerifier()
        zipSigner()
        testFramework(TestFrameworkType.Platform)
        // Add fixtures explicitly for DefaultLightProjectDescriptor
        testFramework(TestFrameworkType.Plugin.Java)
        testFramework(
            TestFrameworkType.Starter,
            configurationName = "integrationTestImplementation"
        ) // UI testing framework for integration tests
    }
}

// Configure IntelliJ Platform Gradle Plugin - read more: https://plugins.jetbrains.com/docs/intellij/tools-intellij-platform-gradle-plugin-extension.html
intellijPlatform {
    pluginConfiguration {
        version = providers.gradleProperty("pluginVersion")

        // Extract the <!-- Plugin description --> section from README.md and provide for the plugin's manifest
        description = providers.fileContents(layout.projectDirectory.file("README.md")).asText.map {
            val start = "<!-- Plugin description -->"
            val end = "<!-- Plugin description end -->"

            with(it.lines()) {
                if (!containsAll(listOf(start, end))) {
                    throw GradleException("Plugin description section not found in README.md:\n$start ... $end")
                }
                subList(indexOf(start) + 1, indexOf(end)).joinToString("\n").let(::markdownToHTML)
            }
        }

        val changelog = project.changelog // local variable for configuration cache compatibility
        // Get the latest available change notes from the changelog file
        changeNotes = providers.gradleProperty("pluginVersion").map { pluginVersion ->
            with(changelog) {
                renderItem(
                    (getOrNull(pluginVersion) ?: getUnreleased())
                        .withHeader(false)
                        .withEmptySections(false),
                    Changelog.OutputType.HTML,
                )
            }
        }

        ideaVersion {
            sinceBuild = providers.gradleProperty("pluginSinceBuild")
//            untilBuild = providers.gradleProperty("pluginUntilBuild")
            untilBuild = provider { null }
        }
    }

    signing {
        certificateChain = providers.environmentVariable("CERTIFICATE_CHAIN")
        privateKey = providers.environmentVariable("PRIVATE_KEY")
        password = providers.environmentVariable("PRIVATE_KEY_PASSWORD")
    }

    publishing {
        token = providers.environmentVariable("PUBLISH_TOKEN")
        // The pluginVersion is based on the SemVer (https://semver.org) and supports pre-release labels, like 2.1.7-alpha.3
        // Specify pre-release label to publish the plugin in a custom Release Channel automatically. Read more:
        // https://plugins.jetbrains.com/docs/intellij/deployment.html#specifying-a-release-channel
        channels = providers.gradleProperty("pluginVersion")
            .map { listOf(it.substringAfter('-', "").substringBefore('.').ifEmpty { "default" }) }
    }

    pluginVerification {
        ides {
            create("IC", "2025.1.6")
        }
    }
}

// Configure Gradle Changelog Plugin - read more: https://github.com/JetBrains/gradle-changelog-plugin
changelog {
    groups.empty()
    repositoryUrl = providers.gradleProperty("pluginRepositoryUrl")
}

// Configure Gradle Kover Plugin - read more: https://github.com/Kotlin/kotlinx-kover#configuration
kover {
    reports {
        total {
            xml {
                onCheck = true
            }
        }
    }
}

tasks {
    wrapper {
        gradleVersion = providers.gradleProperty("gradleVersion").get()
    }

    withType<PrepareSandboxTask> {
        from(layout.projectDirectory.dir("extraFiles")) {
            into(pluginName.map { "$it/extra" })
        }
    }

    test {
        description = "Runs unit and platform tests (requires IntelliJ framework)"
        group = "verification"

        systemProperty(
            "java.util.logging.config.file",
            project.file("src/test/resources/logging.properties").absolutePath
        )
        systemProperty(
            "talon.http.port", "0" // Use random port for unit tests
        )
        outputs.upToDateWhen { false }

        testLogging {
            events("passed", "skipped", "failed")
            showStandardStreams = false
            exceptionFormat = TestExceptionFormat.FULL
        }
    }

    // Integration test task (following official JetBrains guide)
    register<Test>("integrationTest") {
        description = "Runs integration tests using IntelliJ Starter framework"
        group = "integration testing" // Custom group to exclude from check

        val integrationTestSourceSet = sourceSets.getByName("integrationTest")
        testClassesDirs = integrationTestSourceSet.output.classesDirs
        classpath = integrationTestSourceSet.runtimeClasspath

        // Use prepareSandbox output directory as recommended by JetBrains
        systemProperty("path.to.build.plugin", prepareSandbox.get().pluginDirectory.get().asFile)
        useJUnitPlatform()
        dependsOn(prepareSandbox, buildPlugin)

        // Integration tests typically need more time and memory
//        maxHeapSize = "4g"
//        jvmArgs("-XX:MaxMetaspaceSize=512m")

        testLogging {
            events("passed", "skipped", "failed")
            showStandardStreams = true
            exceptionFormat = TestExceptionFormat.FULL
        }

        // Exclude from check by default - run manually with -PrunIntegrationTests
        enabled = project.hasProperty("runIntegrationTests")
    }

    runIde {
        jvmArgumentProviders += CommandLineArgumentProvider {
            listOf(
                "-Dtalon.http.port=8666",
//                "-XX:StartFlightRecording:filename=recording.jfr,duration=30s"
            )
        }
    }

    publishPlugin {
        dependsOn(patchChangelog)
    }
}

intellijPlatformTesting {
    runIde {
        register("runIdeForUiTests") {
            task {
                jvmArgumentProviders += CommandLineArgumentProvider {
                    listOf(
                        "-Drobot-server.port=8082",
                        "-Dide.mac.message.dialogs.as.sheets=false",
                        "-Djb.privacy.policy.text=<!--999.999-->",
                        "-Djb.consents.confirmation.enabled=false",
                        "-Didea.disposer.debug=on",
                    )
                }
            }

            plugins {
                robotServerPlugin()
            }
        }
    }
}

tasks.withType<Test> {
    this.testLogging {
        this.showStandardStreams = true
        this.events("passed", "skipped", "failed")
        showStandardStreams = true
        this.exceptionFormat = TestExceptionFormat.FULL
    }
}



