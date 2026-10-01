package com.raqeeb.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap

class PhoneLinkSyncService : Service() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val inFlightUntil = ConcurrentHashMap<String, Long>()
    private var commandListener: ListenerRegistration? = null
    private var registeredDeviceId: String? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, notification())

        val uid = FirebaseAuth.getInstance().currentUser?.uid
        if (uid == null) {
            Log.w(TAG, "PhoneLink listener not started: no signed-in Firebase user.")
            stopSelf()
            return
        }
        scope.launch {
            try {
                val deviceId = PhoneLinkFirestoreRepository.registerDevice(this@PhoneLinkSyncService, uid)
                registeredDeviceId = deviceId
                commandListener = PhoneLinkFirestoreRepository.listenForPendingCommands(
                    uid,
                    deviceId,
                    ::handleCommandDocument
                ) { error -> Log.e(TAG, "Firestore PhoneLink listener failed.", error) }
            } catch (error: Exception) {
                Log.e(TAG, "Could not register PhoneLink device or attach its listener.", error)
                stopSelf()
            }
        }
    }

    private fun handleCommandDocument(commandId: String, data: Map<String, Any>) {
        val now = System.currentTimeMillis()
        inFlightUntil.entries.removeIf { it.value <= now }
        if (inFlightUntil.putIfAbsent(commandId, now + MAX_COMMAND_LIFETIME_MS) != null) return

        val uid = FirebaseAuth.getInstance().currentUser?.uid ?: return
        val deviceId = data["deviceId"] as? String ?: return
        if (data["ownerUid"] != uid || deviceId != registeredDeviceId || data["commandId"] != commandId) {
            Log.w(TAG, "Ignoring malformed or mismatched PhoneLink command $commandId.")
            return
        }
        val expiry = data["expiresAt"] as? Timestamp
        if (expiry == null || expiry.toDate().time <= now) {
            Log.i(TAG, "Ignoring expired PhoneLink command $commandId.")
            return
        }
        val action = data["action"] as? String ?: return
        val payload = data["payload"] as? Map<*, *> ?: return
        val jsonPayload = JSONObject(payload)

        scope.launch {
            val accepted = PhoneLinkManager.getInstance(this@PhoneLinkSyncService)
                .handleCommand(action, jsonPayload)
            try {
                PhoneLinkFirestoreRepository.acknowledge(
                    uid,
                    deviceId,
                    commandId,
                    accepted,
                    if (accepted) "accepted for local handling" else "unsupported command"
                )
            } catch (error: Exception) {
                Log.e(TAG, "Could not acknowledge PhoneLink command $commandId.", error)
            }
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
        commandListener?.remove()
        scope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        private const val TAG = "PhoneLinkSyncService"
        private const val CHANNEL_ID = "raqeeb_phonelink_sync"
        private const val NOTIFICATION_ID = 4101
        private const val MAX_COMMAND_LIFETIME_MS = 5 * 60 * 1000L
    }
}
