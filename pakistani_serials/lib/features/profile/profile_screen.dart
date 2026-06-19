import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/config/app_config_store.dart';
import '../../core/config/env.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/spacing.dart';
import '../../l10n/generated/app_localizations.dart';
import '../settings/presentation/bloc/settings_bloc.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final s = S.of(context)!;
    final cfg = AppConfigStore.value;

    // Only surface the link tile if a URL is actually configured.
    final linkTiles = <_LinkTile>[
      if (_nonEmpty(cfg.playStoreUrl))
        _LinkTile(
          icon: Icons.star_rounded,
          label: 'Rate on Play Store',
          url: cfg.playStoreUrl!,
        ),
      if (_nonEmpty(cfg.supportEmail))
        _LinkTile(
          icon: Icons.mail_outline_rounded,
          label: 'Contact support',
          url: 'mailto:${cfg.supportEmail}',
        ),
      if (_nonEmpty(cfg.privacyUrl))
        _LinkTile(
          icon: Icons.shield_outlined,
          label: 'Privacy policy',
          url: cfg.privacyUrl!,
        ),
      if (_nonEmpty(cfg.termsUrl))
        _LinkTile(
          icon: Icons.description_outlined,
          label: 'Terms of service',
          url: cfg.termsUrl!,
        ),
    ];

    return Scaffold(
      appBar: AppBar(title: Text(s.settingsTitle)),
      body: BlocBuilder<SettingsBloc, SettingsState>(
        builder: (ctx, state) {
          return ListView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            children: [
              // Notifications + Language + About
              _Card(children: [
                SwitchListTile(
                  secondary: const Icon(Icons.notifications_active_outlined),
                  title: const Text('Notifications'),
                  subtitle: const Text('New episode alerts'),
                  value: state.notificationsEnabled,
                  activeThumbColor: AppColors.accent,
                  onChanged: (v) =>
                      ctx.read<SettingsBloc>().add(ToggleNotifications(v)),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.language_rounded),
                  title: Text(s.settingsLanguage),
                  trailing: DropdownButton<String>(
                    value: state.locale.languageCode,
                    underline: const SizedBox.shrink(),
                    items: [
                      DropdownMenuItem(value: 'en', child: Text(s.langEnglish)),
                      DropdownMenuItem(value: 'ur', child: Text(s.langUrdu)),
                      DropdownMenuItem(value: 'pa', child: Text(s.langPunjabi)),
                      DropdownMenuItem(value: 'hi', child: Text(s.langHindi)),
                    ],
                    onChanged: (v) {
                      if (v != null) {
                        ctx.read<SettingsBloc>().add(ChangeLocale(Locale(v)));
                      }
                    },
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.info_outline_rounded),
                  title: Text(s.settingsAbout),
                  subtitle: Text(s.appName),
                ),
              ]),

              if (cfg.announcement != null && cfg.announcement!.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.x2),
                _Announcement(text: cfg.announcement!),
              ],

              const SizedBox(height: AppSpacing.x2),
              _Card(children: [
                ListTile(
                  leading: const Icon(Icons.share_rounded),
                  title: const Text('Share app'),
                  subtitle: const Text('Tell your friends about us'),
                  trailing: const Icon(Icons.chevron_right_rounded, size: 20),
                  onTap: () => _shareApp(context),
                ),
              ]),

              if (linkTiles.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.x2),
                _Card(
                  children: _interleave(
                    linkTiles.map<Widget>((t) => _LinkRow(tile: t)).toList(),
                    const Divider(height: 1),
                  ),
                ),
              ],

              const SizedBox(height: AppSpacing.x2),
              FutureBuilder<PackageInfo>(
                future: PackageInfo.fromPlatform(),
                builder: (ctx, snap) {
                  final v = snap.data;
                  final current = v?.version ?? '—';
                  final latest = cfg.latestAppVersion;
                  final updateAvailable =
                      v != null && _isOlder(v.version, latest);
                  return Column(
                    children: [
                      Text(
                        '${s.settingsVersion} $current (${v?.buildNumber ?? "—"})',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      if (updateAvailable && _nonEmpty(cfg.playStoreUrl)) ...[
                        const SizedBox(height: 6),
                        TextButton.icon(
                          onPressed: () => _open(cfg.playStoreUrl!),
                          icon: const Icon(Icons.arrow_circle_up_rounded, size: 16),
                          label: Text('Update to $latest'),
                        ),
                      ],
                    ],
                  );
                },
              ),
            ],
          );
        },
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(
          color: AppColors.surfaceElevated,
          borderRadius: BorderRadius.circular(AppRadii.card),
        ),
        child: Column(children: children),
      );
}

