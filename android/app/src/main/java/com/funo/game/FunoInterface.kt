package com.funo.game

import android.webkit.JavascriptInterface
import android.widget.Toast

/**
 * JavaScript ↔ Android bridge.
 *
 * In the web game, call window.FunoApp.<method>() to trigger native Android behaviour.
 *
 * Example (in game.js):
 *   if (window.FunoApp) window.FunoApp.onGameOver("Alice");
 */
class FunoInterface(private val activity: MainActivity) {

    /**
     * Called by JS when a round ends.
     * Shows an interstitial ad, then lets the game proceed.
     */
    @JavascriptInterface
    fun onGameOver(winnerName: String) {
        activity.runOnUiThread {
            activity.showInterstitialAd()
        }
    }

    /**
     * Called by JS to trigger a rewarded ad.
     * After reward granted, the JS callback receives extra cards.
     */
    @JavascriptInterface
    fun requestRewardedAd() {
        activity.runOnUiThread {
            activity.showRewardedAd()
        }
    }

    /**
     * Show a native Android toast message (useful for debugging).
     */
    @JavascriptInterface
    fun nativeToast(msg: String) {
        activity.runOnUiThread {
            Toast.makeText(activity, msg, Toast.LENGTH_SHORT).show()
        }
    }

    /**
     * Returns true so JS can detect it's running inside the Android app.
     */
    @JavascriptInterface
    fun isAndroidApp(): Boolean = true
}
