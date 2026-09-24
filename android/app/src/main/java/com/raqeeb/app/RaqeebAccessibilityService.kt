package com.raqeeb.app

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.view.accessibility.AccessibilityEvent
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * BlockedAppEvent: Data payload representing a blocked application detection.
 */
data class BlockedAppEvent(
    val packageName: String,
    val isBlocked: Boolean = true,
    val timestamp: Long = System.currentTimeMillis()
)

/**
 * RaqeebAccessibilityService
 * 
 * Production-grade Accessibility Service that monitors foreground window changes
 * and exposes package transitions reactively to the UI layer via Kotlin SharedFlow.
 */
class RaqeebAccessibilityService : AccessibilityService() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private lateinit var prefs: SharedPreferences

    companion object {
        private const val TAG = "RaqeebAccessibility"
        private const val PREFS_NAME = "raqeeb_blocker_prefs"
        private const val KEY_BLOCKED_PACKAGES = "key_blocked_packages"

        // Default restricted application packages
        val DEFAULT_BLOCKED_PACKAGES = setOf(
            "com.zhiliaoapp.musically",      // TikTok
            "com.ss.android.ugc.trill",      // TikTok Lite
            "com.instagram.android",         // Instagram
            "com.google.android.youtube",    // YouTube (Shorts)
            "com.facebook.katana",           // Facebook
            "com.snapchat.android",          // Snapchat
            "com.twitter.android",           // X / Twitter
            "org.telegram.messenger"         // Telegram
        )

        // Reactive StateFlow for live monitored packages list
        private val _monitoredAppsFlow = MutableStateFlow<Set<String>>(DEFAULT_BLOCKED_PACKAGES)
        val monitoredAppsFlow: StateFlow<Set<String>> = _monitoredAppsFlow.asStateFlow()

        // Reactive SharedFlow exposing detected package changes and blocked app events to UI layer
        private val _blockedEventsFlow = MutableSharedFlow<BlockedAppEvent>(replay = 1, extraBufferCapacity = 32)
        val blockedEventsFlow: SharedFlow<BlockedAppEvent> = _blockedEventsFlow.asSharedFlow()

        /**
         * Updates the entire monitored applications list dynamically.
         */
        fun updateMonitoredApps(context: Context, newApps: Set<String>) {
            _monitoredAppsFlow.value = newApps
            saveToPreferences(context, newApps)
            Log.i(TAG, "Monitored apps updated -> Count: ${newApps.size}")
        }

        /**
         * Adds a package to the active monitored list at runtime.
         */
        fun addMonitoredApp(context: Context, packageName: String) {
            val updatedSet = _monitoredAppsFlow.value.toMutableSet().apply { add(packageName) }
            _monitoredAppsFlow.value = updatedSet
            saveToPreferences(context, updatedSet)
            Log.i(TAG, "Added app to block list: $packageName")
        }

        /**
         * Removes a package from the active monitored list at runtime.
         */
        fun removeMonitoredApp(context: Context, packageName: String) {
            val updatedSet = _monitoredAppsFlow.value.toMutableSet().apply { remove(packageName) }
            _monitoredAppsFlow.value = updatedSet
            saveToPreferences(context, updatedSet)
            Log.i(TAG, "Removed app from block list: $packageName")
        }

        private fun saveToPreferences(context: Context, apps: Set<String>) {
            try {
                val p = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                p.edit().putStringSet(KEY_BLOCKED_PACKAGES, apps).apply()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to persist blocked apps set", e)
            }
        }
    }

    private var currentForegroundPackage: String? = null
    private var lastEventTimestamp: Long = 0

    override fun onCreate() {
        super.onCreate()
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        loadPersistedApps()
    }

    private fun loadPersistedApps() {
        val saved = prefs.getStringSet(KEY_BLOCKED_PACKAGES, null)
        if (!saved.isNullOrEmpty()) {
            _monitoredAppsFlow.value = saved
            Log.i(TAG, "Loaded ${saved.size} persisted restricted packages into StateFlow.")
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        // Detect foreground window state transitions
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val foregroundPackage = event.packageName?.toString() ?: return
            val foregroundClass = event.className?.toString() ?: ""
            val currentTime = System.currentTimeMillis()

            // Skip internal Raqeeb app events
            if (foregroundPackage == packageName) {
                return
            }

            // Debounce rapid duplicate events
            if (foregroundPackage == currentForegroundPackage && (currentTime - lastEventTimestamp) < 800) {
                return
            }

            currentForegroundPackage = foregroundPackage
            lastEventTimestamp = currentTime

            Log.i(TAG, "Foreground App Detected: $foregroundPackage (Class: $foregroundClass)")

            // Check if application is restricted
            val isRestricted = isMonitoredApp(foregroundPackage)

            // Emit package transition to SharedFlow for UI observation
            if (isRestricted) {
                Log.w(TAG, "Restricted app detected! Emitting event to SharedFlow: $foregroundPackage")
                
                serviceScope.launch {
                    _blockedEventsFlow.emit(
                        BlockedAppEvent(
                            packageName = foregroundPackage,
                            isBlocked = true,
                            timestamp = currentTime
                        )
                    )
                }

                executeBlockingAction(foregroundPackage)
            }
        }
    }

    private fun isMonitoredApp(pkgName: String): Boolean {
        return _monitoredAppsFlow.value.contains(pkgName)
    }

    private fun executeBlockingAction(blockedPackage: String) {
        // Step 1: Return to Home
        performGlobalAction(GLOBAL_ACTION_HOME)

        // Step 2: Launch BlockerActivity
        try {
            val blockingIntent = Intent(this, BlockerActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                putExtra("BLOCKED_PACKAGE", blockedPackage)
                putExtra("BLOCKED_TIMESTAMP", System.currentTimeMillis())
            }
            startActivity(blockingIntent)
            Log.i(TAG, "Launched BlockerActivity for $blockedPackage")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch BlockerActivity for $blockedPackage", e)
        }
    }

    override fun onInterrupt() {
        Log.w(TAG, "Raqeeb Accessibility Service was interrupted.")
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        loadPersistedApps()
        Log.i(TAG, "Raqeeb Accessibility Service connected and active.")
    }
}
