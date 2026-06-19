import 'package:dio/dio.dart';
import 'package:in_app_review/in_app_review.dart';
import 'package:injectable/injectable.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/env.dart';

@singleton
class RatingService {
  RatingService(this._prefs);
  final SharedPreferences _prefs;

  static const _kHasRated = 'pak_has_rated';
  static const _kOpenCount = 'pak_app_open_count';
  static const _minOpensBeforePrompt = 3;

  bool get hasRated => _prefs.getBool(_kHasRated) ?? false;
  int get _openCount => _prefs.getInt(_kOpenCount) ?? 0;

  bool get shouldShowRating => !hasRated && _openCount >= _minOpensBeforePrompt;

  Future<void> incrementOpenCount() async {
    if (hasRated) return;
    await _prefs.setInt(_kOpenCount, _openCount + 1);
  }

  Future<void> markRated() async {
    await _prefs.setBool(_kHasRated, true);
  }

  Future<void> requestInAppReview() async {
    final review = InAppReview.instance;
    try {
      if (await review.isAvailable()) {
        await review.requestReview();
        return;
      }
    } catch (_) {}
    // Fallback: open Play Store listing for review
    try {
      await review.openStoreListing();
    } catch (_) {}
  }

  Future<void> submitFeedback({required int rating, String? message}) async {
    // Mark rated first so dialog never shows again even if API fails
    await markRated();

    try {
      final info = await PackageInfo.fromPlatform();
      final feedbackUrl = Env.apiBaseUrl
          .replaceFirst(RegExp(r'/[^/]+$'), '/feedback');

      await Dio().post<dynamic>(
        feedbackUrl,
        data: <String, dynamic>{
          'type': 'rating',
          'message': message?.trim().isNotEmpty == true
              ? message!.trim()
              : 'Rated $rating/5 stars',
          'appVersion': '${info.version} (${info.buildNumber})',
          'platform': 'android',
          'rating': rating,
        },
        options: Options(
          headers: {'X-App-Name': 'pakistani-serials'},
          sendTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
        ),
      );
    } catch (_) {
      // Crash-protected: silently fail — rating flag is already saved
    }
  }
}
