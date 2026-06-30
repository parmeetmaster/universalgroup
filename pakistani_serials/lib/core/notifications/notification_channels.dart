import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'notification_constants.dart';

/// Creates all 5 Android notification channels at app startup.
///
/// Android channels are immutable after creation. If settings need to change,
/// bump the channel ID suffix (e.g., `pak_silent_medium_v2`).
class NotificationChannels {
  const NotificationChannels._();

  static Future<void> createAll(
    FlutterLocalNotificationsPlugin plugin,
  ) async {
    if (!Platform.isAndroid) return;

    final android = plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    if (android == null) return;

    for (final channel in _channels) {
      await android.createNotificationChannel(channel);
    }

    debugPrint('FCM: Created ${_channels.length} notification channels');
  }

  static const _channels = [
    // Silent medium — DEFAULT importance, no sound, no vibration
    AndroidNotificationChannel(
      kChannelSilentMedium,
      'Episodes',
      description: 'New episode notifications (silent)',
      importance: Importance.defaultImportance,
      playSound: false,
      enableVibration: false,
      showBadge: true,
    ),

    // Silent high — HIGH importance (heads-up), no sound, no vibration
    AndroidNotificationChannel(
      kChannelSilentHigh,
      'Important Updates',
      description: 'Important notifications without sound',
      importance: Importance.high,
      playSound: false,
      enableVibration: false,
      showBadge: true,
    ),

    // Invisible — MIN importance, data-only processing
    AndroidNotificationChannel(
      kChannelInvisible,
      'Background',
      description: 'Silent background processing',
      importance: Importance.min,
      playSound: false,
      enableVibration: false,
      showBadge: false,
    ),

    // Sound medium — DEFAULT importance, default sound, default vibration
    AndroidNotificationChannel(
      kChannelSoundMedium,
      'Episodes (Sound)',
      description: 'New episode notifications with sound',
      importance: Importance.defaultImportance,
      playSound: true,
      enableVibration: true,
      showBadge: true,
    ),

    // Sound high — HIGH importance (heads-up), default sound, default vibration
    AndroidNotificationChannel(
      kChannelSoundHigh,
      'Urgent (Sound)',
      description: 'Urgent notifications with sound',
      importance: Importance.high,
      playSound: true,
      enableVibration: true,
      showBadge: true,
    ),
  ];

  /// Returns the [AndroidNotificationDetails] for a given priority.
  /// If the user has not enabled sound, forces silent_medium channel.
  static AndroidNotificationDetails detailsForPriority(
    NotificationPriority priority, {
    required bool soundEnabled,
  }) {
    final effectivePriority = _resolveEffectivePriority(
      priority,
      soundEnabled: soundEnabled,
    );

    final channelId = effectivePriority.channelId;
    final channelName = _channelNameMap[channelId] ?? 'Episodes';

    return AndroidNotificationDetails(
      channelId,
      channelName,
      icon: '@mipmap/ic_launcher',
      playSound: _isSoundChannel(effectivePriority),
      enableVibration: _isSoundChannel(effectivePriority),
      priority: _androidPriority(effectivePriority),
      importance: _androidImportance(effectivePriority),
    );
  }

  static NotificationPriority _resolveEffectivePriority(
    NotificationPriority priority, {
    required bool soundEnabled,
  }) {
    if (!soundEnabled &&
        (priority == NotificationPriority.soundMedium ||
            priority == NotificationPriority.soundHigh)) {
      return NotificationPriority.silentMedium;
    }
    return priority;
  }

  static bool _isSoundChannel(NotificationPriority p) =>
      p == NotificationPriority.soundMedium ||
      p == NotificationPriority.soundHigh;

  static Priority _androidPriority(NotificationPriority p) {
    switch (p) {
      case NotificationPriority.silentHigh:
      case NotificationPriority.soundHigh:
        return Priority.high;
      case NotificationPriority.invisible:
        return Priority.min;
      default:
        return Priority.defaultPriority;
    }
  }

  static Importance _androidImportance(NotificationPriority p) {
    switch (p) {
      case NotificationPriority.silentHigh:
      case NotificationPriority.soundHigh:
        return Importance.high;
      case NotificationPriority.invisible:
        return Importance.min;
      default:
        return Importance.defaultImportance;
    }
  }

  static const _channelNameMap = {
    kChannelSilentMedium: 'Episodes',
    kChannelSilentHigh: 'Important Updates',
    kChannelInvisible: 'Background',
    kChannelSoundMedium: 'Episodes (Sound)',
    kChannelSoundHigh: 'Urgent (Sound)',
  };
}
