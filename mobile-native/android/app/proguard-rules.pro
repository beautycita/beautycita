# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# ============================================
# React Native Core
# ============================================
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keepclassmembers class * { @com.facebook.react.uimanager.annotations.ReactProp <methods>; }
-keepclassmembers class * { @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>; }

# React Native modules
-dontwarn com.facebook.react.**
-dontwarn com.facebook.hermes.**

# Keep native methods
-keepclassmembers class * {
    native <methods>;
}

# ============================================
# Socket.IO Client
# ============================================
-keep class io.socket.** { *; }
-keep class io.socket.client.** { *; }
-keep class io.socket.emitter.** { *; }
-keep class io.socket.engineio.** { *; }
-dontwarn io.socket.**
-dontwarn org.json.**

# ============================================
# OneSignal Push Notifications
# ============================================
-keep class com.onesignal.** { *; }
-dontwarn com.onesignal.**

# Keep OneSignal callbacks
-keepclassmembers class * implements com.onesignal.OSNotificationOpenedHandler {
    *;
}
-keepclassmembers class * implements com.onesignal.OSNotificationWillShowInForegroundHandler {
    *;
}

# ============================================
# Stripe SDK
# ============================================
-keep class com.stripe.** { *; }
-keep class com.stripe.android.** { *; }
-dontwarn com.stripe.**

# ============================================
# Google Maps & Location Services
# ============================================
-keep class com.google.android.gms.maps.** { *; }
-keep interface com.google.android.gms.maps.** { *; }
-keep class com.google.android.gms.location.** { *; }
-dontwarn com.google.android.gms.**

# React Native Maps
-keep class com.airbnb.android.react.maps.** { *; }
-keep interface com.airbnb.android.react.maps.** { *; }

# ============================================
# Image Picker & Camera
# ============================================
-keep class com.imagepicker.** { *; }
-dontwarn com.imagepicker.**

# ============================================
# AsyncStorage (Data Persistence)
# ============================================
-keep class com.reactnativecommunity.asyncstorage.** { *; }
-dontwarn com.reactnativecommunity.asyncstorage.**

# ============================================
# Biometric Authentication
# ============================================
-keep class androidx.biometric.** { *; }
-keep class androidx.core.hardware.fingerprint.** { *; }
-dontwarn androidx.biometric.**

# ============================================
# OkHttp & Networking
# ============================================
-keepattributes Signature
-keepattributes *Annotation*
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# ============================================
# Gson (JSON Parsing)
# ============================================
-keep class com.google.gson.** { *; }
-keep class sun.misc.Unsafe { *; }
-keepclassmembers,allowobfuscation class * {
  @com.google.gson.annotations.SerializedName <fields>;
}

# ============================================
# Kotlin (Used by React Native)
# ============================================
-keep class kotlin.** { *; }
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**
-keepclassmembers class **$WhenMappings {
    <fields>;
}

# ============================================
# General Rules
# ============================================
# Keep line numbers for better crash reports
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep annotations
-keepattributes *Annotation*

# Keep generic signatures (for reflection)
-keepattributes Signature

# Keep exceptions
-keepattributes Exceptions

# Keep inner classes
-keepattributes InnerClasses

# Keep enum classes
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep Parcelables
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep Serializable classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# ============================================
# Suppress Warnings
# ============================================
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
