# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Expo modules — R8 renames Record/options classes and breaks JS↔native casting
# (e.g. Location.getLastKnownPositionAsync → expo.modules.location.records)
-keep class expo.modules.** { *; }

# Stripe optional push-provisioning SDK (not shipped; referenced by stripe-react-native)
-dontwarn com.stripe.android.pushProvisioning.**

# Add any project specific keep options here:
