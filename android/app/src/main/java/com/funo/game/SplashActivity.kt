package com.funo.game

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen

/**
 * Splash screen that shows the app icon briefly, then launches MainActivity.
 * Uses the AndroidX SplashScreen API (works on Android 6+).
 */
class SplashActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // Install the splash screen (shows themed launch icon)
        installSplashScreen()
        super.onCreate(savedInstanceState)

        startActivity(Intent(this, MainActivity::class.java))
        finish() // remove splash from back stack
    }
}
