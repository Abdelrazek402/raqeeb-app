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

        binding.btnEnableUsageAccess.setOnClickListener {
            startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
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
