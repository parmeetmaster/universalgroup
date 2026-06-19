import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:injectable/injectable.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _kSubscribed = 'fcm_subscribed';
const _kEnabled = 'fcm_enabled';
const _kDramaTopics = 'fcm_drama_topics';
const _globalTopic = 'pak_new_episode';

@singleton
class NotificationService {
  NotificationService(this._prefs);
  final SharedPreferences _prefs;

  bool _initialized = false;

  /// Whether push notifications are enabled. Opt-out model — on by default.
  bool get enabled => _prefs.getBool(_kEnabled) ?? true;

  List<String> get _dramaTopics => _prefs.getStringList(_kDramaTopics) ?? const [];

  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;

    final messaging = FirebaseMessaging.instance;

    final settings = await messaging.requestPermission();
    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      debugPrint('FCM: Permission denied');
      return;
    }

    // Respect the user's opt-out — don't (re)subscribe while disabled.
    if (enabled) {
      final alreadySubscribed = _prefs.getBool(_kSubscribed) ?? false;
      if (!alreadySubscribed) {
        await messaging.subscribeToTopic(_globalTopic);
        await _prefs.setBool(_kSubscribed, true);
        debugPrint('FCM: Subscribed to $_globalTopic');
      }
    }

    FirebaseMessaging.onMessage.listen(_onForegroundMessage);

    // When user taps a notification → cancel all other notifications
    FirebaseMessaging.onMessageOpenedApp.listen((_) => cancelAllNotifications());
    // Check if app was opened from a terminated state via notification
    final initial = await messaging.getInitialMessage();
    if (initial != null) cancelAllNotifications();
  }

  /// Enable or disable all push notifications. When disabled, the device is
  /// unsubscribed from EVERY enrolled topic (global + every followed drama) so
  /// no further pushes arrive; when re-enabled they are restored.
  Future<void> setEnabled(bool value) async {
    await _prefs.setBool(_kEnabled, value);
    final messaging = FirebaseMessaging.instance;
    if (value) {
      await messaging.subscribeToTopic(_globalTopic);
      await _prefs.setBool(_kSubscribed, true);
      for (final topic in _dramaTopics) {
        await messaging.subscribeToTopic(topic);
      }
      debugPrint('FCM: Notifications enabled');
    } else {
      await messaging.unsubscribeFromTopic(_globalTopic);
      await _prefs.setBool(_kSubscribed, false);
      for (final topic in _dramaTopics) {
        await messaging.unsubscribeFromTopic(topic);
      }
      debugPrint('FCM: Notifications disabled — unsubscribed from all topics');
    }
  }

  /// Cancel all notifications from the shade when one is tapped
  void cancelAllNotifications() {
    try {
      // Use Android NotificationManager via platform channel
      const channel = MethodChannel('com.pakistanidrama.serial/notifications');
      channel.invokeMethod('cancelAll');
    } catch (e) {
      debugPrint('Failed to cancel notifications: $e');
    }
  }

  Future<void> subscribeToDrama(String slug) async {
    final topic = _dramaTopic(slug);
    final topics = {..._dramaTopics, topic}.toList();
    await _prefs.setStringList(_kDramaTopics, topics);
    if (!enabled) return; // honor opt-out — restored on re-enable
    await FirebaseMessaging.instance.subscribeToTopic(topic);
    debugPrint('FCM: Subscribed to $topic');
  }

  Future<void> unsubscribeFromDrama(String slug) async {
    final topic = _dramaTopic(slug);
    final topics = _dramaTopics.where((t) => t != topic).toList();
    await _prefs.setStringList(_kDramaTopics, topics);
    await FirebaseMessaging.instance.unsubscribeFromTopic(topic);
    debugPrint('FCM: Unsubscribed from $topic');
  }

  String _dramaTopic(String slug) =>
      'pak_drama_${slug.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '_')}';

  void _onForegroundMessage(RemoteMessage message) {
    debugPrint('FCM foreground: ${message.notification?.title} - ${message.notification?.body}');
  }
}
