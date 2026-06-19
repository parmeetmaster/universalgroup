import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/config/app_config_store.dart';
import '../../core/router/routes.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/gradients.dart';
import '../../core/theme/spacing.dart';
import '../../di/injection.dart';
import '../../l10n/generated/app_localizations.dart';
import 'splash_cubit.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => getIt<SplashCubit>()..bootstrap(),
      child: const _SplashView(),
    );
  }
}

class _SplashView extends StatelessWidget {
  const _SplashView();

  Future<void> _openPlayStore(String? storeUrl) async {
    final url = storeUrl ?? AppConfigStore.value.playStoreUrl;
    if (url == null || url.isEmpty) return;
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
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
                  BlocConsumer<SplashCubit, SplashState>(
                    listenWhen: (prev, curr) => curr.gate == SplashGate.ready,
                    listener: (ctx, state) => ctx.go(AppRoutes.home),
                    builder: (ctx, state) => _GateView(
                      gate: state.gate,
                      message: state.message,
                      onRetry: () => ctx.read<SplashCubit>().bootstrap(),
                      onUpdate: () => _openPlayStore(state.playStoreUrl),
                      s: s,
                    ),
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
  final SplashGate gate;
  final String? message;
  final VoidCallback onRetry;
  final VoidCallback onUpdate;
  final S s;

  @override
  Widget build(BuildContext context) {
    switch (gate) {
      case SplashGate.loading:
        return const SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(strokeWidth: 2.5),
        );
      case SplashGate.ready:
        return const SizedBox.shrink();
      case SplashGate.forceUpdate:
        return _StopPanel(
          icon: Icons.system_update_alt_rounded,
          title: 'Update required',
          message: message ?? '',
          primaryLabel: 'Update now',
          onPrimary: onUpdate,
          secondaryLabel: s.splashExit,
          onSecondary: SystemNavigator.pop,
        );
      case SplashGate.maintenance:
        return _StopPanel(
          icon: Icons.build_circle_outlined,
          title: 'Be right back',
          message: message ?? '',
          primaryLabel: s.splashRetry,
          onPrimary: onRetry,
          secondaryLabel: s.splashExit,
          onSecondary: SystemNavigator.pop,
        );
      case SplashGate.error:
        return _StopPanel(
          icon: Icons.wifi_off_rounded,
          title: 'Offline',
          message: message ?? '',
          primaryLabel: s.splashRetry,
          onPrimary: onRetry,
          secondaryLabel: s.splashExit,
          onSecondary: SystemNavigator.pop,
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
