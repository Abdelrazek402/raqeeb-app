package com.raqeeb.app

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.raqeeb.app.databinding.ActivityMainBinding
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * MainActivity
 * 
 * The primary entry point for the Raqeeb Android application.
 * Manages view binding, permission configurations, reactive monitoring flows,
 * and ties into PhoneLinkManager for real-time device-to-desktop synchronization.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var phoneLink: PhoneLinkManager
    private val timeFormatter = SimpleDateFormat("hh:mm:ss a", Locale.getDefault())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. Initialize PhoneLinkManager instance
        phoneLink = PhoneLinkManager.getInstance(this)
        val syncIntent = Intent(this, PhoneLinkSyncService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(syncIntent)
        } else {
            startService(syncIntent)
        }

        // 2. Initialize ViewBinding
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // 3. Setup user interactions & triggers
        setupUI()

        // 4. Connect to background reactive flows
        observeServiceFlows()
    }

    override fun onResume() {
        super.onResume()
        updatePermissionStates()
    }

    private fun setupUI() {
        // Trigger Overlay Permission (SYSTEM_ALERT_WINDOW)
        binding.btnEnableOverlay.setOnClickListener {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(this)) {
                    val intent = Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:$packageName")
                    )
                    startActivity(intent)
                } else {
                    Toast.makeText(this, "صلاحية الظهور فوق التطبيقات مفعلة بالفعل ✓", Toast.LENGTH_SHORT).show()
                }
            } else {
                Toast.makeText(this, "صلاحية الظهور مفعلة افتراضياً ✓", Toast.LENGTH_SHORT).show()
            }
        }

        // Trigger Accessibility Service Setup Settings
        binding.btnEnableAccessibility.setOnClickListener {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            startActivity(intent)
        }
    }

    /**
     * Updates UI indicators based on current granted permissions & service status.
     */
    private fun updatePermissionStates() {
        val isOverlayGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(this)
        } else {
            true
        }

        val isAccessibilityActive = isAccessibilityServiceEnabled(this, RaqeebAccessibilityService::class.java)

        if (isAccessibilityActive && isOverlayGranted) {
            binding.indicatorStatus.setBackgroundColor(android.graphics.Color.parseColor("#10b981")) // Green (Active & Protected)
            binding.tvLastBlockedTime.text = "الحالة: الدرع نشط ومحمي بفضل الله ✓"
        } else {
            binding.indicatorStatus.setBackgroundColor(android.graphics.Color.parseColor("#f59e0b")) // Yellow (Needs Activation)
            binding.tvLastBlockedTime.text = "الحالة: يرجى تفعيل الصلاحيات لبدء الحماية"
        }
    }

    /**
     * Observes live changes and events exposed by RaqeebAccessibilityService and PhoneLinkManager.
     */
    private fun observeServiceFlows() {
        // 1. Reactively track blocked application events
        lifecycleScope.launch {
            RaqeebAccessibilityService.blockedEventsFlow.collectLatest { event ->
                val formattedTime = timeFormatter.format(Date(event.timestamp))

                binding.tvLastBlockedPackage.text = event.packageName
                binding.tvLastBlockedTime.text = "تم الحظر والتذكير في: $formattedTime"
                binding.indicatorStatus.setBackgroundColor(android.graphics.Color.parseColor("#ef4444")) // Red alert indicator

                Toast.makeText(
                    this@MainActivity,
                    "🛡️ درع رَقِيب: تم رصد وحجب (${event.packageName})",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }

        // 2. Reactively track active monitored applications list
        lifecycleScope.launch {
            RaqeebAccessibilityService.monitoredAppsFlow.collectLatest { appsSet ->
                android.util.Log.i("MainActivity", "Live monitored packages count: ${appsSet.size}")
            }
        }

        // 3. Reactively track Phone Link focus state
        lifecycleScope.launch {
            phoneLink.isFocusActive.collectLatest { isFocus ->
                if (isFocus) {
                    binding.indicatorStatus.setBackgroundColor(android.graphics.Color.parseColor("#059669"))
                }
            }
        }
    }

    /**
     * Utility method to check if the accessibility service is actively running.
     */
    private fun isAccessibilityServiceEnabled(context: Context, service: Class<*>): Boolean {
        val am = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager ?: return false
        val enabledServices = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_GENERIC)
        for (info in enabledServices) {
            if (info.resolveInfo.serviceInfo.name.contains(service.simpleName)) {
                return true
            }
        }
        return false
    }
}
