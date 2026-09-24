# ==============================================================================
# Raqeeb Android Application - ProGuard / R8 Optimization & Obfuscation Rules
# ==============================================================================

# Keep line numbers and source file names for accurate crash debugging stacktraces
-keepattributes SourceFile,LineNumberTable

# Preserve Annotations and Generic Signatures
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# Preserve all Android Components (Activities, Services, Receivers, Providers)
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider
-keep public class * extends android.app.backup.BackupAgent
-keep public class * extends android.preference.Preference

# Preserve Raqeeb Specific Core Services & Activities
-keep class com.raqeeb.app.RaqeebAccessibilityService { *; }
-keep class com.raqeeb.app.MainActivity { *; }
-keep class com.raqeeb.app.BlockerActivity { *; }
-keep class com.raqeeb.app.BlockOverlayActivity { *; }

# Preserve ViewBinding classes
-keep class com.raqeeb.app.databinding.** { *; }

# Preserve AndroidX & Material Design Components
-keep class androidx.appcompat.** { *; }
-keep class androidx.constraintlayout.** { *; }
-keep class com.google.android.material.** { *; }

# Preserve Custom Views and their constructors
-keepclasseswithmembers class * {
    public <init>(android.content.Context, android.util.AttributeSet);
    public <init>(android.content.Context, android.util.AttributeSet, int);
}

# Preserve Parcelable and Serializable implementations
-keepclassmembers class * implements android.os.Parcelable {
    static ** CREATOR;
}
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Preserve native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep Kotlin standard library metadata
-dontwarn kotlin.**
-keep class kotlin.Metadata { *; }
