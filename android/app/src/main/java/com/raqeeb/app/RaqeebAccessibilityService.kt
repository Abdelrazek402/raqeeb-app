package com.raqeeb.app

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import android.util.Log
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * BlockedAppEvent: Data payload representing a blocked application detection.
 */
data class BlockedAppEvent(
    val packageName: String,
    val wasSelectedForBlocking: Boolean = true,
    val timestamp: Long = System.currentTimeMillis()
)

/**
 * RaqeebAccessibilityService
 * 
 * Production-grade Accessibility Service that monitors foreground window changes
 * and exposes package transitions reactively to the UI layer via Kotlin StateFlows.
 */
class RaqeebAccessibilityService : AccessibilityService() {

    private lateinit var prefs: SharedPreferences

    companion object {
        private const val TAG = "RaqeebAccessibility"
        private const val PREFS_NAME = "raqeeb_blocker_prefs"
        private const val KEY_BLOCKED_PACKAGES = "key_blocked_packages"
        private const val NOTIFICATION_CHANNEL_ID = "raqeeb_blocked_app_attempts"
        private const val NOTIFICATION_ID_BASE = 5200
        private const val BLOCKER_LAUNCH_RETRY_DELAY_MS = 500L
        private val _serviceConnected = MutableStateFlow(false)
        val serviceConnected: StateFlow<Boolean> = _serviceConnected.asStateFlow()

        // Reactive StateFlow for live monitored packages list
        private val _monitoredAppsFlow = MutableStateFlow<Set<String>>(emptySet())
        val monitoredAppsFlow: StateFlow<Set<String>> = _monitoredAppsFlow.asStateFlow()

        // In-memory latest event only; this is not a durable attempt history.
        private val _blockedEventsFlow = MutableStateFlow<BlockedAppEvent?>(null)
        val blockedEventsFlow: StateFlow<BlockedAppEvent?> = _blockedEventsFlow.asStateFlow()

        /**
         * Updates the entire monitored applications list dynamically.
         */
        fun updateMonitoredApps(context: Context, newApps: Set<String>) {
            val selected = newApps.toSet()
            saveToPreferences(context, selected)
            _monitoredAppsFlow.value = selected
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

        fun getMonitoredApps(context: Context): Set<String> {
            return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .getStringSet(KEY_BLOCKED_PACKAGES, emptySet())
                ?.toSet()
                ?: emptySet()
        }

        private fun saveToPreferences(context: Context, apps: Set<String>) {
            check(
                context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                    .edit()
                    .putStringSet(KEY_BLOCKED_PACKAGES, apps.toSet())
                    .commit()
            ) {
                "Could not persist the selected blocked-app list."
            }
        }
    }

    private var currentForegroundPackage: String? = null
    private var activeBlockedPackage: String? = null
    private var lastEventTimestamp: Long = 0
    private val blockerRetryHandler = Handler(Looper.getMainLooper())

    override fun onCreate() {
        super.onCreate()
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        loadPersistedApps()
        createNotificationChannel()
    }

    private fun loadPersistedApps() {
        val saved = prefs.getStringSet(KEY_BLOCKED_PACKAGES, null)
        _monitoredAppsFlow.value = saved?.toSet() ?: emptySet()
        Log.i(TAG, "Loaded ${_monitoredAppsFlow.value.size} persisted restricted packages.")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        // Detect foreground window state transitions
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val foregroundPackage = event.packageName?.toString() ?: return
            val foregroundClass = event.className?.toString() ?: ""
            val currentTime = System.currentTimeMillis()
            val previousForegroundPackage = currentForegroundPackage
            val previousEventTimestamp = lastEventTimestamp

            currentForegroundPackage = foregroundPackage
            lastEventTimestamp = currentTime

            // Skip internal Raqeeb app events
            if (foregroundPackage == packageName) {
                return
            }

            val isRestricted = isMonitoredApp(foregroundPackage)
            if (!isRestricted) {
                activeBlockedPackage = null
                blockerRetryHandler.removeCallbacksAndMessages(null)
                return
            }

            if (activeBlockedPackage == foregroundPackage) {
                return
            }

            // Debounce rapid duplicate events
            if (foregroundPackage == previousForegroundPackage &&
                currentTime - previousEventTimestamp < 800
            ) {
                return
            }

            Log.i(TAG, "Foreground App Detected: $foregroundPackage (Class: $foregroundClass)")

            // Check if application is restricted
            // Publish this measured foreground event for the current process only.
            if (isRestricted) {
                activeBlockedPackage = foregroundPackage
                Log.w(TAG, "Restricted app detected: $foregroundPackage")
                
                _blockedEventsFlow.value = BlockedAppEvent(
                    packageName = foregroundPackage,
                    wasSelectedForBlocking = true,
                    timestamp = currentTime
                )
                executeBlockingAction(foregroundPackage)
                showBlockedAttemptNotification(foregroundPackage)
            }
        }
    }

