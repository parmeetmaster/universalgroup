// dart format width=80
// GENERATED CODE - DO NOT MODIFY BY HAND

// **************************************************************************
// InjectableConfigGenerator
// **************************************************************************

// ignore_for_file: type=lint
// coverage:ignore-file

// ignore_for_file: no_leading_underscores_for_library_prefixes
import 'package:flutter_secure_storage/flutter_secure_storage.dart' as _i558;
import 'package:get_it/get_it.dart' as _i174;
import 'package:injectable/injectable.dart' as _i526;
import 'package:shared_preferences/shared_preferences.dart' as _i460;

import '../core/ads/ad_service.dart' as _i922;
import '../core/connectivity/connectivity_service.dart' as _i610;
import '../core/network/auth_interceptor.dart' as _i552;
import '../core/network/dio_client.dart' as _i393;
import '../core/notifications/notification_service.dart' as _i580;
import '../core/router/app_router.dart' as _i877;
import '../core/services/rating_service.dart' as _i410;
import '../core/util/watch_history.dart' as _i585;
import '../core/widgets/rating_cubit.dart' as _i901;
import '../features/browse/browse_cubit.dart' as _i127;
import '../features/content_detail/presentation/bloc/detail_bloc.dart' as _i920;
import '../features/home/presentation/bloc/home_bloc.dart' as _i824;
import '../features/player/presentation/screens/sources_cubit.dart' as _i1057;
import '../features/search/presentation/bloc/search_bloc.dart' as _i348;
import '../features/see_all/see_all_cubit.dart' as _i960;
import '../features/settings/presentation/bloc/settings_bloc.dart' as _i419;
import '../features/shared/data/api_service.dart' as _i372;
import '../features/splash/splash_cubit.dart' as _i302;
import '../features/watchlist/presentation/bloc/watchlist_bloc.dart' as _i63;
import 'injection.dart' as _i464;

extension GetItInjectableX on _i174.GetIt {
  // initializes the registration of main-scope dependencies inside of GetIt
  Future<_i174.GetIt> init({
    String? environment,
    _i526.EnvironmentFilter? environmentFilter,
  }) async {
    final gh = _i526.GetItHelper(this, environment, environmentFilter);
    final registerModule = _$RegisterModule();
    await gh.factoryAsync<_i460.SharedPreferences>(
      () => registerModule.prefs,
      preResolve: true,
    );
    gh.singleton<_i558.FlutterSecureStorage>(
      () => registerModule.secureStorage,
    );
    gh.singleton<_i922.AdService>(() => _i922.AdService());
    gh.singleton<_i610.ConnectivityService>(
      () => _i610.ConnectivityService(),
      dispose: (i) => i.dispose(),
    );
    gh.singleton<_i877.AppRouter>(() => _i877.AppRouter());
    gh.singleton<_i63.WatchlistBloc>(() => _i63.WatchlistBloc());
    gh.singleton<_i585.WatchHistoryService>(
      () => _i585.WatchHistoryService(gh<_i460.SharedPreferences>()),
    );
    gh.singleton<_i580.NotificationService>(
      () => _i580.NotificationService(gh<_i460.SharedPreferences>()),
    );
    gh.singleton<_i410.RatingService>(
      () => _i410.RatingService(gh<_i460.SharedPreferences>()),
    );
    gh.factory<_i901.RatingCubit>(
      () => _i901.RatingCubit(gh<_i410.RatingService>()),
    );
    gh.singleton<_i419.SettingsBloc>(
      () => _i419.SettingsBloc(gh<_i580.NotificationService>()),
    );
    gh.factory<_i302.SplashCubit>(
      () => _i302.SplashCubit(
        gh<_i922.AdService>(),
        gh<_i580.NotificationService>(),
      ),
    );
    gh.singleton<_i552.AuthInterceptor>(
      () => _i552.AuthInterceptor(gh<_i558.FlutterSecureStorage>()),
    );
    gh.singleton<_i393.DioClient>(
      () => _i393.DioClient(gh<_i552.AuthInterceptor>()),
    );
    gh.singleton<_i372.ApiService>(
      () => _i372.ApiService(gh<_i393.DioClient>()),
    );
    gh.factory<_i960.SeeAllCubit>(
      () => _i960.SeeAllCubit(gh<_i372.ApiService>()),
    );
    gh.factory<_i348.SearchBloc>(
      () => _i348.SearchBloc(gh<_i372.ApiService>()),
    );
    gh.factory<_i127.BrowseCubit>(
      () => _i127.BrowseCubit(gh<_i372.ApiService>()),
    );
    gh.factory<_i920.DetailBloc>(
      () => _i920.DetailBloc(
        gh<_i372.ApiService>(),
        gh<_i63.WatchlistBloc>(),
        gh<_i585.WatchHistoryService>(),
        gh<_i922.AdService>(),
      ),
    );
    gh.factory<_i1057.SourcesCubit>(
      () => _i1057.SourcesCubit(gh<_i372.ApiService>(), gh<_i922.AdService>()),
    );
    gh.factory<_i824.HomeBloc>(
      () => _i824.HomeBloc(
        gh<_i372.ApiService>(),
        gh<_i580.NotificationService>(),
        gh<_i410.RatingService>(),
      ),
    );
    return this;
  }
}

class _$RegisterModule extends _i464.RegisterModule {}
