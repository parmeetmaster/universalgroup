// Notification system constants, enums, and SharedPreferences keys.

// -- SharedPreferences keys --

const kPrefFcmSubscribed = 'fcm_subscribed';
const kPrefFcmEnabled = 'fcm_enabled';
const kPrefDramaTopics = 'fcm_drama_topics';
const kPrefSoundEnabled = 'notification_sound_enabled';
const kPrefPriorityPref = 'notification_priority_pref';
const kPrefCountryCode = 'notification_country_code';
const kPrefDndStartTime = 'notification_start_time';
const kPrefDndEndTime = 'notification_end_time';
const kPrefNotifQueue = 'notification_queue';
const kPrefNotifIdCounter = 'notification_id_counter';

// -- FCM Topics --

const kGlobalTopic = 'pak_new_episode';

// -- Channel IDs --

const kChannelSilentMedium = 'pak_silent_medium';
const kChannelSilentHigh = 'pak_silent_high';
const kChannelInvisible = 'pak_invisible';
const kChannelSoundMedium = 'pak_sound_medium';
const kChannelSoundHigh = 'pak_sound_high';

// -- Fixed notification ID for topic-based messages --

const kTopicNotificationId = 1;

// -- Default DND window --

const kDefaultDndStart = '08:00';
const kDefaultDndEnd = '23:00';

// -- Method channel --

const kNotificationMethodChannel =
    'com.pakistanidrama.serial/notifications';

// -- Enums --

enum NotificationPriority {
  silentMedium,
  silentHigh,
  invisible,
  soundMedium,
  soundHigh;

  static NotificationPriority fromString(String? value) {
    switch (value) {
      case 'silent_high':
        return NotificationPriority.silentHigh;
      case 'invisible':
        return NotificationPriority.invisible;
      case 'sound_medium':
        return NotificationPriority.soundMedium;
      case 'sound_high':
        return NotificationPriority.soundHigh;
      case 'silent_medium':
      default:
        return NotificationPriority.silentMedium;
    }
  }

  String get channelId {
    switch (this) {
      case NotificationPriority.silentMedium:
        return kChannelSilentMedium;
      case NotificationPriority.silentHigh:
        return kChannelSilentHigh;
      case NotificationPriority.invisible:
        return kChannelInvisible;
      case NotificationPriority.soundMedium:
        return kChannelSoundMedium;
      case NotificationPriority.soundHigh:
        return kChannelSoundHigh;
    }
  }
}

enum NotificationAction {
  openScreen,
  openUrl,
  updateApp,
  processData;

  static NotificationAction fromString(String? value) {
    switch (value) {
      case 'open_url':
        return NotificationAction.openUrl;
      case 'update_app':
        return NotificationAction.updateApp;
      case 'process_data':
        return NotificationAction.processData;
      case 'open_screen':
      default:
        return NotificationAction.openScreen;
    }
  }
}

enum NotificationSource {
  topic,
  token;

  static NotificationSource fromString(String? value) {
    switch (value) {
      case 'token':
        return NotificationSource.token;
      case 'topic':
      default:
        return NotificationSource.topic;
    }
  }
}

/// Parsed notification data from FCM data payload.
class NotificationData {
  const NotificationData({
    required this.priority,
    required this.source,
    required this.action,
    this.title,
    this.body,
    this.imageUrl,
    this.target,
    this.url,
    this.storeUrl,
    this.payload,
  });

  factory NotificationData.fromMap(Map<String, dynamic> data) {
    return NotificationData(
      priority: NotificationPriority.fromString(
        data['notification_priority'] as String?,
      ),
      source: NotificationSource.fromString(data['source'] as String?),
      action: NotificationAction.fromString(data['action'] as String?),
      title: data['title'] as String?,
      body: data['body'] as String?,
      imageUrl: data['image_url'] as String?,
      target: data['target'] as String?,
      url: data['url'] as String?,
      storeUrl: data['store_url'] as String?,
      payload: data['payload'] as String?,
    );
  }

  final NotificationPriority priority;
  final NotificationSource source;
  final NotificationAction action;
  final String? title;
  final String? body;
  final String? imageUrl;
  final String? target;
  final String? url;
  final String? storeUrl;
  final String? payload;

  Map<String, String> toMap() {
    return {
      'notification_priority': priority.channelId,
      'source': source.name,
      'action': action.name,
      if (title != null) 'title': title!,
      if (body != null) 'body': body!,
      if (imageUrl != null) 'image_url': imageUrl!,
      if (target != null) 'target': target!,
      if (url != null) 'url': url!,
      if (storeUrl != null) 'store_url': storeUrl!,
      if (payload != null) 'payload': payload!,
    };
  }
}
