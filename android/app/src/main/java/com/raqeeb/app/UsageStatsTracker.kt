package com.raqeeb.app

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.Build
import java.util.Calendar

data class ForegroundSession(
    val packageName: String,
    val startTimeMillis: Long,
    val endTimeMillis: Long
) {
    val durationMillis: Long
        get() = (endTimeMillis - startTimeMillis).coerceAtLeast(0)
}

data class DailyUsageSnapshot(
    val dateStartMillis: Long,
    val measuredAtMillis: Long,
    val sessions: List<ForegroundSession>
) {
    val durationByPackageMillis: Map<String, Long>
        get() = sessions
            .groupBy(ForegroundSession::packageName)
            .mapValues { (_, entries) -> entries.sumOf(ForegroundSession::durationMillis) }
}

object UsageStatsTracker {
    fun hasUsageAccess(context: Context): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as android.app.AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                android.app.AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                context.packageName
            )
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
                android.app.AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                context.packageName
            )
        }
        return mode == android.app.AppOpsManager.MODE_ALLOWED
    }

    fun queryToday(context: Context, nowMillis: Long = System.currentTimeMillis()): DailyUsageSnapshot {
        check(hasUsageAccess(context)) { "Usage access has not been granted." }
        val calendar = Calendar.getInstance().apply {
            timeInMillis = nowMillis
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val startOfDay = calendar.timeInMillis
        val manager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val events = manager.queryEvents(startOfDay, nowMillis)
        val event = UsageEvents.Event()
        val activePackages = mutableMapOf<String, Long>()
        val sessions = mutableListOf<ForegroundSession>()
        val resumeEvent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            UsageEvents.Event.ACTIVITY_RESUMED
        } else {
            @Suppress("DEPRECATION")
            UsageEvents.Event.MOVE_TO_FOREGROUND
        }
        val pauseEvent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            UsageEvents.Event.ACTIVITY_PAUSED
        } else {
            @Suppress("DEPRECATION")
            UsageEvents.Event.MOVE_TO_BACKGROUND
        }

        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            val packageName = event.packageName ?: continue
            when (event.eventType) {
                resumeEvent -> {
                    activePackages.put(packageName, event.timeStamp)?.let { previousStart ->
                        sessions.add(ForegroundSession(packageName, previousStart, event.timeStamp))
                    }
                }
                pauseEvent -> {
                    val sessionStart = activePackages.remove(packageName)
                    if (sessionStart != null) {
                        sessions.add(ForegroundSession(packageName, sessionStart, event.timeStamp))
                    }
                }
                UsageEvents.Event.SCREEN_NON_INTERACTIVE,
                UsageEvents.Event.KEYGUARD_SHOWN -> {
                    activePackages.toMap().forEach { (activePackage, sessionStart) ->
                        sessions.add(ForegroundSession(activePackage, sessionStart, event.timeStamp))
                    }
                    activePackages.clear()
                }
            }
        }

        activePackages.forEach { (packageName, sessionStart) ->
            sessions.add(ForegroundSession(packageName, sessionStart, nowMillis))
        }

        return DailyUsageSnapshot(
            dateStartMillis = startOfDay,
            measuredAtMillis = nowMillis,
            sessions = sessions.filter { it.durationMillis > 0 }
        )
    }
}
