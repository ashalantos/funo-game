# FUNO! — Publishing Guide

## 1. Open in Android Studio

1. Download and install **Android Studio** from https://developer.android.com/studio
2. Launch Android Studio → **File > Open**
3. Navigate to and select the `android/` folder inside your project
4. Wait for Gradle sync to complete (bottom status bar shows "Gradle sync finished")
5. If prompted to install missing SDK versions, click **Install** and accept licences

---

## 2. Replace Test Ad IDs with Real AdMob IDs

> ⚠️ **Never publish the TEST IDs to the Play Store.** Google will reject or limit your earnings.

### 2a. Create an AdMob account

1. Go to https://admob.google.com and sign in with your Google account
2. Click **Add app** → choose **Android** → enter app name "FUNO!"
3. Copy the **App ID** (format: `ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX`)

### 2b. Create ad units

Inside your AdMob app, create three ad units:

| Type | Suggested name | Placeholder |
|---|---|---|
| Banner | FUNO Banner | `ca-app-pub-…/…` |
| Interstitial | FUNO Interstitial | `ca-app-pub-…/…` |
| Rewarded | FUNO Rewarded | `ca-app-pub-…/…` |

### 2c. Update the code

**`app/build.gradle`** — replace the `admobAppId` value:

```groovy
manifestPlaceholders = [admobAppId: "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"]
```

**`app/src/main/res/layout/activity_main.xml`** — replace the banner unit ID:

```xml
ads:adUnitId="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
```

**`app/src/main/java/com/funo/game/MainActivity.kt`** — replace all three constants at the top of the file:

```kotlin
private const val BANNER_AD_UNIT_ID       = "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
private const val INTERSTITIAL_AD_UNIT_ID = "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
private const val REWARDED_AD_UNIT_ID     = "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
```

---

## 3. Generate a Release Signing Keystore

You need a keystore to sign the release build. **Keep this file safe — you need it for every future update.**

Run this command in any terminal (Java/JDK must be installed):

```bash
keytool -genkey -v \
  -keystore funo-release.jks \
  -alias funo \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

You will be asked for:
- A **keystore password** (remember this!)
- Your name, organisation, country
- A **key password** (can be the same as keystore password)

Store `funo-release.jks` somewhere safe **outside** your project folder — never commit it to git.

---

## 4. Add Signing Config to `app/build.gradle`

Open `app/build.gradle` and add `signingConfigs` inside the `android {}` block:

```groovy
android {
    // ... existing config ...

    signingConfigs {
        release {
            storeFile     file("C:/path/to/funo-release.jks")   // absolute path
            storePassword "your_keystore_password"
            keyAlias      "funo"
            keyPassword   "your_key_password"
        }
    }

    buildTypes {
        release {
            signingConfig     signingConfigs.release              // add this line
            minifyEnabled     true
            shrinkResources   true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

> 💡 **Tip:** Instead of hardcoding passwords, use `gradle.properties` or environment variables so passwords aren't in source code.

---

## 5. Build the Release AAB

An **AAB (Android App Bundle)** is what Google Play requires (smaller download for users than a raw APK).

### Using Android Studio

**Build > Generate Signed Bundle / APK** → select **Android App Bundle** → fill in keystore details → **Finish**

### Using the terminal

```powershell
# From inside the android/ folder:
.\gradlew bundleRelease

# The output file will be at:
# app\build\outputs\bundle\release\app-release.aab
```

---

## 6. Sync game assets before building

Whenever you update the web game files, run this first:

```powershell
# From inside the android/ folder:
.\copy-game-assets.ps1
```

Then rebuild.

---

## 7. Upload to Google Play Console

1. Go to https://play.google.com/console and pay the **one-time $25 registration fee**
2. Click **Create app** → fill in app details:
   - App name: **FUNO!**
   - Default language: English
   - Type: **Game**
   - Free / Paid: your choice
3. Fill in all required sections in the left-hand checklist:
   - **Store listing** — title, short & full description, screenshots (phone + 7-inch tablet), feature graphic (1024×500px), app icon (512×512px)
   - **Content rating** — complete the questionnaire (this is a card game, should be rated **Everyone**)
   - **Pricing & distribution** — select countries
   - **App content** — answer privacy/ads questions (you use AdMob, so select "yes" to ads)
4. Go to **Testing > Internal testing** → create a release → upload your `.aab` file
5. Add yourself as a tester and test on a real device
6. Once happy, promote to **Production** → submit for review (usually 1–3 days)

---

## Checklist before submitting

- [ ] Real AdMob IDs in place (not TEST IDs)
- [ ] `versionCode` incremented in `app/build.gradle` (start at 1, increase with every update)
- [ ] `versionName` updated (e.g. `"1.0.0"`)
- [ ] Game assets copied via `copy-game-assets.ps1`
- [ ] App tested on a physical Android device
- [ ] Privacy policy URL added in Play Console (required if you show ads)
- [ ] Store screenshots prepared (min 2 phone screenshots required)
- [ ] Feature graphic created (1024 × 500 px)
- [ ] App icon prepared (512 × 512 px, PNG, no transparency)

---

## Privacy Policy (required for AdMob)

Google requires a privacy policy for any app that shows ads. You can generate a free one at:
- https://www.privacypolicygenerator.info
- https://app-privacy-policy-generator.nisrulz.com

Host it on GitHub Pages (free) or any public URL, then add the link in Play Console under **App content > Privacy policy**.

---

## Useful links

| Resource | URL |
|---|---|
| Android Studio | https://developer.android.com/studio |
| AdMob | https://admob.google.com |
| Google Play Console | https://play.google.com/console |
| AdMob policies | https://support.google.com/admob/answer/6128543 |
| Play Store policies | https://play.google.com/about/developer-content-policy |
| Free privacy policy generator | https://www.privacypolicygenerator.info |
