package com.pakistanidrama.serial

import android.content.Intent
import android.provider.Settings
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugins.googlemobileads.GoogleMobileAdsPlugin

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        GoogleMobileAdsPlugin.registerNativeAdFactory(
            flutterEngine,
            "listTile",
            ListTileNativeAdFactory(this)
        )

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "com.pakistanidrama.serial/cast")
            .setMethodCallHandler { call, result ->
                if (call.method == "openCastDialog") {
                    // Try multiple cast/mirror intents (different OEMs use different actions)
                    val actions = arrayOf(
                        "android.settings.WIFI_DISPLAY_SETTINGS",    // Screen mirroring (most OEMs)
                        "com.android.settings.WIFI_DISPLAY_SETTINGS", // Samsung
                        "android.settings.CAST_SETTINGS",             // Stock Android cast
                        "com.google.android.gms.settings.CAST_SETTINGS", // Google cast
                    )
                    for (action in actions) {
                        try {
                            val intent = Intent(action)
                            // Don't use FLAG_ACTIVITY_NEW_TASK — stay in app context
                            startActivity(intent)
                            result.success(null)
                            return@setMethodCallHandler
                        } catch (_: Exception) { }
                    }
                    result.error("UNAVAILABLE", "Cast settings not found", null)
                } else {
                    result.notImplemented()
                }
            }
    }

    override fun cleanUpFlutterEngine(flutterEngine: FlutterEngine) {
        GoogleMobileAdsPlugin.unregisterNativeAdFactory(flutterEngine, "listTile")
        super.cleanUpFlutterEngine(flutterEngine)
    }
}
