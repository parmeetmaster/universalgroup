class AppConfigModel {
  final String minAppVersion;
  final String latestAppVersion;
  final bool forceUpdate;
  final bool maintenanceMode;
  final String? maintenanceMessage;
  final String? announcement;
  final String? playStoreUrl;
  final String? supportEmail;
  final String? privacyUrl;
  final String? termsUrl;

  const AppConfigModel({
    required this.minAppVersion,
    required this.latestAppVersion,
    required this.forceUpdate,
    required this.maintenanceMode,
    this.maintenanceMessage,
    this.announcement,
    this.playStoreUrl,
    this.supportEmail,
    this.privacyUrl,
    this.termsUrl,
  });

  factory AppConfigModel.fromJson(Map<String, dynamic> json) => AppConfigModel(
        minAppVersion: (json['minAppVersion'] as String?) ?? '1.0.0',
        latestAppVersion: (json['latestAppVersion'] as String?) ?? '1.0.0',
        forceUpdate: (json['forceUpdate'] as bool?) ?? false,
        maintenanceMode: (json['maintenanceMode'] as bool?) ?? false,
        maintenanceMessage: json['maintenanceMessage'] as String?,
        announcement: json['announcement'] as String?,
        playStoreUrl: json['playStoreUrl'] as String?,
        supportEmail: json['supportEmail'] as String?,
        privacyUrl: json['privacyUrl'] as String?,
        termsUrl: json['termsUrl'] as String?,
      );

  static const fallback = AppConfigModel(
    minAppVersion: '1.0.0',
    latestAppVersion: '1.0.0',
    forceUpdate: false,
    maintenanceMode: false,
  );
}
