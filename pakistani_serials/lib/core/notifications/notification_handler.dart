import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../di/injection.dart';
import '../router/app_router.dart';
import '../router/routes.dart';
import 'notification_channels.dart';
import 'notification_constants.dart';
import 'notification_queue.dart';

/// Handles displaying notifications and processing tap actions.
class NotificationHandler {
  NotificationHandler({
    required FlutterLocalNotificationsPlugin plugin,
    required NotificationQueue queue,
    required SharedPreferences prefs,
  })  : _plugin = plugin,
        _queue = queue,
        _prefs = prefs;

  final FlutterLocalNotificationsPlugin _plugin;
  final NotificationQueue _queue;
  final SharedPreferences _prefs;

  bool get _soundEnabled => _prefs.getBool(kPrefSoundEnabled) ?? false;

  /// Process an incoming FCM data message. Handles DND, priority, and display.
  Future<void> handleDataMessage(Map<String, dynamic> data) async {
    final notifData = NotificationData.fromMap(data);

    // Invisible notifications are processed silently, no UI
    if (notifData.priority == NotificationPriority.invisible) {
      debugPrint('FCM: Invisible notification — processing silently');
      _processDataAction(notifData);
      return;
    }

    // Check DND window (invisible is exempt, already handled above)
    if (!_queue.isWithinAllowedWindow()) {
      await _queue.enqueue(notifData);
      return;
    }

    await _showNotification(notifData);
  }

  /// Show all pending queued notifications (called at app start and DND end).
  Future<void> showQueuedNotifications() async {
    final latest = await _queue.dequeueLatest();
    if (latest == null) return;

    debugPrint('FCM: Showing queued notification');
    await _showNotification(latest);
  }

  /// Display a local notification with the correct channel and settings.
  Future<void> _showNotification(NotificationData data) async {
    final androidDetails = NotificationChannels.detailsForPriority(
      data.priority,
      soundEnabled: _soundEnabled,
    );

    final notificationId = _resolveNotificationId(data);
    final payload = _encodePayload(data.toMap());

    await _plugin.show(
      notificationId,
      data.title ?? '',
      data.body ?? '',
      NotificationDetails(android: androidDetails),
      payload: payload,
    );

    debugPrint(
      'FCM: Showed notification [id=$notificationId, '
      'channel=${data.priority.channelId}, '
      'source=${data.source.name}]',
    );
  }

  /// Resolve notification ID based on source type.
  int _resolveNotificationId(NotificationData data) {
    if (data.source == NotificationSource.topic) {
      return kTopicNotificationId;
    }
    return _queue.getNextTokenNotificationId();
  }

  // -- Tap handling --

  /// Handle notification tap from local notification response.
  void onNotificationTap(NotificationResponse response) {
    cancelAllNotifications();
    final data = _decodePayload(response.payload);
    final notifData = NotificationData.fromMap(data);
    _executeAction(notifData);
  }

  /// Handle notification tap from FCM (background/terminated).
  void onFcmMessageTap(Map<String, dynamic> data) {
    cancelAllNotifications();
    final notifData = NotificationData.fromMap(data);
    _executeAction(notifData);
  }

  /// Execute the notification action based on the action type.
  void _executeAction(NotificationData data) {
    switch (data.action) {
      case NotificationAction.updateApp:
        _handleUpdateApp(data.storeUrl);
      case NotificationAction.openUrl:
        _handleOpenUrl(data.url);
      case NotificationAction.openScreen:
        _handleOpenScreen(data.target);
      case NotificationAction.processData:
        _processDataAction(data);
    }
  }

  void _handleUpdateApp(String? storeUrl) {
    final url = storeUrl ??
        'https://play.google.com/store/apps/details?id=com.pakistanidrama.serial';
    _launchUrl(url);
  }

  void _handleOpenUrl(String? url) {
    if (url == null || url.isEmpty) {
      debugPrint('FCM: open_url action with no URL, navigating home');
      _navigateToHome();
      return;
    }
    _launchUrl(url);
  }

  void _handleOpenScreen(String? target) {
    if (target == null || target.isEmpty) {
      _navigateToHome();
      return;
    }
    try {
      final router = getIt<AppRouter>().config;
      router.go(target);
      debugPrint('FCM: Navigated to $target');
    } catch (e) {
      debugPrint('FCM: Navigation failed: $e');
      _navigateToHome();
    }
  }

  void _navigateToHome() {
    try {
      final router = getIt<AppRouter>().config;
      router.go(AppRoutes.home);
    } catch (e) {
      debugPrint('FCM: Home navigation failed: $e');
    }
  }

  void _processDataAction(NotificationData data) {
    debugPrint('FCM: Processing data payload: ${data.payload}');
    // Silent processing — no navigation, no UI
  }

  void _launchUrl(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null) {
      debugPrint('FCM: Invalid URL: $url');
      return;
    }
    launchUrl(uri, mode: LaunchMode.externalApplication).catchError(
      (Object e) {
        debugPrint('FCM: Failed to launch URL: $e');
        return false;
      },
    );
  }

  /// Cancel all notifications (both topic and token).
  void cancelAllNotifications() {
    try {
      const channel = MethodChannel(kNotificationMethodChannel);
      channel.invokeMethod('cancelAll');
    } catch (e) {
      debugPrint('FCM: Failed to cancel notifications: $e');
    }
  }

  // -- Payload serialization --

  String _encodePayload(Map<String, String> data) {
    if (data.isEmpty) return '';
    return data.entries
        .map((e) =>
            '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}')
        .join('&');
  }

  Map<String, dynamic> _decodePayload(String? payload) {
    if (payload == null || payload.isEmpty) return {};
    final map = <String, dynamic>{};
    for (final pair in payload.split('&')) {
      final parts = pair.split('=');
      if (parts.length == 2) {
        map[Uri.decodeComponent(parts[0])] = Uri.decodeComponent(parts[1]);
      }
    }
    return map;
  }
}
