package com.funo.game

import android.annotation.SuppressLint
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import com.funo.game.databinding.ActivityMainBinding
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdListener
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback

private const val TAG = "MainActivity"

// ── AdMob Unit IDs ────────────────────────────────────────────────────────────
// IMPORTANT: These are Google's official TEST IDs.
// Replace with your REAL ad unit IDs from https://admob.google.com before publishing.

/** Banner ad shown at the bottom of the screen during gameplay */
private const val BANNER_AD_UNIT_ID     = "ca-app-pub-3940256099942544/6300978111"  // TEST

/** Interstitial (full-screen) ad shown between game rounds */
private const val INTERSTITIAL_AD_UNIT_ID = "ca-app-pub-3940256099942544/1033173712" // TEST

/** Rewarded ad — player watches a video to draw extra cards */
private const val REWARDED_AD_UNIT_ID   = "ca-app-pub-3940256099942544/5224354917"  // TEST
// ─────────────────────────────────────────────────────────────────────────────

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var interstitialAd: InterstitialAd? = null
    private var rewardedAd: RewardedAd? = null

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Keep screen on while playing
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        initAdMob()
        initWebView()
        loadBannerAd()
        loadInterstitialAd()
        loadRewardedAd()
    }

    override fun onResume() {
        super.onResume()
        binding.adView.resume()
        binding.webView.onResume()
    }

    override fun onPause() {
        binding.adView.pause()
        binding.webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        binding.adView.destroy()
        binding.webView.destroy()
        super.onDestroy()
    }

    // Back button navigates inside the WebView history
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && binding.webView.canGoBack()) {
            binding.webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    // ── AdMob initialisation ──────────────────────────────────────────────────

    private fun initAdMob() {
        MobileAds.initialize(this) { initStatus ->
            Log.d(TAG, "AdMob initialised: $initStatus")
        }
    }

    // ── Banner Ad ─────────────────────────────────────────────────────────────

    private fun loadBannerAd() {
        val adRequest = AdRequest.Builder().build()
        binding.adView.loadAd(adRequest)
        binding.adView.adListener = object : AdListener() {
            override fun onAdLoaded()               { Log.d(TAG, "Banner loaded") }
            override fun onAdFailedToLoad(e: LoadAdError) { Log.w(TAG, "Banner failed: ${e.message}") }
        }
    }

    // ── Interstitial Ad ───────────────────────────────────────────────────────

    private fun loadInterstitialAd() {
        val request = AdRequest.Builder().build()
        InterstitialAd.load(this, INTERSTITIAL_AD_UNIT_ID, request,
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) {
                    interstitialAd = ad
                    Log.d(TAG, "Interstitial loaded")
                }
                override fun onAdFailedToLoad(e: LoadAdError) {
                    interstitialAd = null
                    Log.w(TAG, "Interstitial failed: ${e.message}")
                }
            }
        )
    }

    /** Show interstitial if ready; always preload next one. */
    fun showInterstitialAd() {
        val ad = interstitialAd
        if (ad != null) {
            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    interstitialAd = null
                    loadInterstitialAd() // preload next
                }
                override fun onAdFailedToShowFullScreenContent(e: AdError) {
                    interstitialAd = null
                    loadInterstitialAd()
                }
            }
            ad.show(this)
        } else {
            loadInterstitialAd() // wasn't ready yet — preload
        }
    }

    // ── Rewarded Ad ───────────────────────────────────────────────────────────

    private fun loadRewardedAd() {
        val request = AdRequest.Builder().build()
        RewardedAd.load(this, REWARDED_AD_UNIT_ID, request,
            object : RewardedAdLoadCallback() {
                override fun onAdLoaded(ad: RewardedAd) {
                    rewardedAd = ad
                    Log.d(TAG, "Rewarded ad loaded")
                }
                override fun onAdFailedToLoad(e: LoadAdError) {
                    rewardedAd = null
                    Log.w(TAG, "Rewarded ad failed: ${e.message}")
                }
            }
        )
    }

    /** Show rewarded video; on success, give player 3 extra cards via JS. */
    fun showRewardedAd() {
        val ad = rewardedAd
        if (ad != null) {
            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    rewardedAd = null
                    loadRewardedAd()
                }
                override fun onAdFailedToShowFullScreenContent(e: AdError) {
                    rewardedAd = null
                    loadRewardedAd()
                    // Tell JS the ad failed so it can handle gracefully
                    runOnUiThread {
                        binding.webView.evaluateJavascript("window.onRewardGranted && window.onRewardGranted(0)", null)
                    }
                }
            }
            ad.show(this) { rewardItem ->
                // Reward granted — tell JS to draw 3 bonus cards
                Log.d(TAG, "Reward granted: ${rewardItem.amount} ${rewardItem.type}")
                runOnUiThread {
                    binding.webView.evaluateJavascript(
                        "window.onRewardGranted && window.onRewardGranted(${rewardItem.amount})",
                        null
                    )
                }
            }
        } else {
            // Ad not ready — grant a smaller bonus anyway for good UX
            binding.webView.evaluateJavascript("window.onRewardGranted && window.onRewardGranted(1)", null)
            loadRewardedAd()
        }
    }

    // ── WebView setup ─────────────────────────────────────────────────────────

    @SuppressLint("SetJavaScriptEnabled")
    private fun initWebView() {
        binding.webView.apply {
            settings.apply {
                javaScriptEnabled         = true
                domStorageEnabled         = true
                allowFileAccessFromFileURLs = false  // security: keep false
                allowUniversalAccessFromFileURLs = false
                mediaPlaybackRequiresUserGesture = false
                setSupportZoom(false)
                builtInZoomControls  = false
                displayZoomControls  = false
            }

            // Inject JS bridge as "FunoApp"
            addJavascriptInterface(FunoInterface(this@MainActivity), "FunoApp")

            webViewClient = object : WebViewClient() {
                // Block all external navigation (security)
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    val url = request.url.toString()
                    return !url.startsWith("file:///android_asset/")
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onConsoleMessage(msg: android.webkit.ConsoleMessage): Boolean {
                    Log.d(TAG, "[JS] ${msg.message()} @ ${msg.sourceId()}:${msg.lineNumber()}")
                    return true
                }
            }

            // Load the game from bundled assets
            loadUrl("file:///android_asset/game/index.html")
        }
    }
}