class _LinkTile {
  const _LinkTile({required this.icon, required this.label, required this.url});
  final IconData icon;
  final String label;
  final String url;
}

class _LinkRow extends StatelessWidget {
  const _LinkRow({required this.tile});
  final _LinkTile tile;
  @override
  Widget build(BuildContext context) => ListTile(
        leading: Icon(tile.icon),
        title: Text(tile.label),
        trailing: const Icon(Icons.chevron_right_rounded, size: 20),
        onTap: () => _open(tile.url),
      );
}

class _Announcement extends StatelessWidget {
  const _Announcement({required this.text});
  final String text;
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.accent.withValues(alpha: 0.1),
          border: Border.all(color: AppColors.accent.withValues(alpha: 0.3)),
          borderRadius: BorderRadius.circular(AppRadii.card),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.campaign_rounded, color: AppColors.accent, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                text,
                style: const TextStyle(color: Colors.white, fontSize: 13.5),
              ),
            ),
          ],
        ),
      );
}

Future<void> _shareApp(BuildContext context) async {
  final cfg = AppConfigStore.value;
  final storeUrl = cfg.playStoreUrl ?? '';

  final text = StringBuffer()
    ..writeln('${Env.appName} - Watch Pakistani Dramas & Serials FREE!')
    ..writeln()
    ..writeln('Stream your favourite Pakistani dramas anytime, anywhere.')
    ..writeln();
  if (storeUrl.isNotEmpty) {
    text.writeln('Download now: $storeUrl');
  }

  // Write the app icon to a temp file so it appears in the share sheet.
  XFile? logoFile;
  try {
    final byteData = await rootBundle.load('assets/icons/app_icon.png');
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/pakistani_serials_share.png');
    await file.writeAsBytes(byteData.buffer.asUint8List());
    logoFile = XFile(file.path, mimeType: 'image/png');
  } catch (_) {
    // If icon not bundled as asset, share text only.
  }

  final shareText = text.toString().trimRight();
  if (logoFile != null) {
    await Share.shareXFiles([logoFile], text: shareText, subject: Env.appName);
  } else {
    await Share.share(shareText, subject: Env.appName);
  }
}

bool _nonEmpty(String? s) => s != null && s.trim().isNotEmpty;

Future<void> _open(String url) async {
  final uri = Uri.tryParse(url);
  if (uri == null) return;
  await launchUrl(uri, mode: LaunchMode.externalApplication);
}

/// Returns true if `a` is strictly older than `b` (semver-ish, ignores suffixes).
bool _isOlder(String a, String b) {
  List<int> parts(String v) => v.split(RegExp(r'[-+]')).first.split('.')
      .map((p) => int.tryParse(p) ?? 0).toList(growable: false);
  final as = parts(a), bs = parts(b);
  final len = as.length > bs.length ? as.length : bs.length;
  for (int i = 0; i < len; i++) {
    final ai = i < as.length ? as[i] : 0;
    final bi = i < bs.length ? bs[i] : 0;
    if (ai != bi) return ai < bi;
  }
  return false;
}

List<Widget> _interleave(List<Widget> items, Widget separator) {
  if (items.length < 2) return items;
  final out = <Widget>[];
  for (int i = 0; i < items.length; i++) {
    out.add(items[i]);
    if (i < items.length - 1) out.add(separator);
  }
  return out;
}
