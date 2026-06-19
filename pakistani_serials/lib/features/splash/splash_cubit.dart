import 'dart:convert';

import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:http/http.dart' as http;
import 'package:injectable/injectable.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../../core/ads/ad_service.dart';
import '../../core/config/app_config_store.dart';
import '../../core/config/env.dart';
import '../shared/models/app_config_model.dart';

enum SplashGate { loading, error, maintenance, forceUpdate, ready }

class SplashState extends Equatable {
  const SplashState({
    this.gate = SplashGate.loading,
    this.message,
    this.playStoreUrl,
  });

  final SplashGate gate;
  final String? message;
  final String? playStoreUrl;

  @override
  List<Object?> get props => [gate, message, playStoreUrl];
}

@injectable
class SplashCubit extends Cubit<SplashState> {
  SplashCubit(this._adService) : super(const SplashState());

  final AdService _adService;

  Future<void> bootstrap() async {
    emit(const SplashState(gate: SplashGate.loading));
    final minSplash =
        Future<void>.delayed(const Duration(milliseconds: 900));
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

      if (cfg.maintenanceMode) {
        emit(SplashState(
          gate: SplashGate.maintenance,
          message: cfg.maintenanceMessage ??
              'App is under maintenance. Please check back later.',
        ));
        return;
      }

      if (cfg.forceUpdate && _isOlder(info.version, cfg.minAppVersion)) {
        emit(SplashState(
          gate: SplashGate.forceUpdate,
          playStoreUrl: cfg.playStoreUrl,
          message:
              'A newer version of the app is required. Please update to continue.',
        ));
        return;
      }

      _adService.showAppOpenAd();
      emit(const SplashState(gate: SplashGate.ready));
    } catch (_) {
      await minSplash;
      emit(const SplashState(
        gate: SplashGate.error,
        message: 'Connection failed. Please try again.',
      ));
    }
  }

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
}
