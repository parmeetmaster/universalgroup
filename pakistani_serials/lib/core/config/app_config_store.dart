import '../../features/shared/models/app_config_model.dart';

class AppConfigStore {
  AppConfigStore._();
  static AppConfigModel _value = AppConfigModel.fallback;

  static AppConfigModel get value => _value;
  static void set(AppConfigModel cfg) => _value = cfg;
}
