import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import 'dart:convert';
import 'package:http/http.dart' as http;

import '../../core/config/app_config_store.dart';
import '../../core/config/env.dart';
import '../../core/router/routes.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/gradients.dart';
import '../../core/theme/spacing.dart';
import '../../l10n/generated/app_localizations.dart';
import '../shared/models/app_config_model.dart';

enum _Gate { loading, error, maintenance, forceUpdate }

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  _Gate _gate = _Gate.loading;
  String? _message;
  String? _playStoreUrl;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    setState(() {
      _gate = _Gate.loading;
      _message = null;
    });
    final minSplash = Future<void>.delayed(const Duration(milliseconds: 900));
    try {
      final res = await http
          .get(Uri.parse(Env.globalConfigUrl))
          .timeout(const Duration(seconds: 6));
      final cfg = AppConfigModel.fromJson(
        jsonDecode(res.body) as Map<String, dynamic>,
      );
      AppConfigStore.set(cfg);
      final info = await PackageInfo.fromPlatform();
      await minSplash;
      if (!mounted) return;

      // 1) Maintenance — hard stop, user can retry.
      if (cfg.maintenanceMode) {
        setState(() {
          _gate = _Gate.maintenance;
          _message = cfg.maintenanceMessage ??
              'App is under maintenance. Please check back later.';
        });
        return;
      }

      // 2) Force update — current app version < minAppVersion + flag on.
      if (cfg.forceUpdate && _isOlder(info.version, cfg.minAppVersion)) {
        setState(() {
          _gate = _Gate.forceUpdate;
          _playStoreUrl = cfg.playStoreUrl;
          _message =
              'A newer version of the app is required. Please update to continue.';
        });
        return;
      }

      // 3) All clear.
      context.go(AppRoutes.home);
    } catch (_) {
      await minSplash;
      if (!mounted) return;
      setState(() {
        _gate = _Gate.error;
        _message = 'Connection failed. Please try again.';
      });
    }
  }

  Future<void> _openPlayStore() async {
    final url = _playStoreUrl ?? AppConfigStore.value.playStoreUrl;
    if (url == null || url.isEmpty) return;
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  /// Semver-ish comparator. Strips `-rc1` / `+1` suffixes and compares the
  /// numeric parts segment-by-segment. Returns `true` if `a` is older than `b`.
  bool _isOlder(String a, String b) {
    final as = _numericParts(a);
    final bs = _numericParts(b);
    final len = as.length > bs.length ? as.length : bs.length;
    for (int i = 0; i < len; i++) {
      final ai = i < as.length ? as[i] : 0;
      final bi = i < bs.length ? bs[i] : 0;
      if (ai != bi) return ai < bi;
    }
    return false;
  }

  List<int> _numericParts(String v) {
    final core = v.split(RegExp(r'[-+]')).first;
    return core
        .split('.')
        .map((p) => int.tryParse(p) ?? 0)
        .toList(growable: false);
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context)!;
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppGradients.splash),
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _Logo(),
                  const SizedBox(height: AppSpacing.x2),
                  Text(
                    s.appName,
                    style: Theme.of(context)
                        .textTheme
                        .displayMedium
                        ?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: AppSpacing.x3),
                  _GateView(
                    gate: _gate,
                    message: _message,
                    onRetry: _bootstrap,
                    onUpdate: _openPlayStore,
                    s: s,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Logo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 96,
      height: 96,
      decoration: BoxDecoration(
        gradient: AppGradients.emeraldButton,
        borderRadius: BorderRadius.circular(AppRadii.hero),
        boxShadow: [
          BoxShadow(
            color: AppColors.accent.withValues(alpha: 0.5),
            blurRadius: 40,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child:
          const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 56),
    );
  }
}

class _GateView extends StatelessWidget {
  const _GateView({
    required this.gate,
    required this.message,
    required this.onRetry,
    required this.onUpdate,
    required this.s,
  });
  final _Gate gate;
  final String? message;
  final VoidCallback onRetry;
  final VoidCallback onUpdate;
  final S s;

  @override
  Widget build(BuildContext context) {
    switch (gate) {
      case _Gate.loading:
        return const SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(strokeWidth: 2.5),
        );
      case _Gate.forceUpdate:
        return _StopPanel(
          icon: Icons.system_update_alt_rounded,
          title: 'Update required',
          message: message ?? '',
          primaryLabel: 'Update now',
          onPrimary: onUpdate,
          secondaryLabel: s.splashExit,
          onSecondary: () => SystemNavigator.pop(),
        );
      case _Gate.maintenance:
        return _StopPanel(
          icon: Icons.build_circle_outlined,
          title: 'Be right back',
          message: message ?? '',
          primaryLabel: s.splashRetry,
          onPrimary: onRetry,
          secondaryLabel: s.splashExit,
          onSecondary: () => SystemNavigator.pop(),
        );
      case _Gate.error:
        return _StopPanel(
          icon: Icons.wifi_off_rounded,
          title: 'Offline',
          message: message ?? '',
          primaryLabel: s.splashRetry,
          onPrimary: onRetry,
          secondaryLabel: s.splashExit,
          onSecondary: () => SystemNavigator.pop(),
        );
    }
  }
}

class _StopPanel extends StatelessWidget {
  const _StopPanel({
    required this.icon,
    required this.title,
    required this.message,
    required this.primaryLabel,
    required this.onPrimary,
    required this.secondaryLabel,
    required this.onSecondary,
  });
  final IconData icon;
  final String title;
  final String message;
  final String primaryLabel;
  final VoidCallback onPrimary;
  final String secondaryLabel;
  final VoidCallback onSecondary;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: AppColors.accent, size: 36),
        const SizedBox(height: 10),
        Text(
          title,
          style: Theme.of(context)
              .textTheme
              .titleLarge
              ?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 8),
        Text(
          message,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.white70,
              ),
        ),
        const SizedBox(height: AppSpacing.x2),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            FilledButton(onPressed: onPrimary, child: Text(primaryLabel)),
            const SizedBox(width: AppSpacing.x2),
            OutlinedButton(
              onPressed: onSecondary,
              child: Text(secondaryLabel),
            ),
          ],
        ),
      ],
    );
  }
}
