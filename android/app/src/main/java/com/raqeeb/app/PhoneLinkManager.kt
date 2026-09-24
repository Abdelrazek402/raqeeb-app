package com.raqeeb.app

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioAttributes
import android.media.Ringtone
import android.media.RingtoneManager
import android.os.BatteryManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import android.widget.Toast
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * PhoneLinkManager
 *
 * Handles end-to-end device synchronization between Raqeeb Web/Desktop and Android hardware:
 * 1. ring: Triggers high-priority audible ringtone & haptic vibration to locate device.
 * 2. toggle_focus: Toggles Focus Shield mode and synchronizes active restricted list.
 * 3. clipboard_sync: Synchronizes shared clipboard text with the Android OS clipboard.
 * 4. Telemetry: Reports battery level, charging status, and device model back to server.
 */
class PhoneLinkManager private constructor(private val context: Context) {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    private var currentRingtone: Ringtone? = null

    private val _isFocusActive = MutableStateFlow(false)
    val isFocusActive: StateFlow<Boolean> = _isFocusActive.asStateFlow()

    companion object {
        private const val TAG = "PhoneLinkManager"

        @Volatile
        private var INSTANCE: PhoneLinkManager? = null

        fun getInstance(context: Context): PhoneLinkManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: PhoneLinkManager(context.applicationContext).also { INSTANCE = it }
            }
        }
    }

    /**
     * Executes an incoming Phone Link command.
     */
    fun handleCommand(action: String, payload: JSONObject?) {
        Log.i(TAG, "Handling Phone Link command: $action")
        when (action) {
            "ring" -> executeRing(payload?.optInt("durationSeconds", 15) ?: 15)
            "stop_ring" -> stopRing()
            "toggle_focus" -> {
                val enable = payload?.optBoolean("active", !_isFocusActive.value) ?: !_isFocusActive.value
                executeToggleFocus(enable)
            }
            "clipboard_sync" -> {
                val text = payload?.optString("text", "") ?: ""
                executeClipboardSync(text)
            }
            else -> Log.w(TAG, "Unknown Phone Link action: $action")
        }
    }

    /**
     * Rings the device with maximum alarm ringtone and vibration pattern.
     */
    fun executeRing(durationSeconds: Int = 15) {
        scope.launch(Dispatchers.Main) {
            try {
                stopRing()

                val alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                    ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)

                currentRingtone = RingtoneManager.getRingtone(context, alarmUri)?.apply {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        audioAttributes = AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    }
                    play()
                }

                // Trigger vibration
                vibrateDevice(durationSeconds * 1000L)

                Toast.makeText(context, "🔔 رَقِيب: جاري رنين الهاتف من لوحة التحكم...", Toast.LENGTH_LONG).show()

                // Auto-stop ring after duration
                delay(durationSeconds * 1000L)
                stopRing()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to execute ring command", e)
            }
        }
    }

    /**
     * Stops any ongoing ringing or vibration.
     */
    fun stopRing() {
        try {
            currentRingtone?.stop()
            currentRingtone = null

            val vibrator = getVibrator()
            vibrator?.cancel()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop ringtone", e)
        }
    }

    /**
     * Synchronizes text to the Android system clipboard.
     */
    fun executeClipboardSync(text: String) {
        if (text.isEmpty()) return

        scope.launch(Dispatchers.Main) {
            try {
                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
                val clip = ClipData.newPlainText("Raqeeb Sync", text)
                clipboard?.setPrimaryClip(clip)

                Toast.makeText(
                    context,
                    "📋 رَقِيب: تمت مزامنة الحافظة بنجاح ✓",
                    Toast.LENGTH_SHORT
                ).show()
                Log.i(TAG, "Clipboard synchronized with ${text.length} characters.")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to update clipboard", e)
            }
        }
    }

    /**
     * Toggles focus shield mode and updates restricted package list.
     */
    fun executeToggleFocus(enable: Boolean) {
        _isFocusActive.value = enable
        scope.launch(Dispatchers.Main) {
            val message = if (enable) {
                "🛡️ رَقِيب: تم تفعيل درع التركيز الفائق (حماية مشددة)"
            } else {
                "🛡️ رَقِيب: تم إلغاء درع التركيز (الوضع الطبيعي)"
            }
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
            Log.i(TAG, "Focus Shield state changed: enable=$enable")
        }
    }

    /**
     * Collects current device battery telemetry.
     */
    fun getBatteryInfo(): Pair<Int, Boolean> {
        val batteryStatus: Intent? = IntentFilter(Intent.ACTION_BATTERY_CHANGED).let { filter ->
            context.registerReceiver(null, filter)
        }

        val level: Int = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale: Int = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        val batteryPct: Int = if (level >= 0 && scale > 0) (level * 100 / scale) else 100

        val status: Int = batteryStatus?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val isCharging: Boolean = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                status == BatteryManager.BATTERY_STATUS_FULL

        return Pair(batteryPct, isCharging)
    }

    /**
     * Syncs device status back to Raqeeb backend.
     */
    fun syncTelemetryToServer(serverBaseUrl: String, pairingCode: String) {
        scope.launch {
            try {
                val (battery, charging) = getBatteryInfo()
                val payload = JSONObject().apply {
                    put("pairingCode", pairingCode)
                    put("deviceType", "android")
                    put("model", "${Build.MANUFACTURER} ${Build.MODEL}")
                    put("batteryLevel", battery)
                    put("isCharging", charging)
                    put("isFocusActive", _isFocusActive.value)
                    put("timestamp", System.currentTimeMillis())
                }

                val request = Request.Builder()
                    .url("$serverBaseUrl/api/phonelink/sync")
                    .post(payload.toString().toRequestBody("application/json".toMediaType()))
                    .build()

                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        Log.i(TAG, "Telemetry synced successfully: $battery% charging=$charging")
                    } else {
                        Log.w(TAG, "Telemetry sync failed with code: ${response.code}")
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error syncing telemetry to server", e)
            }
        }
    }

    private fun vibrateDevice(durationMillis: Long) {
        try {
            val vibrator = getVibrator() ?: return
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(
                    VibrationEffect.createWaveform(
                        longArrayOf(0, 500, 300, 500, 300, 1000),
                        0 // repeat from index 0
                    )
                )
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(longArrayOf(0, 500, 300, 500, 300, 1000), 0)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Vibration failed", e)
        }
    }

    private fun getVibrator(): Vibrator? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            vibratorManager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }
}
