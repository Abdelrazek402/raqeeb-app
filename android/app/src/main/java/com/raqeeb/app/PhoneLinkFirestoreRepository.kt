package com.raqeeb.app

import android.content.Context
import android.os.Build
import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.tasks.await

object PhoneLinkFirestoreRepository {
    private const val DEVICE_PREFS = "raqeeb_phonelink_identity"
    private const val DEVICE_ID_KEY = "device_id"

    suspend fun registerDevice(context: Context, uid: String): String {
        val authUid = FirebaseAuth.getInstance().currentUser?.uid
            ?: throw IllegalStateException("Sign in before registering this device.")
        require(authUid == uid) { "The signed-in account changed during device registration." }

        val preferences = context.getSharedPreferences(DEVICE_PREFS, Context.MODE_PRIVATE)
        val deviceId = preferences.getString(DEVICE_ID_KEY, null)
            ?: java.util.UUID.randomUUID().toString().also {
                check(preferences.edit().putString(DEVICE_ID_KEY, it).commit()) {
                    "Could not persist this installation's device ID."
                }
            }
        val version = context.packageManager.getPackageInfo(context.packageName, 0).versionName ?: "unknown"
        val deviceRef = FirebaseFirestore.getInstance().document(devicePath(uid, deviceId))
        val existingDevice = deviceRef.get().await()
        val deviceDetails = mapOf(
            "deviceName" to "${Build.MANUFACTURER} ${Build.MODEL}".trim().take(80),
            "platform" to "android",
            "appVersion" to version.take(32)
        )
        if (existingDevice.exists()) {
            check(existingDevice.getString("ownerUid") == uid) {
                "This installation's device record belongs to another account."
            }
            deviceRef.update(deviceDetails + ("lastSeenAt" to FieldValue.serverTimestamp())).await()
        } else {
            deviceRef.set(
                deviceDetails + mapOf(
                    "ownerUid" to uid,
                    "deviceId" to deviceId,
                    "createdAt" to FieldValue.serverTimestamp(),
                    "lastSeenAt" to FieldValue.serverTimestamp()
                )
            ).await()
        }
        return deviceId
    }

    fun listenForPendingCommands(
        uid: String,
        deviceId: String,
        onCommand: (String, Map<String, Any>) -> Unit,
        onError: (Exception) -> Unit
    ): ListenerRegistration =
        FirebaseFirestore.getInstance()
            .collection("${devicePath(uid, deviceId)}/commands")
            .whereEqualTo("status", "pending")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    onError(error)
                    return@addSnapshotListener
                }
                snapshot?.documents?.forEach { document ->
                    val data = document.data ?: return@forEach
                    onCommand(document.id, data)
                }
            }

    suspend fun acknowledge(
        uid: String,
        deviceId: String,
        commandId: String,
        succeeded: Boolean,
        result: String
    ) {
        val commandRef = FirebaseFirestore.getInstance()
            .document("${devicePath(uid, deviceId)}/commands/$commandId")
        FirebaseFirestore.getInstance().runTransaction { transaction ->
            val command = transaction.get(commandRef)
            val expiry = command.getTimestamp("expiresAt")
            check(command.getString("ownerUid") == uid) { "Command owner does not match." }
            check(command.getString("deviceId") == deviceId) { "Command device does not match." }
            check(command.getString("commandId") == commandId) { "Command ID does not match." }
            check(command.getString("status") == "pending") { "Command is no longer pending." }
            check(expiry != null && expiry > Timestamp.now()) { "Command expired before acknowledgement." }
            transaction.update(
                commandRef,
                mapOf(
                    "status" to if (succeeded) "acknowledged" else "failed",
                    "ackAt" to FieldValue.serverTimestamp(),
                    "result" to result.take(120)
                )
            )
            null
        }.await()
    }

    private fun devicePath(uid: String, deviceId: String) =
        "users/$uid/phonelinkDevices/$deviceId"
}
