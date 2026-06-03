import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:injectable/injectable.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _kSubscribed = 'fcm_subscribed';
const _globalTopic = 'pak_new_episode';

@singleton
class NotificationService {
  NotificationService(this._prefs);
  final SharedPreferences _prefs;

  bool _initialized = false;

  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;

    final messaging = FirebaseMessaging.instance;

    final settings = await messaging.requestPermission();
    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      debugPrint('FCM: Permission denied');
      return;
    }

    final alreadySubscribed = _prefs.getBool(_kSubscribed) ?? false;
    if (!alreadySubscribed) {
      await messaging.subscribeToTopic(_globalTopic);
      await _prefs.setBool(_kSubscribed, true);
      debugPrint('FCM: Subscribed to $_globalTopic');
    }

    FirebaseMessaging.onMessage.listen(_onForegroundMessage);
  }

  Future<void> subscribeToDrama(String slug) async {
    final topic = 'pak_drama_${slug.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '_')}';
    await FirebaseMessaging.instance.subscribeToTopic(topic);
    debugPrint('FCM: Subscribed to $topic');
  }

  Future<void> unsubscribeFromDrama(String slug) async {
    final topic = 'pak_drama_${slug.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '_')}';
    await FirebaseMessaging.instance.unsubscribeFromTopic(topic);
    debugPrint('FCM: Unsubscribed from $topic');
  }

  void _onForegroundMessage(RemoteMessage message) {
    debugPrint('FCM foreground: ${message.notification?.title} - ${message.notification?.body}');
  }
}
