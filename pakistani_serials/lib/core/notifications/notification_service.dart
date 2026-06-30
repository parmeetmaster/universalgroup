import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:injectable/injectable.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'notification_channels.dart';
import 'notification_constants.dart';
import 'notification_handler.dart';
import 'notification_queue.dart';

/// Top-level background message handler — required by Firebase.
/// Must be a top-level function (not a class method).
@pragma('vm:entry-point')
Future<void> firebaseBackgroundMessageHandler(RemoteMessage message) async {
  final prefs = await SharedPreferences.getInstance();
  final queue = NotificationQueue(prefs);
  final plugin = FlutterLocalNotificationsPlugin();

  // Initialize plugin minimally for background
  const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
  const initSettings = InitializationSettings(android: androidInit);
  await plugin.initialize(initSettings);

  final handler = NotificationHandler(
    plugin: plugin,
    queue: queue,
    prefs: prefs,
  );

  await handler.handleDataMessage(message.data);
}

@singleton
class NotificationService {
  NotificationService(this._prefs);

  final SharedPreferences _prefs;
  bool _initialized = false;

  late final FlutterLocalNotificationsPlugin _plugin;
  late final NotificationQueue _queue;
  late final NotificationHandler _handler;

  bool get enabled => _prefs.getBool(kPrefFcmEnabled) ?? true;
  bool get soundEnabled => _prefs.getBool(kPrefSoundEnabled) ?? false;

  List<String> get _dramaTopics =>
      _prefs.getStringList(kPrefDramaTopics) ?? const [];

  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;

    _plugin = FlutterLocalNotificationsPlugin();
    _queue = NotificationQueue(_prefs);
    _handler = NotificationHandler(
      plugin: _plugin,
      queue: _queue,
      prefs: _prefs,
    );

    final messaging = FirebaseMessaging.instance;

    final settings = await messaging.requestPermission();
    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      debugPrint('FCM: Permission denied');
      return;
    }

    // Initialize local notifications plugin
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidInit);
    await _plugin.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _handler.onNotificationTap,
    );

    // Create all 5 notification channels
    await NotificationChannels.createAll(_plugin);

    // Register background message handler
    FirebaseMessaging.onBackgroundMessage(firebaseBackgroundMessageHandler);

    // Subscribe to global topic if enabled
    if (enabled) {
      final alreadySubscribed = _prefs.getBool(kPrefFcmSubscribed) ?? false;
      if (!alreadySubscribed) {
        await messaging.subscribeToTopic(kGlobalTopic);
        await _prefs.setBool(kPrefFcmSubscribed, true);
        debugPrint('FCM: Subscribed to $kGlobalTopic');
      }
    }

    // Foreground data messages — handle via custom handler
    FirebaseMessaging.onMessage.listen(_onForegroundMessage);

    // Background/terminated tap — handle navigation
    FirebaseMessaging.onMessageOpenedApp.listen(_onMessageOpenedApp);

    // Cold-start tap — app was terminated
    final initial = await messaging.getInitialMessage();
    if (initial != null) _onMessageOpenedApp(initial);

    // Detect and cache country
    await _queue.detectAndCacheCountry();

    // Show any queued notifications from DND period
    await _handler.showQueuedNotifications();
  }

  /// Update DND window from server app_config response.
  Future<void> updateDndWindow({
    String? startTime,
    String? endTime,
  }) async {
    if (!_initialized) return;
    await _queue.updateWindowFromConfig(
      startTime: startTime,
      endTime: endTime,
    );
  }

  // -- Topic management --

  Future<void> setEnabled(bool value) async {
    await _prefs.setBool(kPrefFcmEnabled, value);
    final messaging = FirebaseMessaging.instance;
    if (value) {
      await messaging.subscribeToTopic(kGlobalTopic);
      await _prefs.setBool(kPrefFcmSubscribed, true);
      for (final topic in _dramaTopics) {
        await messaging.subscribeToTopic(topic);
      }
      debugPrint('FCM: Notifications enabled');
    } else {
      await messaging.unsubscribeFromTopic(kGlobalTopic);
      await _prefs.setBool(kPrefFcmSubscribed, false);
      for (final topic in _dramaTopics) {
        await messaging.unsubscribeFromTopic(topic);
      }
      debugPrint('FCM: Notifications disabled');
    }
  }

  Future<void> setSoundEnabled(bool value) async {
    await _prefs.setBool(kPrefSoundEnabled, value);
    debugPrint('FCM: Sound ${value ? 'enabled' : 'disabled'}');
  }

  Future<void> subscribeToDrama(String slug) async {
    final topic = _dramaTopic(slug);
    final topics = {..._dramaTopics, topic}.toList();
    await _prefs.setStringList(kPrefDramaTopics, topics);
    if (!enabled) return;
    await FirebaseMessaging.instance.subscribeToTopic(topic);
    debugPrint('FCM: Subscribed to $topic');
  }

  Future<void> unsubscribeFromDrama(String slug) async {
    final topic = _dramaTopic(slug);
    final topics = _dramaTopics.where((t) => t != topic).toList();
    await _prefs.setStringList(kPrefDramaTopics, topics);
    await FirebaseMessaging.instance.unsubscribeFromTopic(topic);
    debugPrint('FCM: Unsubscribed from $topic');
  }

  void cancelAllNotifications() {
    if (_initialized) {
      _handler.cancelAllNotifications();
    }
  }

  String _dramaTopic(String slug) =>
      'pak_drama_${slug.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '_')}';

  // -- Message listeners --

  void _onForegroundMessage(RemoteMessage message) {
    debugPrint('FCM: Foreground data message received');
    _handler.handleDataMessage(message.data);
  }

  void _onMessageOpenedApp(RemoteMessage message) {
    _handler.onFcmMessageTap(message.data);
  }
}
