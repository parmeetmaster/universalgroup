import 'dart:convert';

import 'package:injectable/injectable.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _key = 'pak_last_played';

class LastPlayed {
  const LastPlayed({required this.seasonNumber, required this.episodeNumber});

  factory LastPlayed.fromJson(Map<String, dynamic> json) => LastPlayed(
        seasonNumber: json['s'] as int,
        episodeNumber: json['e'] as int,
      );

  final int seasonNumber;
  final int episodeNumber;

  Map<String, dynamic> toJson() => {'s': seasonNumber, 'e': episodeNumber};
}

@singleton
class WatchHistoryService {
  WatchHistoryService(this._prefs);
  final SharedPreferences _prefs;

  Future<void> saveLastPlayed(
    String dramaSlug,
    int seasonNumber,
    int episodeNumber,
  ) async {
    final map = _readAll();
    map[dramaSlug] =
        LastPlayed(seasonNumber: seasonNumber, episodeNumber: episodeNumber)
            .toJson();
    await _prefs.setString(_key, jsonEncode(map));
  }

  LastPlayed? getLastPlayed(String dramaSlug) {
    final map = _readAll();
    final entry = map[dramaSlug];
    if (entry == null) return null;
    return LastPlayed.fromJson(Map<String, dynamic>.from(entry as Map));
  }

  Map<String, dynamic> _readAll() {
    final raw = _prefs.getString(_key);
    if (raw == null) return {};
    return Map<String, dynamic>.from(jsonDecode(raw) as Map);
  }
}
