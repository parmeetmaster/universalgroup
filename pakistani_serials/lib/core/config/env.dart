class Env {
  const Env._();

  static const String env = String.fromEnvironment('ENV', defaultValue: 'prod');
  static bool get isProd => env == 'prod';
  static bool get isDev => env == 'dev';

  static const String _prodUrl = 'https://global.animekill.com/api/pakistani-serials';
  static const String _devUrl = 'http://10.0.2.2:3090/api/pakistani-serials';

  static String get apiBaseUrl => isProd ? _prodUrl : _devUrl;
  static String get globalConfigUrl => '$apiBaseUrl/config';

  static const String appName = 'Pakistani Serials';

  static const Duration httpConnectTimeout = Duration(seconds: 15);
  static const Duration httpReceiveTimeout = Duration(seconds: 30);
}
