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

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize View Binding with the full-screen activity_blocker layout
        binding = ActivityBlockerBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Receive details from the blocking intent
        val blockedPackage = intent.getStringExtra("BLOCKED_PACKAGE")
        if (!blockedPackage.isNullOrEmpty()) {
            binding.tvBlockedPackageName.text = "تم إيقاف تطبيق ($blockedPackage) لحفظ وقتك وغض بصرك.\nاستعن بالله واذكر ربك: أستغفر الله العظيم وأتوب إليه."
        }

        // 'Go Back' button returns the user directly to the Home Screen
        binding.btnGoBack.setOnClickListener {
            returnToHomeScreen()
        }
    }

    /**
     * Intercept the back button to prevent the user from returning into the restricted application.
     */
    override fun onBackPressed() {
        super.onBackPressed()
        returnToHomeScreen()
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
