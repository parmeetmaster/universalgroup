package com.pakistanidrama.serial

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.media.AudioAttributes
import android.os.Build
import android.provider.Settings
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugins.googlemobileads.GoogleMobileAdsPlugin

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        // Create high-importance notification channel for FCM
        createNotificationChannel()

        GoogleMobileAdsPlugin.registerNativeAdFactory(
            flutterEngine,
            "listTile",
            ListTileNativeAdFactory(this)
        )

        // Notification cancel channel — dismiss all notifications when one is tapped
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "com.pakistanidrama.serial/notifications")
            .setMethodCallHandler { call, result ->
                if (call.method == "cancelAll") {
                    val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
                    nm.cancelAll()
                    result.success(null)
                } else {
                    result.notImplemented()
                }
            }

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "com.pakistanidrama.serial/cast")
            .setMethodCallHandler { call, result ->
                if (call.method == "openCastDialog") {
                    val actions = arrayOf(
                        "android.settings.WIFI_DISPLAY_SETTINGS",
                        "com.android.settings.WIFI_DISPLAY_SETTINGS",
                        "android.settings.CAST_SETTINGS",
                        "com.google.android.gms.settings.CAST_SETTINGS",
                    )
                    for (action in actions) {
                        try {
                            val intent = Intent(action)
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

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager

            // Remove legacy channels (immutable once created)
            nm.deleteNotificationChannel("pak_high_priority")
            nm.deleteNotificationChannel("pak_episodes")

            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()

            // Silent medium — DEFAULT importance, no sound, no vibration
            nm.createNotificationChannel(NotificationChannel(
                "pak_silent_medium", "Episodes",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "New episode notifications (silent)"
                setSound(null, null)
                enableVibration(false)
                vibrationPattern = longArrayOf(0)
                setShowBadge(true)
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
            })

            // Silent high — HIGH importance (heads-up), no sound, no vibration
            nm.createNotificationChannel(NotificationChannel(
                "pak_silent_high", "Important Updates",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Important notifications without sound"
                setSound(null, null)
                enableVibration(false)
                vibrationPattern = longArrayOf(0)
                setShowBadge(true)
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
            })

            // Invisible — MIN importance, data-only processing
            nm.createNotificationChannel(NotificationChannel(
                "pak_invisible", "Background",
                NotificationManager.IMPORTANCE_MIN
            ).apply {
                description = "Silent background processing"
                setSound(null, null)
                enableVibration(false)
                vibrationPattern = longArrayOf(0)
                setShowBadge(false)
            })

            // Sound medium — DEFAULT importance, default sound, default vibration
            nm.createNotificationChannel(NotificationChannel(
                "pak_sound_medium", "Episodes (Sound)",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "New episode notifications with sound"
                setSound(Settings.System.DEFAULT_NOTIFICATION_URI, audioAttributes)
                enableVibration(true)
                setShowBadge(true)
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
            })

            // Sound high — HIGH importance (heads-up), default sound, default vibration
            nm.createNotificationChannel(NotificationChannel(
                "pak_sound_high", "Urgent (Sound)",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Urgent notifications with sound"
                setSound(Settings.System.DEFAULT_NOTIFICATION_URI, audioAttributes)
                enableVibration(true)
                setShowBadge(true)
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
            })
        }
    }

    override fun cleanUpFlutterEngine(flutterEngine: FlutterEngine) {
        GoogleMobileAdsPlugin.unregisterNativeAdFactory(flutterEngine, "listTile")
        super.cleanUpFlutterEngine(flutterEngine)
    }
}
