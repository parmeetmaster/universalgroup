import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'core/ads/ad_service.dart';
import 'core/config/env.dart';
import 'core/connectivity/connectivity_overlay.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'di/injection.dart';
import 'features/settings/presentation/bloc/settings_bloc.dart';
import 'features/watchlist/presentation/bloc/watchlist_bloc.dart';
import 'l10n/generated/app_localizations.dart';

class PakistaniSerialsApp extends StatelessWidget {
  const PakistaniSerialsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<SettingsBloc>(create: (_) => getIt<SettingsBloc>()),
        BlocProvider<WatchlistBloc>(create: (_) => getIt<WatchlistBloc>()),
      ],
      child: BlocBuilder<SettingsBloc, SettingsState>(
        buildWhen: (p, n) => p.locale != n.locale,
        builder: (context, state) {
          return MaterialApp.router(
            title: Env.appName,
            debugShowCheckedModeBanner: false,
            theme: AppTheme.dark(state.locale),
            themeMode: ThemeMode.dark,
            locale: state.locale,
            supportedLocales: const [
              Locale('en'),
              Locale('ur'),
              Locale('pa'),
              Locale('hi'),
            ],
            localizationsDelegates: const [
              S.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            routerConfig: getIt<AppRouter>().config,
            builder: (context, child) {
              return _AppLifecycleHandler(
                child: ConnectivityOverlay(
                    child: child ?? const SizedBox.shrink()),
              );
            },
          );
        },
      ),
    );
  }
}

/// Listens for app lifecycle changes and shows app-open ad on resume.
class _AppLifecycleHandler extends StatefulWidget {
  const _AppLifecycleHandler({required this.child});
  final Widget child;

  @override
  State<_AppLifecycleHandler> createState() => _AppLifecycleHandlerState();
}

class _AppLifecycleHandlerState extends State<_AppLifecycleHandler>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      getIt<AdService>().showAppOpenAd();
    }
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
