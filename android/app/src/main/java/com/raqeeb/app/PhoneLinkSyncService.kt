package com.raqeeb.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class PhoneLinkSyncService : Service() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()
    private var pollingJob: Job? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, notification())
        pollingJob = scope.launch { pollCommands() }
    }

    private suspend fun pollCommands() {
        while (currentCoroutineContext().isActive) {
            val prefs = getSharedPreferences(PREFS, MODE_PRIVATE)
            val baseUrl = prefs.getString(KEY_SERVER_URL, null)?.trim().orEmpty()
            val deviceToken = prefs.getString(KEY_DEVICE_TOKEN, null)?.trim().orEmpty()
            val deviceId = prefs.getString(KEY_DEVICE_ID, android.os.Build.SERIAL)?.trim().orEmpty()
            if (baseUrl.isNotEmpty() && deviceToken.isNotEmpty() && deviceId.isNotEmpty()) {
                try {
                    val request = Request.Builder()
                        .url("${baseUrl.trimEnd('/')}/api/phonelink/commands?deviceId=${java.net.URLEncoder.encode(deviceId, "UTF-8")}")
                        .header("X-Device-Token", deviceToken)
                        .get()
                        .build()
                    client.newCall(request).execute().use { response ->
                        if (response.isSuccessful) {
                            val body = response.body?.string().orEmpty()
                            body.takeIf(String::isNotBlank)?.let(::handleResponse)
                        } else {
                            Log.w(TAG, "Command polling failed: HTTP ${response.code}")
                        }
                    }
                } catch (error: Exception) {
                    Log.w(TAG, "Command polling unavailable", error)
                }
            }
            delay(POLL_INTERVAL_MS)
        }
    }

    private fun handleResponse(body: String) {
        val envelope = JSONObject(body)
        val commands = envelope.optJSONArray("commands") ?: return
        val manager = PhoneLinkManager.getInstance(this)
        for (index in 0 until commands.length()) {
            val command = commands.optJSONObject(index) ?: continue
            val action = when (command.optString("action")) {
                "toggle_focus_shield" -> "toggle_focus"
                "send_clipboard" -> "clipboard_sync"
                else -> command.optString("action")
            }
            manager.handleCommand(action, command.optJSONObject("payload"))
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Raqeeb device sync",
                NotificationManager.IMPORTANCE_LOW
            )
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun notification(): Notification =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
                .setContentTitle(getString(R.string.app_name))
                .setContentText("PhoneLink sync is active")
                .setSmallIcon(android.R.drawable.ic_lock_lock)
                .setOngoing(true)
                .build()
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
                .setContentTitle(getString(R.string.app_name))
                .setContentText("PhoneLink sync is active")
                .setSmallIcon(android.R.drawable.ic_lock_lock)
                .setOngoing(true)
                .build()
        }

    override fun onDestroy() {
        pollingJob?.cancel()
        scope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        private const val TAG = "PhoneLinkSyncService"
        private const val CHANNEL_ID = "raqeeb_phonelink_sync"
        private const val NOTIFICATION_ID = 4101
        private const val POLL_INTERVAL_MS = 15_000L
        const val PREFS = "raqeeb_phonelink"
        const val KEY_SERVER_URL = "server_url"
        const val KEY_DEVICE_TOKEN = "device_token"
        const val KEY_DEVICE_ID = "device_id"
    }
}
