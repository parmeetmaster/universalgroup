import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'notification_constants.dart';

/// Manages DND (Do Not Disturb) window and notification queue.
///
/// Notifications received outside the allowed window are queued in
/// SharedPreferences and shown at the next window start time.
class NotificationQueue {
  NotificationQueue(this._prefs);

  final SharedPreferences _prefs;

  // -- DND window --

  String get startTime =>
      _prefs.getString(kPrefDndStartTime) ?? kDefaultDndStart;

  String get endTime => _prefs.getString(kPrefDndEndTime) ?? kDefaultDndEnd;

  /// Update the DND window from server config values.
  /// Returns true if values were updated.
  Future<bool> updateWindowFromConfig({
    String? startTime,
    String? endTime,
  }) async {
    final start = _parseTime(startTime);
    final end = _parseTime(endTime);

    final effectiveStart = start ?? _parseTime(kDefaultDndStart)!;
    final effectiveEnd = end ?? _parseTime(kDefaultDndEnd)!;

    // start must be before end (no overnight windows)
    if (effectiveStart.hour > effectiveEnd.hour ||
        (effectiveStart.hour == effectiveEnd.hour &&
            effectiveStart.minute >= effectiveEnd.minute)) {
      debugPrint('FCM: Invalid DND window, using defaults');
      return false;
    }

    if (startTime != null) {
      await _prefs.setString(kPrefDndStartTime, startTime);
    }
    if (endTime != null) {
      await _prefs.setString(kPrefDndEndTime, endTime);
    }
    return true;
  }

  /// Returns true if notifications can be shown right now.
  bool isWithinAllowedWindow() {
    final now = DateTime.now();
    final start = _parseTime(startTime);
    final end = _parseTime(endTime);

    if (start == null || end == null) return true;

    final nowMinutes = now.hour * 60 + now.minute;
    final startMinutes = start.hour * 60 + start.minute;
    final endMinutes = end.hour * 60 + end.minute;

    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }

  // -- Queue operations --

  /// Add a notification to the pending queue.
  Future<void> enqueue(NotificationData data) async {
    final queue = _getQueue();
    queue.add(data.toMap());
    await _saveQueue(queue);
    debugPrint('FCM: Queued notification for DND window');
  }

  /// Get all queued notifications and clear the queue.
  /// Returns the most recent notification only (per guidelines).
  Future<NotificationData?> dequeueLatest() async {
    final queue = _getQueue();
    if (queue.isEmpty) return null;

    final latest = queue.last;
    await _clearQueue();
    return NotificationData.fromMap(
      latest.map((k, v) => MapEntry(k, v as dynamic)),
    );
  }

  /// Check if there are pending queued notifications.
  bool get hasPending => _getQueue().isNotEmpty;

  Future<void> _clearQueue() async {
    await _prefs.remove(kPrefNotifQueue);
  }

  List<Map<String, String>> _getQueue() {
    final raw = _prefs.getString(kPrefNotifQueue);
    if (raw == null || raw.isEmpty) return [];
    try {
      final list = jsonDecode(raw) as List;
      return list
          .map((e) => Map<String, String>.from(e as Map))
          .toList(growable: true);
    } catch (e) {
      debugPrint('FCM: Failed to parse queue: $e');
      return [];
    }
  }

  Future<void> _saveQueue(List<Map<String, String>> queue) async {
    await _prefs.setString(kPrefNotifQueue, jsonEncode(queue));
  }

  /// Parse "HH:mm" format to a time-only record.
  _TimeOnly? _parseTime(String? value) {
    if (value == null || value.isEmpty) return null;
    final parts = value.split(':');
    if (parts.length != 2) return null;
    final hour = int.tryParse(parts[0]);
    final minute = int.tryParse(parts[1]);
    if (hour == null || minute == null) return null;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return _TimeOnly(hour, minute);
  }

  // -- Country detection --

  /// Detect and cache the user's country code from device locale.
  Future<String> detectAndCacheCountry() async {
    final cached = _prefs.getString(kPrefCountryCode);
    // Re-detect on each app start
    final locale = PlatformDispatcher.instance.locale;
    final country =
        locale.countryCode?.toUpperCase() ?? cached ?? _countryFromTimezone();
    await _prefs.setString(kPrefCountryCode, country);
    return country;
  }

  String _countryFromTimezone() {
    final offset = DateTime.now().timeZoneOffset;
    // Basic timezone-to-country fallback
    if (offset == const Duration(hours: 5)) return 'PK';
    if (offset == const Duration(hours: 5, minutes: 30)) return 'IN';
    if (offset == Duration.zero) return 'GB';
    if (offset == const Duration(hours: -5)) return 'US';
    if (offset == const Duration(hours: -8)) return 'US';
    if (offset == const Duration(hours: 4)) return 'AE';
    if (offset == const Duration(hours: 3)) return 'SA';
    return 'PK'; // Default
  }

  // -- Notification ID management --

  /// Get the next unique notification ID for token-based messages.
  int getNextTokenNotificationId() {
    final current = _prefs.getInt(kPrefNotifIdCounter) ?? 100;
    final next = current + 1;
    _prefs.setInt(kPrefNotifIdCounter, next);
    return next;
  }
}

class _TimeOnly {
  const _TimeOnly(this.hour, this.minute);
  final int hour;
  final int minute;
}
