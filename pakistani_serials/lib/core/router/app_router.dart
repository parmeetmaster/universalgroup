import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:injectable/injectable.dart';

import '../../features/browse/browse_screen.dart';
import '../../features/content_detail/presentation/screens/detail_screen.dart';
import '../../features/home/presentation/screens/home_screen.dart';
import '../../features/player/presentation/screens/player_screen.dart';
import '../../features/player/presentation/screens/sources_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/search/presentation/screens/search_screen.dart';
import '../../features/see_all/see_all_screen.dart';
import '../../features/shared/models/content_model.dart';
import '../../features/splash/splash_screen.dart';
import '../../features/watchlist/watchlist_screen.dart';
import '../theme/colors.dart';
import 'app_shell.dart';
import 'routes.dart';

@singleton
class AppRouter {
  AppRouter();

  late final GoRouter config = GoRouter(
    initialLocation: AppRoutes.splash,
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        pageBuilder: (ctx, st) =>
            const NoTransitionPage(child: SplashScreen()),
      ),
      ShellRoute(
        builder: (ctx, state, child) => AppShell(child: child),
        routes: [
          GoRoute(
            path: AppRoutes.home,
            pageBuilder: (ctx, st) => const NoTransitionPage(child: HomeScreen()),
          ),
          GoRoute(
            path: AppRoutes.browse,
            pageBuilder: (ctx, st) => NoTransitionPage(
              child: BrowseScreen(
                initialGenre: st.uri.queryParameters['genre'],
              ),
            ),
          ),
          GoRoute(
            path: AppRoutes.search,
            pageBuilder: (ctx, st) => const NoTransitionPage(child: SearchScreen()),
          ),
          GoRoute(
            path: AppRoutes.watchlist,
            pageBuilder: (ctx, st) =>
                const NoTransitionPage(child: WatchlistScreen()),
          ),
          GoRoute(
            path: AppRoutes.profile,
            pageBuilder: (ctx, st) =>
                const NoTransitionPage(child: ProfileScreen()),
          ),
        ],
      ),
      GoRoute(
        path: AppRoutes.detail,
        pageBuilder: (ctx, st) => CustomTransitionPage(
          key: st.pageKey,
          child: DetailScreen(slug: st.pathParameters['slug']!),
          transitionsBuilder: _slideFadeTransition,
        ),
      ),
      GoRoute(
        path: AppRoutes.sources,
        pageBuilder: (ctx, st) {
          final episode = st.extra as EpisodeModel;
          return CustomTransitionPage(
            key: st.pageKey,
            child: SourcesScreen(episode: episode),
            transitionsBuilder: _slideFadeTransition,
          );
        },
      ),
      GoRoute(
        path: AppRoutes.player,
        pageBuilder: (ctx, st) {
          final req = st.extra as PlaybackRequest;
          return CustomTransitionPage(
            key: st.pageKey,
            child: PlayerScreen(request: req),
            transitionsBuilder: _fadeTransition,
          );
        },
      ),
      GoRoute(
        path: AppRoutes.seeAll,
        pageBuilder: (ctx, st) {
          final railId = st.pathParameters['railId']!;
          final title = st.uri.queryParameters['title'] ?? '';
          return CustomTransitionPage(
            key: st.pageKey,
            child: SeeAllScreen(railId: railId, title: title),
            transitionsBuilder: _slideFadeTransition,
          );
        },
      ),
    ],
    errorBuilder: (ctx, st) => Scaffold(
      backgroundColor: AppColors.bg,
      body: Center(child: Text('Route not found: ${st.uri}')),
    ),
  );

  static Widget _fadeTransition(
      BuildContext ctx, Animation<double> anim, Animation<double> sec, Widget child) {
    return FadeTransition(
      opacity: CurvedAnimation(parent: anim, curve: Curves.easeOutCubic),
      child: child,
    );
  }

  static Widget _slideFadeTransition(
      BuildContext ctx, Animation<double> anim, Animation<double> sec, Widget child) {
    return FadeTransition(
      opacity: anim,
      child: SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0, 0.05),
          end: Offset.zero,
        ).animate(CurvedAnimation(parent: anim, curve: Curves.easeOutCubic)),
        child: child,
      ),
    );
  }
}
