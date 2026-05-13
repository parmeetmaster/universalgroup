class Env {
  const Env._();

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://global.animekill.com/api/pakistani-serials',
  );

  /// Config endpoint on global API (used by splash for update check)
  static const String globalConfigUrl =
      'https://global.animekill.com/api/pakistani-serials/config';

  static const String appName = 'Pakistani Serials';

  static const Duration httpConnectTimeout = Duration(seconds: 15);
  static const Duration httpReceiveTimeout = Duration(seconds: 30);
}
