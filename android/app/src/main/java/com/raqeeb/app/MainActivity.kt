package com.raqeeb.app

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import android.widget.CheckBox
import android.widget.LinearLayout
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.lifecycle.lifecycleScope
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.raqeeb.app.databinding.ActivityMainBinding
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import kotlinx.coroutines.Dispatchers
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
    private lateinit var firebaseAuth: FirebaseAuth
    private lateinit var googleSignInClient: GoogleSignInClient
    private lateinit var googleSignInLauncher: ActivityResultLauncher<Intent>
    private val notificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            if (!granted) {
                Toast.makeText(this, "لن تظهر إشعارات محاولات الحجب دون إذن الإشعارات", Toast.LENGTH_LONG).show()
            }
        }
    private val timeFormatter = SimpleDateFormat("hh:mm:ss a", Locale.getDefault())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. Initialize the authenticated PhoneLink components.
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        phoneLink = PhoneLinkManager.getInstance(this)
        firebaseAuth = FirebaseAuth.getInstance()
        val signInOptions = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(getString(R.string.default_web_client_id))
            .requestEmail()
            .build()
        googleSignInClient = GoogleSignIn.getClient(this, signInOptions)
        googleSignInLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            if (result.resultCode != RESULT_OK) {
                Toast.makeText(this, "لم يكتمل تسجيل الدخول إلى PhoneLink", Toast.LENGTH_SHORT).show()
                return@registerForActivityResult
            }
            val accountTask = GoogleSignIn.getSignedInAccountFromIntent(result.data)
            lifecycleScope.launch {
                try {
                    val account = withContext(Dispatchers.IO) { accountTask.await() }
                    val token = account.idToken ?: error("Google Sign-In did not return an ID token.")
                    val credential = GoogleAuthProvider.getCredential(token, null)
                    val user = firebaseAuth.signInWithCredential(credential).await().user
                        ?: error("Firebase Auth did not return a user.")
                    withContext(Dispatchers.IO) {
                        PhoneLinkFirestoreRepository.registerDevice(this@MainActivity, user.uid)
                    }
                    startPhoneLinkService()
                    refreshPhoneLinkAuthUi()
                    Toast.makeText(this@MainActivity, "تم تسجيل الدخول إلى PhoneLink", Toast.LENGTH_SHORT).show()
                } catch (error: Exception) {
                    android.util.Log.e("MainActivity", "PhoneLink Google sign-in failed.", error)
                    refreshPhoneLinkAuthUi()
                    Toast.makeText(this@MainActivity, "تعذر تسجيل الدخول أو تسجيل الجهاز في Firebase", Toast.LENGTH_LONG).show()
                }
            }
        }

        // 3. Setup user interactions & triggers
        setupUI()
        binding.btnGoogleSignIn.setOnClickListener {
            googleSignInLauncher.launch(googleSignInClient.signInIntent)
        }
        binding.btnGoogleSignOut.setOnClickListener {
            lifecycleScope.launch {
                try {
                    stopService(Intent(this@MainActivity, PhoneLinkSyncService::class.java))
                    firebaseAuth.signOut()
                    refreshPhoneLinkAuthUi()
                    googleSignInClient.signOut().await()
                } catch (error: Exception) {
                    android.util.Log.e("MainActivity", "PhoneLink sign-out failed.", error)
                    refreshPhoneLinkAuthUi()
                    Toast.makeText(this@MainActivity, "تعذر إكمال تسجيل الخروج من Google", Toast.LENGTH_LONG).show()
                }
            }
        }
        refreshPhoneLinkAuthUi()
        if (firebaseAuth.currentUser != null) startPhoneLinkService()

        // 3. Connect to background reactive flows
        observeServiceFlows()
    }

    override fun onResume() {
        super.onResume()
        updatePermissionStates()
        updateBlockedAppsSummary()
    }

    private fun setupUI() {
        binding.btnSelectBlockedApps.setOnClickListener { showBlockedAppPicker() }
        binding.btnEnableOverlay.setOnClickListener {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
                startActivity(
                    Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:$packageName")
                    )
                )
            } else {
                Toast.makeText(this, "صلاحية الظهور فوق التطبيقات مفعلة بالفعل ✓", Toast.LENGTH_SHORT).show()
            }
        }
        binding.btnEnableAccessibility.setOnClickListener {
            startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        }
        binding.btnEnableUsageAccess.setOnClickListener {
            startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
        }
        binding.btnEnableNotifications.setOnClickListener {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
            ) {
                notificationPermissionLauncher.launch(android.Manifest.permission.POST_NOTIFICATIONS)
            } else {
                Toast.makeText(this, "إذن الإشعارات مفعّل بالفعل ✓", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun showBlockedAppPicker() {
        val launchIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        val installedApps = packageManager.queryIntentActivities(launchIntent, 0)
            .map { it.activityInfo }
            .filter { it.packageName != packageName }
            .distinctBy { it.packageName }
            .sortedBy { it.loadLabel(packageManager).toString().lowercase(Locale.getDefault()) }
        if (installedApps.isEmpty()) {
            Toast.makeText(this, "لم يعثر النظام على تطبيقات قابلة للاختيار", Toast.LENGTH_SHORT).show()
            return
        }

        val selected = RaqeebAccessibilityService.getMonitoredApps(this).toMutableSet()
        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(24, 8, 24, 8)
        }
        installedApps.forEach { app ->
            val icon = app.loadIcon(packageManager)
            val iconSize = (24 * resources.displayMetrics.density).toInt()
            icon.setBounds(0, 0, iconSize, iconSize)
            val checkbox = CheckBox(this).apply {
                text = app.loadLabel(packageManager)
                isChecked = selected.contains(app.packageName)
                setCompoundDrawables(null, null, icon, null)
                compoundDrawablePadding = (8 * resources.displayMetrics.density).toInt()
            }
            checkbox.setOnCheckedChangeListener { _, checked ->
                if (checked) selected.add(app.packageName) else selected.remove(app.packageName)
            }
            container.addView(
                checkbox,
                LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    (48 * resources.displayMetrics.density).toInt()
                )
            )
        }
        val scrollView = android.widget.ScrollView(this).apply { addView(container) }
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("اختر التطبيقات المحجوبة")
            .setView(scrollView)
            .setNegativeButton("إلغاء", null)
            .setPositiveButton("حفظ") { _, _ ->
                try {
                    RaqeebAccessibilityService.updateMonitoredApps(this, selected)
                    updateBlockedAppsSummary()
                    Toast.makeText(this, "تم حفظ ${selected.size} تطبيقات محليًا", Toast.LENGTH_SHORT).show()
                } catch (error: Exception) {
                    android.util.Log.e("MainActivity", "Could not save blocked-app selection.", error)
                    Toast.makeText(this, "تعذر حفظ قائمة التطبيقات المحجوبة", Toast.LENGTH_LONG).show()
                }
            }
            .show()
    }

    private fun updateBlockedAppsSummary() {
        val blockedPackages = RaqeebAccessibilityService.getMonitoredApps(this)
        val labels = blockedPackages.map { blockedPackage ->
            try {
                packageManager.getApplicationInfo(blockedPackage, 0).loadLabel(packageManager).toString()
            } catch (_: PackageManager.NameNotFoundException) {
                blockedPackage
            }
        }
        binding.tvBlockedAppsSummary.text = if (labels.isEmpty()) {
            "لا توجد تطبيقات محددة للحجب"
        } else {
            "المحجوب (${labels.size}): ${labels.take(4).joinToString("، ")}" +
                if (labels.size > 4) "، ..." else ""
        }
    }

    private fun refreshPhoneLinkAuthUi() {
        val user = firebaseAuth.currentUser
        binding.tvPhoneLinkAuthStatus.text = user?.email?.let {
            "PhoneLink مسجل الدخول: $it"
        } ?: "PhoneLink: سجّل الدخول بحساب Google نفسه المستخدم على الويب"
        binding.btnGoogleSignIn.visibility = if (user == null) android.view.View.VISIBLE else android.view.View.GONE
        binding.btnGoogleSignOut.visibility = if (user == null) android.view.View.GONE else android.view.View.VISIBLE
    }

    private fun startPhoneLinkService() {
        val serviceIntent = Intent(this, PhoneLinkSyncService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }

    /**
     * Updates UI indicators based on current granted permissions & service status.
     */
    private fun updatePermissionStates() {
        val isAccessibilityActive =
            isAccessibilityServiceEnabled(this, RaqeebAccessibilityService::class.java) &&
                RaqeebAccessibilityService.serviceConnected.value

        val blockedAppsCount = RaqeebAccessibilityService.getMonitoredApps(this).size
        val protectionReady = isAccessibilityActive && blockedAppsCount > 0
        binding.btnEnableOverlay.visibility =
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
                android.view.View.VISIBLE
            } else {
                android.view.View.GONE
            }
        binding.btnEnableAccessibility.visibility =
            if (isAccessibilityActive) android.view.View.GONE else android.view.View.VISIBLE
        binding.btnEnableUsageAccess.visibility =
            if (UsageStatsTracker.hasUsageAccess(this)) android.view.View.GONE else android.view.View.VISIBLE
        binding.btnEnableNotifications.visibility =
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
                checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
            ) {
                android.view.View.GONE
            } else {
                android.view.View.VISIBLE
            }
        binding.permissionActionsContainer.visibility =
            if (binding.btnEnableOverlay.visibility == android.view.View.VISIBLE ||
                binding.btnEnableAccessibility.visibility == android.view.View.VISIBLE ||
                binding.btnEnableUsageAccess.visibility == android.view.View.VISIBLE ||
                binding.btnEnableNotifications.visibility == android.view.View.VISIBLE
            ) {
                android.view.View.VISIBLE
            } else {
                android.view.View.GONE
            }

        binding.indicatorStatus.setBackgroundColor(
            android.graphics.Color.parseColor(if (protectionReady) "#10b981" else "#f59e0b")
        )
        binding.tvProtectionStatus.text = when {
            !isAccessibilityActive -> "الحماية غير نشطة: فعّل خدمة إمكانية الوصول"
            blockedAppsCount == 0 -> "الخدمة تعمل، لكن لم تُحدد تطبيقات للحجب"
            else -> "خدمة إمكانية الوصول متصلة • $blockedAppsCount تطبيقات محددة للحجب"
        }

        updateUsageSummary()
    }

    private fun updateUsageSummary() {
        if (!UsageStatsTracker.hasUsageAccess(this)) {
            binding.tvUsageSummary.text = "استخدام التطبيقات اليوم: غير مقاس — فعّل إذن بيانات الاستخدام"
            return
        }

        try {
            val snapshot = UsageStatsTracker.queryToday(this)
            val packageUsage = snapshot.durationByPackageMillis
                .filterKeys { it != packageName }
                .entries
                .sortedByDescending { it.value }
            val totalMinutes = packageUsage.sumOf { it.value } / 60_000
            val topApps = packageUsage.take(3).joinToString("، ") {
                "${it.key}: ${it.value / 60_000}د"
            }.ifEmpty { "لا توجد أحداث استخدام مسجلة اليوم" }
            binding.tvUsageSummary.text =
                "استخدام التطبيقات المقاس اليوم: ${totalMinutes}د • $topApps"
        } catch (error: Exception) {
            android.util.Log.e("MainActivity", "Failed to query Android usage events", error)
            binding.tvUsageSummary.text = "تعذر قراءة سجل الاستخدام اليوم"
        }
    }

    /**
     * Observes live changes and events exposed by RaqeebAccessibilityService and PhoneLinkManager.
     */
    private fun observeServiceFlows() {
        // 1. Reactively track blocked application events
        lifecycleScope.launch {
            RaqeebAccessibilityService.blockedEventsFlow.collectLatest { event ->
                if (event == null) return@collectLatest
                val formattedTime = timeFormatter.format(Date(event.timestamp))

                binding.tvLastBlockedPackage.text = event.packageName
                binding.tvLastBlockedTime.text = "تم رصد المحاولة في: $formattedTime"
                binding.indicatorStatus.setBackgroundColor(android.graphics.Color.parseColor("#ef4444")) // Red alert indicator

                Toast.makeText(
                    this@MainActivity,
                    "🛡️ رقيب: تم رصد محاولة فتح ${event.packageName} (محدد للحجب)",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }

        // 2. Reactively track active monitored applications list
        lifecycleScope.launch {
            RaqeebAccessibilityService.monitoredAppsFlow.collectLatest {
                updateBlockedAppsSummary()
                updatePermissionStates()
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

        lifecycleScope.launch {
            RaqeebAccessibilityService.serviceConnected.collectLatest {
                updatePermissionStates()
            }
        }
    }

    /**
     * Utility method to check if the accessibility service is actively running.
     */
    private fun isAccessibilityServiceEnabled(context: Context, service: Class<*>): Boolean {
        val am = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager ?: return false
        val enabledServices = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_GENERIC)
        return enabledServices.any { info ->
            val serviceInfo = info.resolveInfo.serviceInfo
            serviceInfo.packageName == context.packageName && serviceInfo.name == service.name
        }
    }
}
