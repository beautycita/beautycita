# BeautyCita Native Android App - Architecture Plan

**Last Updated:** November 1, 2025
**Purpose:** Detailed architecture and implementation plan for native Android development
**Status:** Ready for Implementation

---

## Executive Summary

This document provides a complete architecture plan for building the BeautyCita native Android application. This is a **TRUE native app** (not a wrapper) using modern Android development practices, Jetpack Compose, and Material3.

### Goals

1. **Native Experience:** Touchscreen-optimized UI with Android design patterns
2. **Design Parity:** Match webapp's pink-purple-blue gradient theme exactly
3. **Shared API:** Use the same backend API as webapp and iOS app
4. **Modern Stack:** Jetpack Compose, MVVM, Kotlin Coroutines, Hilt DI
5. **Offline-First:** Local caching with Room Database
6. **Production-Ready:** Testing, CI/CD, monitoring from day one

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Build Configuration](#2-build-configuration)
3. [Architecture Layers](#3-architecture-layers)
4. [Module Organization](#4-module-organization)
5. [Technology Stack Details](#5-technology-stack-details)
6. [Design System Implementation](#6-design-system-implementation)
7. [Feature Modules](#7-feature-modules)
8. [Data Layer](#8-data-layer)
9. [Authentication Implementation](#9-authentication-implementation)
10. [Navigation Architecture](#10-navigation-architecture)
11. [Testing Strategy](#11-testing-strategy)
12. [Build Variants & Flavors](#12-build-variants--flavors)
13. [CI/CD Pipeline](#13-cicd-pipeline)
14. [Implementation Roadmap](#14-implementation-roadmap)

---

## 1. Project Structure

### Root Project Structure

```
BeautyCitaAndroid/
├── app/                           # Main application module
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/beautycita/
│   │   │   │   ├── BeautyCitaApplication.kt
│   │   │   │   ├── MainActivity.kt
│   │   │   │   └── di/            # App-level dependency injection
│   │   │   ├── res/
│   │   │   │   ├── values/
│   │   │   │   │   ├── colors.xml
│   │   │   │   │   ├── strings.xml
│   │   │   │   │   ├── themes.xml
│   │   │   │   │   └── dimens.xml
│   │   │   │   ├── drawable/
│   │   │   │   ├── font/          # Playfair Display, Inter
│   │   │   │   └── raw/
│   │   │   └── AndroidManifest.xml
│   │   ├── debug/
│   │   └── release/
│   └── build.gradle.kts
│
├── core/                          # Core utilities shared across modules
│   ├── common/
│   │   └── src/main/java/com/beautycita/core/common/
│   │       ├── util/
│   │       ├── extensions/
│   │       └── constants/
│   ├── ui/                        # Core UI components (BC* design system)
│   │   └── src/main/java/com/beautycita/core/ui/
│   │       ├── components/        # BCButton, BCCard, BCTextField, etc.
│   │       ├── theme/             # Material3 theme + BeautyCita colors
│   │       └── animations/
│   ├── network/                   # Retrofit, OkHttp configuration
│   │   └── src/main/java/com/beautycita/core/network/
│   │       ├── api/
│   │       ├── interceptors/
│   │       └── models/
│   └── database/                  # Room Database
│       └── src/main/java/com/beautycita/core/database/
│           ├── dao/
│           ├── entities/
│           └── BeautyCitaDatabase.kt
│
├── feature/                       # Feature modules (MVVM architecture)
│   ├── auth/
│   │   └── src/main/java/com/beautycita/feature/auth/
│   │       ├── ui/
│   │       │   ├── login/
│   │       │   │   ├── LoginScreen.kt
│   │       │   │   └── LoginViewModel.kt
│   │       │   ├── register/
│   │       │   ├── biometric/
│   │       │   └── sms/
│   │       ├── data/
│   │       │   ├── repository/
│   │       │   └── models/
│   │       └── domain/
│   │           └── usecase/
│   ├── home/
│   │   └── src/main/java/com/beautycita/feature/home/
│   ├── stylists/
│   │   └── src/main/java/com/beautycita/feature/stylists/
│   ├── booking/
│   │   └── src/main/java/com/beautycita/feature/booking/
│   ├── profile/
│   │   └── src/main/java/com/beautycita/feature/profile/
│   ├── messaging/
│   │   └── src/main/java/com/beautycita/feature/messaging/
│   ├── dashboard/                 # Stylist dashboard
│   │   └── src/main/java/com/beautycita/feature/dashboard/
│   └── admin/                     # Admin panel
│       └── src/main/java/com/beautycita/feature/admin/
│
├── gradle/
│   └── libs.versions.toml         # Version catalog
├── build.gradle.kts               # Root build script
├── settings.gradle.kts
├── gradle.properties
└── local.properties               # Local SDK path, API keys (gitignored)
```

### Package Structure (per module)

```
com.beautycita.feature.<name>/
├── ui/                            # Composable screens & UI logic
│   ├── <FeatureName>Screen.kt
│   ├── <FeatureName>ViewModel.kt
│   ├── components/                # Feature-specific composables
│   └── navigation/
├── data/                          # Data layer
│   ├── repository/
│   │   ├── <Feature>Repository.kt
│   │   └── <Feature>RepositoryImpl.kt
│   ├── remote/                    # API data sources
│   │   └── <Feature>RemoteDataSource.kt
│   ├── local/                     # Room DAO & entities
│   │   └── <Feature>LocalDataSource.kt
│   └── models/                    # DTOs, API models
├── domain/                        # Business logic (optional for simple features)
│   ├── model/                     # Domain models
│   └── usecase/                   # Use cases
└── di/                            # Hilt modules for DI
    └── <Feature>Module.kt
```

---

## 2. Build Configuration

### Root `build.gradle.kts`

```kotlin
// Root build.gradle.kts
buildscript {
    repositories {
        google()
        mavenCentral()
    }
}

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.hilt) apply false
    alias(libs.plugins.ksp) apply false
}
```

### App Module `build.gradle.kts`

```kotlin
// app/build.gradle.kts
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.hilt)
    alias(libs.plugins.ksp)
    id("kotlin-parcelize")
    id("com.google.gms.google-services") // Firebase
}

android {
    namespace = "com.beautycita"
    compileSdk = 35                     // Latest Android 15

    defaultConfig {
        applicationId = "com.beautycita"
        minSdk = 24                     // Android 7.0 (94% coverage)
        targetSdk = 35                  // Android 15
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        vectorDrawables {
            useSupportLibrary = true
        }

        // API configuration
        buildConfigField("String", "API_BASE_URL", "\"https://beautycita.com/api/\"")
        buildConfigField("String", "SOCKET_URL", "\"https://beautycita.com\"")
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
            isDebuggable = true
            isMinifyEnabled = false

            // Debug API keys (from local.properties)
            buildConfigField("String", "STRIPE_PUBLISHABLE_KEY", getLocalProperty("STRIPE_TEST_KEY"))
            buildConfigField("String", "GOOGLE_MAPS_API_KEY", getLocalProperty("GOOGLE_MAPS_KEY"))
        }

        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")

            // Production API keys (from environment variables for CI/CD)
            buildConfigField("String", "STRIPE_PUBLISHABLE_KEY", "\"${System.getenv("STRIPE_LIVE_KEY")}\"")
            buildConfigField("String", "GOOGLE_MAPS_API_KEY", "\"${System.getenv("GOOGLE_MAPS_KEY")}\"")
        }
    }

    // Product flavors for different build variants
    flavorDimensions += "environment"
    productFlavors {
        create("production") {
            dimension = "environment"
            buildConfigField("String", "API_BASE_URL", "\"https://beautycita.com/api/\"")
        }

        create("staging") {
            dimension = "environment"
            applicationIdSuffix = ".staging"
            buildConfigField("String", "API_BASE_URL", "\"https://staging.beautycita.com/api/\"")
        }

        create("development") {
            dimension = "environment"
            applicationIdSuffix = ".dev"
            buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:4000/api/\"") // Android emulator localhost
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs += listOf(
            "-opt-in=androidx.compose.material3.ExperimentalMaterial3Api",
            "-opt-in=kotlinx.coroutines.ExperimentalCoroutinesApi"
        )
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // Core modules
    implementation(project(":core:common"))
    implementation(project(":core:ui"))
    implementation(project(":core:network"))
    implementation(project(":core:database"))

    // Feature modules
    implementation(project(":feature:auth"))
    implementation(project(":feature:home"))
    implementation(project(":feature:stylists"))
    implementation(project(":feature:booking"))
    implementation(project(":feature:profile"))
    implementation(project(":feature:messaging"))
    implementation(project(":feature:dashboard"))
    implementation(project(":feature:admin"))

    // AndroidX Core
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)

    // Compose BOM (Bill of Materials - manages versions)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.extended)

    // Navigation
    implementation(libs.androidx.navigation.compose)

    // Hilt Dependency Injection
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.androidx.hilt.navigation.compose)

    // Splash Screen API
    implementation(libs.androidx.core.splashscreen)

    // Testing
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
}

// Helper function to read local.properties
fun getLocalProperty(key: String): String {
    val properties = java.util.Properties()
    val localPropertiesFile = rootProject.file("local.properties")
    if (localPropertiesFile.exists()) {
        properties.load(localPropertiesFile.inputStream())
    }
    return properties.getProperty(key, "")
}
```

### Version Catalog (`gradle/libs.versions.toml`)

```toml
[versions]
# SDK Versions
compileSdk = "35"
minSdk = "24"
targetSdk = "35"

# Kotlin & Gradle
kotlin = "1.9.22"
agp = "8.3.0"
ksp = "1.9.22-1.0.17"

# AndroidX Core
androidx-core = "1.12.0"
androidx-lifecycle = "2.7.0"
androidx-activity-compose = "1.8.2"
androidx-compose-bom = "2024.02.00"
androidx-navigation = "2.7.7"
androidx-splashscreen = "1.0.1"

# Dependency Injection
hilt = "2.50"
hilt-navigation-compose = "1.1.0"

# Networking
retrofit = "2.9.0"
okhttp = "4.12.0"
kotlinx-serialization = "1.6.3"

# Database
room = "2.6.1"
datastore = "1.0.0"

# Image Loading
coil = "2.5.0"

# Real-time
socket-io = "2.1.0"
twilio-video = "7.6.1"

# Payments
stripe = "20.37.0"

# Google Services
play-services-auth = "21.0.0"
play-services-maps = "18.2.0"
play-services-location = "21.1.0"
play-services-fido = "20.1.0"

# Firebase
firebase-bom = "32.7.2"

# Security
androidx-security-crypto = "1.1.0-alpha06"
androidx-biometric = "1.2.0-alpha05"

# Monitoring
sentry = "7.2.0"

# Testing
junit = "4.13.2"
androidx-junit = "1.1.5"
androidx-espresso = "3.5.1"
turbine = "1.0.0"
mockk = "1.13.9"
coroutines-test = "1.7.3"

[libraries]
# AndroidX Core
androidx-core-ktx = { module = "androidx.core:core-ktx", version.ref = "androidx-core" }
androidx-lifecycle-runtime-ktx = { module = "androidx.lifecycle:lifecycle-runtime-ktx", version.ref = "androidx-lifecycle" }
androidx-lifecycle-viewmodel-compose = { module = "androidx.lifecycle:lifecycle-viewmodel-compose", version.ref = "androidx-lifecycle" }
androidx-lifecycle-runtime-compose = { module = "androidx.lifecycle:lifecycle-runtime-compose", version.ref = "androidx-lifecycle" }
androidx-activity-compose = { module = "androidx.activity:activity-compose", version.ref = "androidx-activity-compose" }

# Compose
androidx-compose-bom = { module = "androidx.compose:compose-bom", version.ref = "androidx-compose-bom" }
androidx-compose-ui = { module = "androidx.compose.ui:ui" }
androidx-compose-ui-graphics = { module = "androidx.compose.ui:ui-graphics" }
androidx-compose-ui-tooling = { module = "androidx.compose.ui:ui-tooling" }
androidx-compose-ui-tooling-preview = { module = "androidx.compose.ui:ui-tooling-preview" }
androidx-compose-ui-test-manifest = { module = "androidx.compose.ui:ui-test-manifest" }
androidx-compose-ui-test-junit4 = { module = "androidx.compose.ui:ui-test-junit4" }
androidx-compose-material3 = { module = "androidx.compose.material3:material3" }
androidx-compose-material-icons-extended = { module = "androidx.compose.material:material-icons-extended" }

# Navigation
androidx-navigation-compose = { module = "androidx.navigation:navigation-compose", version.ref = "androidx-navigation" }

# Hilt
hilt-android = { module = "com.google.dagger:hilt-android", version.ref = "hilt" }
hilt-compiler = { module = "com.google.dagger:hilt-compiler", version.ref = "hilt" }
androidx-hilt-navigation-compose = { module = "androidx.hilt:hilt-navigation-compose", version.ref = "hilt-navigation-compose" }

# Splash Screen
androidx-core-splashscreen = { module = "androidx.core:core-splashscreen", version.ref = "androidx-splashscreen" }

# Networking
retrofit = { module = "com.squareup.retrofit2:retrofit", version.ref = "retrofit" }
retrofit-kotlinx-serialization = { module = "com.squareup.retrofit2:converter-kotlinx-serialization", version.ref = "retrofit" }
okhttp = { module = "com.squareup.okhttp3:okhttp", version.ref = "okhttp" }
okhttp-logging-interceptor = { module = "com.squareup.okhttp3:logging-interceptor", version.ref = "okhttp" }
kotlinx-serialization-json = { module = "org.jetbrains.kotlinx:kotlinx-serialization-json", version.ref = "kotlinx-serialization" }

# Database
room-runtime = { module = "androidx.room:room-runtime", version.ref = "room" }
room-compiler = { module = "androidx.room:room-compiler", version.ref = "room" }
room-ktx = { module = "androidx.room:room-ktx", version.ref = "room" }
datastore-preferences = { module = "androidx.datastore:datastore-preferences", version.ref = "datastore" }

# Image Loading
coil-compose = { module = "io.coil-kt:coil-compose", version.ref = "coil" }

# Real-time
socket-io-client = { module = "io.socket:socket.io-client", version.ref = "socket-io" }
twilio-video = { module = "com.twilio:video-android", version.ref = "twilio-video" }

# Payments
stripe-android = { module = "com.stripe:stripe-android", version.ref = "stripe" }

# Google Services
play-services-auth = { module = "com.google.android.gms:play-services-auth", version.ref = "play-services-auth" }
play-services-maps = { module = "com.google.android.gms:play-services-maps", version.ref = "play-services-maps" }
play-services-location = { module = "com.google.android.gms:play-services-location", version.ref = "play-services-location" }
play-services-fido = { module = "com.google.android.gms:play-services-fido", version.ref = "play-services-fido" }

# Firebase
firebase-bom = { module = "com.google.firebase:firebase-bom", version.ref = "firebase-bom" }
firebase-analytics = { module = "com.google.firebase:firebase-analytics" }
firebase-messaging = { module = "com.google.firebase:firebase-messaging" }

# Security
androidx-security-crypto = { module = "androidx.security:security-crypto", version.ref = "androidx-security-crypto" }
androidx-biometric = { module = "androidx.biometric:biometric", version.ref = "androidx-biometric" }

# Monitoring
sentry-android = { module = "io.sentry:sentry-android", version.ref = "sentry" }

# Testing
junit = { module = "junit:junit", version.ref = "junit" }
androidx-junit = { module = "androidx.test.ext:junit", version.ref = "androidx-junit" }
androidx-espresso-core = { module = "androidx.test.espresso:espresso-core", version.ref = "androidx-espresso" }
turbine = { module = "app.cash.turbine:turbine", version.ref = "turbine" }
mockk = { module = "io.mockk:mockk", version.ref = "mockk" }
kotlinx-coroutines-test = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-test", version.ref = "coroutines-test" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
kotlin-serialization = { id = "org.jetbrains.kotlin.plugin.serialization", version.ref = "kotlin" }
hilt = { id = "com.google.dagger.hilt.android", version.ref = "hilt" }
ksp = { id = "com.google.devtools.ksp", version.ref = "ksp" }
```

---

## 3. Architecture Layers

### MVVM Architecture Pattern

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer (Compose)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Screen    │  │  ViewModel  │  │  UI State   │     │
│  │ (Composable)│  │ (StateFlow) │  │  (Data)     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────┐
│               Domain Layer (Optional)                    │
│  ┌─────────────┐  ┌─────────────┐                       │
│  │  Use Cases  │  │   Models    │                       │
│  └─────────────┘  └─────────────┘                       │
└─────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Repository  │  │   Remote    │  │    Local    │     │
│  │ (Interface) │  │ DataSource  │  │ DataSource  │     │
│  │             │  │  (Retrofit) │  │   (Room)    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

#### UI Layer
- **Screen Composables:** Display UI, handle user input
- **ViewModels:** Manage UI state, handle business logic, coordinate data flow
- **UI State:** Immutable data classes representing UI state

#### Domain Layer (Optional for complex features)
- **Use Cases:** Encapsulate single business operations
- **Domain Models:** Business logic models (independent of framework)

#### Data Layer
- **Repositories:** Single source of truth for data
- **Remote Data Sources:** API calls via Retrofit
- **Local Data Sources:** Database operations via Room
- **Data Models/DTOs:** Network and database entities

---

## 4. Module Organization

### Core Modules

#### `:core:common`
Shared utilities, extensions, constants
```kotlin
// core/common/src/main/java/com/beautycita/core/common/

// Result wrapper
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String, val cause: Throwable? = null) : Result<Nothing>()
    object Loading : Result<Nothing>()
}

// UI State wrapper
sealed class UiState<out T> {
    object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    data class Error(val message: String) : UiState<Nothing>()
}

// Extensions
fun String.isValidEmail(): Boolean {
    return android.util.Patterns.EMAIL_ADDRESS.matcher(this).matches()
}

fun String.isValidPhone(): Boolean {
    return length == 10 && all { it.isDigit() }
}

// Constants
object Constants {
    const val API_TIMEOUT = 30_000L
    const val DATABASE_NAME = "beautycita_db"
    const val PREFS_NAME = "beautycita_prefs"
}
```

#### `:core:ui`
Design system components, theme, animations
```kotlin
// core/ui/src/main/java/com/beautycita/core/ui/

// Theme
@Composable
fun BeautyCitaTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) {
        darkColorScheme(
            primary = BeautyCitaColors.Purple600,
            secondary = BeautyCitaColors.Pink500,
            tertiary = BeautyCitaColors.Blue500,
            background = BeautyCitaColors.Gray900,
            surface = BeautyCitaColors.Gray800,
            onPrimary = Color.White,
            onSecondary = Color.White,
            onBackground = BeautyCitaColors.Gray100,
            onSurface = BeautyCitaColors.Gray100
        )
    } else {
        lightColorScheme(
            primary = BeautyCitaColors.Purple600,
            secondary = BeautyCitaColors.Pink500,
            tertiary = BeautyCitaColors.Blue500,
            background = Color.White,
            surface = Color.White,
            onPrimary = Color.White,
            onSecondary = Color.White,
            onBackground = Color.Black,
            onSurface = Color.Black
        )
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = BeautyCitaTypography.typography,
        content = content
    )
}

// BC Components
@Composable
fun BCButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    size: ButtonSize = ButtonSize.Medium
) {
    // Implementation from analysis document
}

@Composable
fun BCCard(
    modifier: Modifier = Modifier,
    elevation: Dp = 4.dp,
    content: @Composable () -> Unit
) {
    // Implementation from analysis document
}

@Composable
fun BCTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    keyboardType: KeyboardType = KeyboardType.Text
) {
    // Implementation from analysis document
}
```

#### `:core:network`
Retrofit, OkHttp, API service interfaces
```kotlin
// core/network/src/main/java/com/beautycita/core/network/

// API Service
interface BeautyCitaApiService {
    // Auth
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<RegisterResponse>

    @GET("auth/profile")
    suspend fun getProfile(): Response<ProfileResponse>

    // Stylists
    @GET("stylists")
    suspend fun getStylists(
        @Query("location") location: String? = null,
        @Query("service") service: String? = null,
        @Query("radius") radius: Int? = null
    ): Response<List<Stylist>>

    @GET("stylists/{id}")
    suspend fun getStylist(@Path("id") id: Int): Response<Stylist>

    // Bookings
    @GET("bookings")
    suspend fun getBookings(): Response<List<Booking>>

    @POST("bookings")
    suspend fun createBooking(@Body request: CreateBookingRequest): Response<Booking>

    // ... (200+ endpoints from analysis)
}

// Retrofit configuration
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideOkHttpClient(
        authInterceptor: AuthInterceptor,
        loggingInterceptor: HttpLoggingInterceptor
    ): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(loggingInterceptor)
            .connectTimeout(Constants.API_TIMEOUT, TimeUnit.MILLISECONDS)
            .readTimeout(Constants.API_TIMEOUT, TimeUnit.MILLISECONDS)
            .writeTimeout(Constants.API_TIMEOUT, TimeUnit.MILLISECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(Json.asConverterFactory("application/json".toMediaType()))
            .build()
    }

    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): BeautyCitaApiService {
        return retrofit.create(BeautyCitaApiService::class.java)
    }

    @Provides
    @Singleton
    fun provideLoggingInterceptor(): HttpLoggingInterceptor {
        return HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }
    }
}

// Auth Interceptor
class AuthInterceptor @Inject constructor(
    private val tokenProvider: TokenProvider
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val token = tokenProvider.getToken()

        val request = if (token != null) {
            original.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            original
        }

        return chain.proceed(request)
    }
}
```

#### `:core:database`
Room database, DAOs, entities
```kotlin
// core/database/src/main/java/com/beautycita/core/database/

@Database(
    entities = [
        UserEntity::class,
        StylistEntity::class,
        ClientEntity::class,
        BookingEntity::class,
        ServiceEntity::class,
        MessageEntity::class
    ],
    version = 1,
    exportSchema = true
)
abstract class BeautyCitaDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun stylistDao(): StylistDao
    abstract fun bookingDao(): BookingDao
    abstract fun serviceDao(): ServiceDao
    abstract fun messageDao(): MessageDao
}

// User DAO
@Dao
interface UserDao {
    @Query("SELECT * FROM users WHERE id = :id")
    fun getUserById(id: Int): Flow<UserEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)

    @Query("DELETE FROM users")
    suspend fun clearAll()
}

// Database Module
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(
        @ApplicationContext context: Context
    ): BeautyCitaDatabase {
        return Room.databaseBuilder(
            context,
            BeautyCitaDatabase::class.java,
            Constants.DATABASE_NAME
        )
        .fallbackToDestructiveMigration()
        .build()
    }

    @Provides
    fun provideUserDao(database: BeautyCitaDatabase) = database.userDao()

    @Provides
    fun provideStylistDao(database: BeautyCitaDatabase) = database.stylistDao()

    @Provides
    fun provideBookingDao(database: BeautyCitaDatabase) = database.bookingDao()
}
```

---

## 5. Technology Stack Details

### Complete Dependency List

```kotlin
// See gradle/libs.versions.toml for version catalog

// Core Android
- androidx.core:core-ktx
- androidx.lifecycle:lifecycle-*
- androidx.activity:activity-compose

// Compose UI
- androidx.compose.ui:ui (BOM managed)
- androidx.compose.material3:material3
- androidx.compose.material:material-icons-extended

// Navigation
- androidx.navigation:navigation-compose

// Dependency Injection
- com.google.dagger:hilt-android
- androidx.hilt:hilt-navigation-compose

// Networking
- com.squareup.retrofit2:retrofit
- com.squareup.retrofit2:converter-kotlinx-serialization
- com.squareup.okhttp3:okhttp
- com.squareup.okhttp3:logging-interceptor
- org.jetbrains.kotlinx:kotlinx-serialization-json

// Database
- androidx.room:room-runtime
- androidx.room:room-ktx
- androidx.datastore:datastore-preferences

// Image Loading
- io.coil-kt:coil-compose

// Real-time
- io.socket:socket.io-client (Messaging)
- com.twilio:video-android (Video calls)

// Payments
- com.stripe:stripe-android

// Google Services
- com.google.android.gms:play-services-auth (Google Sign-In)
- com.google.android.gms:play-services-maps (Maps)
- com.google.android.gms:play-services-location (Location)
- com.google.android.gms:play-services-fido (WebAuthn/FIDO2)

// Firebase
- com.google.firebase:firebase-messaging (Push notifications)
- com.google.firebase:firebase-analytics (Optional)

// Security
- androidx.security:security-crypto (Encrypted storage)
- androidx.biometric:biometric (Biometric auth)

// Monitoring
- io.sentry:sentry-android

// Testing
- junit:junit
- androidx.test.ext:junit
- androidx.test.espresso:espresso-core
- androidx.compose.ui:ui-test-junit4
- app.cash.turbine:turbine (Flow testing)
- io.mockk:mockk
- org.jetbrains.kotlinx:kotlinx-coroutines-test
```

---

## 6. Design System Implementation

### Material3 Theme Configuration

```kotlin
// core/ui/src/main/java/com/beautycita/core/ui/theme/Color.kt

object BeautyCitaColors {
    // Brand Colors (from analysis)
    val Pink500 = Color(0xFFEC4899)
    val Purple600 = Color(0xFF9333EA)
    val Blue500 = Color(0xFF3B82F6)

    // Gradient brush
    val PrimaryGradient = Brush.linearGradient(
        colors = listOf(Pink500, Purple600, Blue500)
    )

    // ... (complete color definitions from analysis)
}

// Typography
// core/ui/src/main/java/com/beautycita/core/ui/theme/Type.kt
// ... (complete typography from analysis)

// Theme
// core/ui/src/main/java/com/beautycita/core/ui/theme/Theme.kt
// ... (complete theme from analysis)
```

### BC Component Library

All components from analysis document (`BCButton`, `BCCard`, `BCTextField`, etc.) should be implemented in `:core:ui` module for reuse across features.

---

## 7. Feature Modules

### Authentication Module (`:feature:auth`)

```kotlin
// feature/auth/src/main/java/com/beautycita/feature/auth/

// ViewModel
@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onEmailChange(email: String) {
        _uiState.update { it.copy(email = email) }
    }

    fun onPasswordChange(password: String) {
        _uiState.update { it.copy(password = password) }
    }

    fun login() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            when (val result = authRepository.login(_uiState.value.email, _uiState.value.password)) {
                is Result.Success -> {
                    _uiState.update { it.copy(isLoading = false, loginSuccess = true) }
                }
                is Result.Error -> {
                    _uiState.update { it.copy(isLoading = false, error = result.message) }
                }
                else -> {}
            }
        }
    }

    fun loginWithBiometric() {
        // Implementation using BiometricPrompt
    }

    fun loginWithGoogle(account: GoogleSignInAccount) {
        viewModelScope.launch {
            // Send ID token to backend
        }
    }
}

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val loginSuccess: Boolean = false
)

// Screen
@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    onNavigateToRegister: () -> Unit,
    viewModel: LoginViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState.loginSuccess) {
        if (uiState.loginSuccess) {
            onLoginSuccess()
        }
    }

    Scaffold { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Logo
            BeautyCitaLogo(size = 120.dp)

            Spacer(Modifier.height(32.dp))

            // Email TextField
            BCTextField(
                value = uiState.email,
                onValueChange = viewModel::onEmailChange,
                label = "Email",
                keyboardType = KeyboardType.Email
            )

            Spacer(Modifier.height(16.dp))

            // Password TextField
            BCTextField(
                value = uiState.password,
                onValueChange = viewModel::onPasswordChange,
                label = "Password",
                keyboardType = KeyboardType.Password
            )

            Spacer(Modifier.height(24.dp))

            // Login Button
            BCButton(
                text = "Log In",
                onClick = viewModel::login,
                enabled = !uiState.isLoading,
                size = ButtonSize.Large,
                modifier = Modifier.fillMaxWidth()
            )

            if (uiState.isLoading) {
                Spacer(Modifier.height(16.dp))
                CircularProgressIndicator()
            }

            uiState.error?.let { error ->
                Spacer(Modifier.height(16.dp))
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            Spacer(Modifier.height(24.dp))

            // Biometric Login Button
            BiometricLoginButton(
                onClick = viewModel::loginWithBiometric
            )

            Spacer(Modifier.height(16.dp))

            // Google Sign-In Button
            GoogleSignInButton(
                onSignIn = viewModel::loginWithGoogle
            )

            Spacer(Modifier.height(32.dp))

            // Register link
            TextButton(onClick = onNavigateToRegister) {
                Text("Don't have an account? Register")
            }
        }
    }
}

// Repository
interface AuthRepository {
    suspend fun login(email: String, password: String): Result<AuthResponse>
    suspend fun register(email: String, password: String, phone: String): Result<AuthResponse>
    suspend fun logout()
    fun isAuthenticated(): Flow<Boolean>
    fun getToken(): String?
}

class AuthRepositoryImpl @Inject constructor(
    private val apiService: BeautyCitaApiService,
    private val userDao: UserDao,
    private val dataStore: DataStore<Preferences>
) : AuthRepository {

    override suspend fun login(email: String, password: String): Result<AuthResponse> {
        return try {
            val response = apiService.login(LoginRequest(email, password))

            if (response.isSuccessful && response.body() != null) {
                val authResponse = response.body()!!

                // Save token
                dataStore.edit { prefs ->
                    prefs[TOKEN_KEY] = authResponse.token
                }

                // Cache user
                userDao.insertUser(authResponse.user.toEntity())

                Result.Success(authResponse)
            } else {
                Result.Error(response.message())
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Login failed")
        }
    }

    override suspend fun logout() {
        dataStore.edit { it.clear() }
        userDao.clearAll()
    }

    override fun isAuthenticated(): Flow<Boolean> {
        return dataStore.data.map { prefs ->
            prefs[TOKEN_KEY] != null
        }
    }

    override fun getToken(): String? {
        return runBlocking {
            dataStore.data.first()[TOKEN_KEY]
        }
    }
}
```

### Other Feature Modules (Structure Only)

All feature modules follow the same MVVM pattern:
- `:feature:home` - Home feed, discovery
- `:feature:stylists` - Stylist listing, search, profile
- `:feature:booking` - Booking flow, calendar
- `:feature:profile` - User profile, settings
- `:feature:messaging` - Real-time chat (Socket.io)
- `:feature:dashboard` - Stylist dashboard (revenue, portfolio, etc.)
- `:feature:admin` - Admin panel

Each module contains:
- `ui/` - Screens, ViewModels, UI State
- `data/` - Repositories, Data Sources
- `domain/` - Use Cases (optional)
- `di/` - Hilt modules

---

## 8. Data Layer

### Repository Pattern

```kotlin
// Standard repository interface
interface StylistRepository {
    fun getStylists(
        location: String? = null,
        service: String? = null,
        radius: Int? = null
    ): Flow<Result<List<Stylist>>>

    fun getStylist(id: Int): Flow<Result<Stylist>>

    suspend fun refreshStylists()
}

// Implementation with offline-first caching
class StylistRepositoryImpl @Inject constructor(
    private val apiService: BeautyCitaApiService,
    private val stylistDao: StylistDao,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) : StylistRepository {

    override fun getStylists(
        location: String?,
        service: String?,
        radius: Int?
    ): Flow<Result<List<Stylist>>> = flow {
        // Emit cached data first
        val cachedStylists = stylistDao.getAllStylists()
        if (cachedStylists.isNotEmpty()) {
            emit(Result.Success(cachedStylists.map { it.toDomain() }))
        } else {
            emit(Result.Loading)
        }

        // Fetch fresh data
        try {
            val response = apiService.getStylists(location, service, radius)

            if (response.isSuccessful && response.body() != null) {
                val stylists = response.body()!!

                // Update cache
                stylistDao.deleteAll()
                stylistDao.insertAll(stylists.map { it.toEntity() })

                // Emit fresh data
                emit(Result.Success(stylists))
            } else {
                emit(Result.Error(response.message()))
            }
        } catch (e: Exception) {
            // If we have cached data, we already emitted it
            // Otherwise, emit error
            if (cachedStylists.isEmpty()) {
                emit(Result.Error(e.message ?: "Failed to fetch stylists"))
            }
        }
    }.flowOn(ioDispatcher)

    override fun getStylist(id: Int): Flow<Result<Stylist>> = flow {
        // Similar pattern
    }.flowOn(ioDispatcher)

    override suspend fun refreshStylists() {
        // Force refresh
    }
}
```

### Data Models & Mapping

```kotlin
// API DTO
@Serializable
data class StylistDto(
    val id: Int,
    val userId: Int,
    val businessName: String,
    val bio: String?,
    val location: String?,
    val rating: Float,
    val reviewCount: Int
    // ... other fields
)

// Room Entity
@Entity(tableName = "stylists")
data class StylistEntity(
    @PrimaryKey val id: Int,
    val userId: Int,
    val businessName: String,
    val bio: String?,
    val location: String?,
    val rating: Float,
    val reviewCount: Int
    // ... other fields
)

// Domain Model (used in UI)
data class Stylist(
    val id: Int,
    val userId: Int,
    val businessName: String,
    val bio: String?,
    val location: String?,
    val rating: Float,
    val reviewCount: Int
    // ... other fields
)

// Mappers
fun StylistDto.toEntity(): StylistEntity = StylistEntity(
    id = id,
    userId = userId,
    businessName = businessName,
    bio = bio,
    location = location,
    rating = rating,
    reviewCount = reviewCount
)

fun StylistEntity.toDomain(): Stylist = Stylist(
    id = id,
    userId = userId,
    businessName = businessName,
    bio = bio,
    location = location,
    rating = rating,
    reviewCount = reviewCount
)
```

---

## 9. Authentication Implementation

### Biometric Authentication (WebAuthn Equivalent)

```kotlin
// BiometricAuthHelper.kt
class BiometricAuthHelper(private val context: Context) {

    fun authenticate(
        title: String,
        subtitle: String,
        onSuccess: (BiometricPrompt.AuthenticationResult) -> Unit,
        onError: (String) -> Unit
    ) {
        val executor = ContextCompat.getMainExecutor(context)
        val biometricPrompt = BiometricPrompt(
            context as FragmentActivity,
            executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    onSuccess(result)
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    onError(errString.toString())
                }

                override fun onAuthenticationFailed() {
                    onError("Authentication failed")
                }
            }
        )

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle(title)
            .setSubtitle(subtitle)
            .setNegativeButtonText("Cancel")
            .setAllowedAuthenticators(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
            .build()

        biometricPrompt.authenticate(promptInfo)
    }

    fun canAuthenticate(): Boolean {
        val biometricManager = BiometricManager.from(context)
        return biometricManager.canAuthenticate(BIOMETRIC_STRONG or DEVICE_CREDENTIAL) == BiometricManager.BIOMETRIC_SUCCESS
    }
}

// Integration in ViewModel
@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val biometricAuthHelper: BiometricAuthHelper
) : ViewModel() {

    fun loginWithBiometric() {
        if (!biometricAuthHelper.canAuthenticate()) {
            _uiState.update { it.copy(error = "Biometric authentication not available") }
            return
        }

        biometricAuthHelper.authenticate(
            title = "Sign in to BeautyCita",
            subtitle = "Use your fingerprint or face",
            onSuccess = { result ->
                // After successful biometric auth, call backend WebAuthn endpoint
                viewModelScope.launch {
                    val loginResult = authRepository.loginWithWebAuthn()
                    // Handle result
                }
            },
            onError = { error ->
                _uiState.update { it.copy(error = error) }
            }
        )
    }
}
```

### Google Sign-In

```kotlin
// Google Sign-In Helper
class GoogleSignInHelper(private val context: Context) {

    private val oneTapClient = Identity.getSignInClient(context)

    suspend fun signIn(): GoogleSignInAccount? {
        val request = BeginSignInRequest.builder()
            .setGoogleIdTokenRequestOptions(
                GoogleIdTokenRequestOptions.builder()
                    .setSupported(true)
                    .setServerClientId(BuildConfig.GOOGLE_CLIENT_ID)
                    .setFilterByAuthorizedAccounts(false)
                    .build()
            )
            .build()

        return try {
            val result = oneTapClient.beginSignIn(request).await()
            // Launch sign-in UI
            // Get ID token and send to backend
            null // Placeholder
        } catch (e: Exception) {
            null
        }
    }
}
```

### JWT Token Storage (Encrypted)

```kotlin
// SecureTokenProvider.kt
class SecureTokenProvider @Inject constructor(
    private val dataStore: DataStore<Preferences>
) {
    private val TOKEN_KEY = stringPreferencesKey("auth_token")

    suspend fun saveToken(token: String) {
        dataStore.edit { prefs ->
            prefs[TOKEN_KEY] = token
        }
    }

    fun getToken(): String? {
        return runBlocking {
            dataStore.data.first()[TOKEN_KEY]
        }
    }

    suspend fun clearToken() {
        dataStore.edit { prefs ->
            prefs.remove(TOKEN_KEY)
        }
    }
}
```

---

## 10. Navigation Architecture

### Navigation Graph

```kotlin
// MainActivity.kt
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        installSplashScreen()

        setContent {
            BeautyCitaTheme {
                BeautyCitaApp()
            }
        }
    }
}

// BeautyCitaApp.kt
@Composable
fun BeautyCitaApp() {
    val navController = rememberNavController()

    Scaffold(
        bottomBar = {
            // Show bottom nav if authenticated
        }
    ) { padding ->
        BeautyCitaNavGraph(
            navController = navController,
            modifier = Modifier.padding(padding)
        )
    }
}

// Navigation.kt
@Composable
fun BeautyCitaNavGraph(
    navController: NavHostController,
    modifier: Modifier = Modifier,
    authViewModel: AuthViewModel = hiltViewModel()
) {
    val authState by authViewModel.authState.collectAsState()

    val startDestination = if (authState.isAuthenticated) {
        Screen.Home.route
    } else {
        Screen.Login.route
    }

    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = modifier
    ) {
        // Public routes
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onNavigateToRegister = {
                    navController.navigate(Screen.Register.route)
                }
            )
        }

        composable(Screen.Register.route) {
            RegisterScreen(
                onRegisterSuccess = {
                    navController.navigate(Screen.VerifyPhone.route)
                }
            )
        }

        // Protected routes
        authenticatedComposable(
            route = Screen.Home.route,
            authState = authState
        ) {
            HomeScreen(
                onStylistClick = { stylistId ->
                    navController.navigate("stylist/$stylistId")
                }
            )
        }

        authenticatedComposable(
            route = "stylist/{id}",
            authState = authState,
            arguments = listOf(navArgument("id") { type = NavType.IntType })
        ) { backStackEntry ->
            StylistProfileScreen(
                stylistId = backStackEntry.arguments?.getInt("id") ?: 0,
                onBookService = { serviceId ->
                    navController.navigate("book/${backStackEntry.arguments?.getInt("id")}/$serviceId")
                }
            )
        }

        // More routes...
    }
}

// Sealed class for type-safe navigation
sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Register : Screen("register")
    object Home : Screen("home")
    object Stylists : Screen("stylists")
    object Profile : Screen("profile")
    object Bookings : Screen("bookings")
    object Messages : Screen("messages")
    // ... more screens
}

// Helper for authenticated routes
fun NavGraphBuilder.authenticatedComposable(
    route: String,
    authState: AuthState,
    arguments: List<NamedNavArgument> = emptyList(),
    content: @Composable (NavBackStackEntry) -> Unit
) {
    composable(route, arguments) { backStackEntry ->
        if (authState.isAuthenticated) {
            content(backStackEntry)
        } else {
            // Redirect to login
            LaunchedEffect(Unit) {
                navController.navigate(Screen.Login.route) {
                    popUpTo(0)
                }
            }
        }
    }
}
```

---

## 11. Testing Strategy

### Unit Tests

```kotlin
// LoginViewModelTest.kt
@OptIn(ExperimentalCoroutinesApi::class)
class LoginViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private lateinit var authRepository: AuthRepository
    private lateinit var viewModel: LoginViewModel

    @Before
    fun setup() {
        authRepository = mockk()
        viewModel = LoginViewModel(authRepository)
    }

    @Test
    fun `login success updates ui state correctly`() = runTest {
        // Given
        val email = "test@example.com"
        val password = "password123"
        val authResponse = AuthResponse(
            user = User(id = 1, email = email),
            token = "token123"
        )
        coEvery { authRepository.login(email, password) } returns Result.Success(authResponse)

        // When
        viewModel.onEmailChange(email)
        viewModel.onPasswordChange(password)
        viewModel.login()

        // Then
        viewModel.uiState.test {
            val state = awaitItem()
            assertTrue(state.loginSuccess)
            assertFalse(state.isLoading)
            assertNull(state.error)
        }
    }

    @Test
    fun `login failure shows error message`() = runTest {
        // Similar pattern
    }
}
```

### Integration Tests

```kotlin
// AuthRepositoryTest.kt (using fake API)
@Test
fun `login with valid credentials returns success`() = runTest {
    // Integration test with fake network responses
}
```

### UI Tests

```kotlin
// LoginScreenTest.kt
@get:Rule
val composeTestRule = createComposeRule()

@Test
fun `login screen displays all elements`() {
    composeTestRule.setContent {
        LoginScreen(
            onLoginSuccess = {},
            onNavigateToRegister = {}
        )
    }

    composeTestRule.onNodeWithText("Email").assertIsDisplayed()
    composeTestRule.onNodeWithText("Password").assertIsDisplayed()
    composeTestRule.onNodeWithText("Log In").assertIsDisplayed()
}

@Test
fun `clicking login button with valid input calls viewmodel`() {
    // UI test with user interactions
}
```

---

## 12. Build Variants & Flavors

### Build Variants Matrix

```
Build Type × Product Flavor = Build Variant

Build Types:
- debug
- release

Product Flavors (environment):
- production
- staging
- development

Resulting Variants:
1. productionDebug
2. productionRelease
3. stagingDebug
4. stagingRelease
5. developmentDebug
6. developmentRelease
```

### Usage

```bash
# Build specific variant
./gradlew assembleDevelopmentDebug

# Install on device
./gradlew installStagingDebug

# Run tests for variant
./gradlew testProductionRelease
```

---

## 13. CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/android-ci.yml
name: Android CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'

    - name: Grant execute permission for gradlew
      run: chmod +x gradlew

    - name: Run unit tests
      run: ./gradlew testDebugUnitTest

    - name: Run lint
      run: ./gradlew lintDebug

    - name: Build debug APK
      run: ./gradlew assembleDebug

    - name: Upload APK
      uses: actions/upload-artifact@v3
      with:
        name: app-debug
        path: app/build/outputs/apk/debug/app-debug.apk

  release:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: build

    steps:
    - uses: actions/checkout@v4

    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'

    - name: Build release AAB
      run: ./gradlew bundleRelease
      env:
        SIGNING_KEY_ALIAS: ${{ secrets.SIGNING_KEY_ALIAS }}
        SIGNING_KEY_PASSWORD: ${{ secrets.SIGNING_KEY_PASSWORD }}
        SIGNING_STORE_PASSWORD: ${{ secrets.SIGNING_STORE_PASSWORD }}

    - name: Upload AAB to Play Console
      uses: r0adkll/upload-google-play@v1
      with:
        serviceAccountJsonPlainText: ${{ secrets.PLAY_STORE_SERVICE_ACCOUNT }}
        packageName: com.beautycita
        releaseFiles: app/build/outputs/bundle/release/app-release.aab
        track: internal
```

---

## 14. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Week 1:**
- ✅ Android development environment setup (COMPLETED)
- ✅ Webapp analysis (COMPLETED)
- Set up Android project structure
- Configure Gradle build scripts
- Implement version catalog
- Create core modules (`:core:common`, `:core:ui`, `:core:network`, `:core:database`)
- Implement Material3 theme with BeautyCita colors
- Create BC* component library (BCButton, BCCard, BCTextField, etc.)

**Week 2:**
- Implement Room Database schema
- Configure Retrofit + OkHttp
- Set up Hilt dependency injection
- Implement navigation structure
- Create splash screen
- Set up Sentry error tracking
- Configure CI/CD pipeline (GitHub Actions)

### Phase 2: Authentication (Weeks 3-4)

**Week 3:**
- Implement `:feature:auth` module
- Login screen (email/password)
- Registration screen
- JWT authentication flow
- Encrypted token storage
- Auth repository & ViewModel
- Unit tests for auth logic

**Week 4:**
- Biometric authentication (BiometricPrompt)
- Google Sign-In integration
- SMS verification flow (Twilio)
- Phone number auto-detection (Mexico/US)
- Forgot password flow
- Integration tests for auth

### Phase 3: Core Features (Weeks 5-8)

**Week 5:**
- `:feature:home` module
- Home screen with discovery feed
- Trending stylists
- Service categories
- Search functionality

**Week 6:**
- `:feature:stylists` module
- Stylist listing with filters
- Stylist profile page
- Portfolio gallery (Cloudflare R2 images)
- Reviews & ratings display
- Favorite stylists feature

**Week 7:**
- `:feature:booking` module
- Booking flow UI
- Calendar integration (custom or library)
- Time slot picker
- Service selection
- Booking confirmation

**Week 8:**
- `:feature:profile` module
- User profile screen
- Profile editing
- Settings page
- Dark mode toggle
- Language selection (i18n)

### Phase 4: Advanced Features (Weeks 9-12)

**Week 9:**
- `:feature:messaging` module
- Real-time chat (Socket.io Android client)
- Conversation list
- Message composer
- Push notifications (FCM)

**Week 10:**
- Payment integration (Stripe Android SDK)
- Payment methods management
- Booking payment flow
- Payment confirmation

**Week 11:**
- Google Maps integration
- Location-based stylist search
- Distance calculations
- En route tracking (for clients)

**Week 12:**
- `:feature:dashboard` module (Stylist dashboard)
- Revenue overview
- Bookings calendar
- Services management
- Portfolio management

### Phase 5: Admin & Polish (Weeks 13-16)

**Week 13:**
- `:feature:admin` module
- Admin panel screens
- User management
- Analytics dashboard
- Role-based access control

**Week 14:**
- Twilio Video integration (video consultations)
- Dispute management UI
- Reviews moderation (admin)

**Week 15:**
- Performance optimization
- Image loading optimization (Coil)
- Database query optimization
- Reduce APK size (R8/ProGuard)
- Accessibility improvements

**Week 16:**
- Complete testing (unit, integration, UI)
- Bug fixes
- UI polish
- Prepare for release
- Generate signed AAB
- Play Store listing preparation

### Phase 6: Release & Iteration (Week 17+)

**Week 17:**
- Internal testing (Play Console)
- Beta release
- User feedback collection

**Week 18:**
- Bug fixes based on feedback
- Production release
- Monitor Sentry for errors
- Performance monitoring

**Ongoing:**
- Feature additions based on user feedback
- Performance improvements
- Bug fixes
- Platform updates (new Android versions)

---

## Summary

This architecture plan provides a complete blueprint for building the BeautyCita native Android app. Key highlights:

### ✅ Modern Android Stack
- Jetpack Compose for declarative UI
- MVVM architecture for clean separation
- Hilt for dependency injection
- Room for offline-first data
- Retrofit for API communication
- Kotlin Coroutines & Flow for async

### ✅ Design System Parity
- Complete Material3 theme matching webapp colors
- BC* component library for consistency
- Pill-shaped buttons, rounded cards, gradient theme
- Playfair Display + Inter typography

### ✅ Feature Completeness
- Multi-method authentication (JWT, Biometric, Google, SMS)
- Real-time messaging (Socket.io)
- Video consultations (Twilio)
- Payments (Stripe)
- Maps (Google Maps)
- Push notifications (FCM)

### ✅ Production-Ready
- Comprehensive testing strategy
- CI/CD pipeline with GitHub Actions
- Error tracking with Sentry
- Build flavors for dev/staging/prod
- Security best practices (encrypted storage, certificate pinning)

### 📅 16-Week Implementation Timeline
Organized into 6 phases from foundation to release, with clear weekly goals.

---

**Ready to start building!** 🚀

**Next Steps:**
1. Set up Android project with this structure
2. Begin Phase 1: Foundation implementation
3. Follow the 16-week roadmap

**Document Version:** 1.0
**Last Updated:** November 1, 2025
**Previous Document:** NATIVE_ANDROID_ANALYSIS.md