    private fun isMonitoredApp(pkgName: String): Boolean {
        return _monitoredAppsFlow.value.contains(pkgName)
    }

    private fun executeBlockingAction(blockedPackage: String) {
        launchBlockerActivity(blockedPackage)
        blockerRetryHandler.postDelayed({
            val stillInBlockedApp = currentForegroundPackage == blockedPackage
            val blockerIsVisible = BlockerActivity.isShowingPackage(blockedPackage)
            if (stillInBlockedApp && !blockerIsVisible && activeBlockedPackage == blockedPackage) {
                Log.w(TAG, "BlockerActivity was not foregrounded; retrying once for $blockedPackage")
                launchBlockerActivity(blockedPackage)
                blockerRetryHandler.postDelayed({
                    if (currentForegroundPackage == blockedPackage &&
                        !BlockerActivity.isShowingPackage(blockedPackage) &&
                        activeBlockedPackage == blockedPackage
                    ) {
                        Log.e(TAG, "BlockerActivity did not foreground after retry; returning to Home.")
                        performGlobalAction(GLOBAL_ACTION_HOME)
                    }
                }, BLOCKER_LAUNCH_RETRY_DELAY_MS)
            }
        }, BLOCKER_LAUNCH_RETRY_DELAY_MS)
    }

    private fun launchBlockerActivity(blockedPackage: String) {
        try {
            val blockingIntent = Intent(this, BlockerActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                putExtra("BLOCKED_PACKAGE", blockedPackage)
                putExtra("BLOCKED_TIMESTAMP", System.currentTimeMillis())
            }
            startActivity(blockingIntent)
            Log.i(TAG, "Requested BlockerActivity for $blockedPackage")
        } catch (error: RuntimeException) {
            Log.e(TAG, "Failed to launch BlockerActivity for $blockedPackage; returning to Home", error)
            performGlobalAction(GLOBAL_ACTION_HOME)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel(
            NOTIFICATION_CHANNEL_ID,
            "محاولات فتح التطبيقات المحجوبة",
            NotificationManager.IMPORTANCE_DEFAULT
        ).apply {
            description = "إشعار عند اكتشاف محاولة فتح تطبيق اختاره المستخدم للحجب"
        }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    private fun showBlockedAttemptNotification(blockedPackage: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            Log.i(TAG, "Blocked-app notification skipped because notification permission is not granted.")
            return
        }

        val label = try {
            packageManager.getApplicationInfo(blockedPackage, 0).loadLabel(packageManager).toString()
        } catch (_: PackageManager.NameNotFoundException) {
            blockedPackage
        }
        val blockerIntent = Intent(this, BlockerActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra("BLOCKED_PACKAGE", blockedPackage)
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            blockedPackage.hashCode(),
            blockerIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notification = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, NOTIFICATION_CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }.setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("رقيب: محاولة فتح تطبيق محدد للحجب")
            .setContentText("تم رصد محاولة فتح $label")
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setCategory(Notification.CATEGORY_REMINDER)
            .build()
        NotificationManagerCompat.from(this).notify(
            NOTIFICATION_ID_BASE + (blockedPackage.hashCode() and 0x7fffffff) % 1000,
            notification
        )
    }

    override fun onInterrupt() {
        blockerRetryHandler.removeCallbacksAndMessages(null)
        _serviceConnected.value = false
        Log.w(TAG, "Raqeeb Accessibility Service was interrupted.")
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        _serviceConnected.value = true
        loadPersistedApps()
        Log.i(TAG, "Raqeeb Accessibility Service connected and active.")
    }

    override fun onDestroy() {
        blockerRetryHandler.removeCallbacksAndMessages(null)
        _serviceConnected.value = false
        super.onDestroy()
    }
}
