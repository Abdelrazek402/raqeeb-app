package com.raqeeb.app

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.raqeeb.app.databinding.ActivityBlockerBinding

/**
 * BlockerActivity
 * 
 * Receives a blocking intent from RaqeebAccessibilityService upon detection of a restricted app.
 * Displays a full-screen blocking layout informing the user that the application is restricted,
 * and provides a 'Go Back' option to navigate safely back to the device home screen.
 */
class BlockerActivity : AppCompatActivity() {

    private lateinit var binding: ActivityBlockerBinding
    private var blockedPackage: String? = null

    companion object {
        @Volatile
        private var visibleBlockedPackage: String? = null

        fun isShowingPackage(packageName: String): Boolean = visibleBlockedPackage == packageName
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize View Binding with the full-screen activity_blocker layout
        binding = ActivityBlockerBinding.inflate(layoutInflater)
        setContentView(binding.root)

        renderBlockedPackage(intent)

        // 'Go Back' button returns the user directly to the Home Screen
        binding.btnGoBack.setOnClickListener {
            returnToHomeScreen()
        }
    }

    /**
     * Intercept the back button to prevent the user from returning into the restricted application.
     */
    override fun onBackPressed() {
        returnToHomeScreen()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        renderBlockedPackage(intent)
    }

    override fun onResume() {
        super.onResume()
        visibleBlockedPackage = blockedPackage
    }

    override fun onPause() {
        if (visibleBlockedPackage == blockedPackage) visibleBlockedPackage = null
        super.onPause()
    }

    private fun renderBlockedPackage(intent: Intent) {
        blockedPackage = intent.getStringExtra("BLOCKED_PACKAGE")
        binding.tvBlockedPackageName.text = if (!blockedPackage.isNullOrEmpty()) {
            "تم اعتراض محاولة فتح التطبيق ($blockedPackage) لحفظ وقتك وغض بصرك.\nاستعن بالله واذكر ربك: أستغفر الله العظيم وأتوب إليه."
        } else {
            "تم اعتراض محاولة فتح تطبيق محدد للحجب لحفظ وقتك وغض بصرك.\nاستعن بالله واذكر ربك: أستغفر الله العظيم وأتوب إليه."
        }
    }

    /**
     * Sends the user back to the Android OS Home screen and finishes this activity.
     */
    private fun returnToHomeScreen() {
        val homeIntent = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_HOME)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        startActivity(homeIntent)
        finish()
    }
}
