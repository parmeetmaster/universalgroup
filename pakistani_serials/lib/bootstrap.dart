import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:path_provider/path_provider.dart';

import 'core/adblock/ad_blocker.dart';
import 'core/ads/ad_service.dart';
import 'core/connectivity/connectivity_service.dart';
import 'di/injection.dart';


Future<void> bootstrap(Widget Function() builder) async {
  runZonedGuarded(
    () async {
      WidgetsFlutterBinding.ensureInitialized();

      await Firebase.initializeApp();

      await FirebaseCrashlytics.instance.setCrashlyticsCollectionEnabled(true);

      FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;
      PlatformDispatcher.instance.onError = (error, stack) {
        FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
        return true;
      };

      await SystemChrome.setPreferredOrientations([
        DeviceOrientation.portraitUp,
        DeviceOrientation.portraitDown,
      ]);

      SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        systemNavigationBarColor: Color(0xFF0B0B10),
        systemNavigationBarIconBrightness: Brightness.light,
      ));

      HydratedBloc.storage = await HydratedStorage.build(
        storageDirectory: HydratedStorageDirectory(
          (await getApplicationDocumentsDirectory()).path,
        ),
      );

      await configureDependencies();
      await getIt<ConnectivityService>().init();

      getIt<AdService>().init();

      AdBlocker.instance.init();

      Bloc.observer = _AppBlocObserver();

      runApp(builder());
    },
    (error, stack) {
      debugPrint('Uncaught: $error\n$stack');
      FirebaseCrashlytics.instance.recordError(error, stack);
    },
  );
}

class _AppBlocObserver extends BlocObserver {
  @override
  void onChange(BlocBase<dynamic> bloc, Change<dynamic> change) {
    super.onChange(bloc, change);
    assert(() {
      debugPrint('[${bloc.runtimeType}] ${change.nextState.runtimeType}');
      return true;
    }());
  }

  @override
  void onError(BlocBase<dynamic> bloc, Object error, StackTrace stackTrace) {
    debugPrint('[${bloc.runtimeType}] error: $error');
    super.onError(bloc, error, stackTrace);
  }
}
