import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/routes.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/spacing.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/shimmer_placeholder.dart';
import '../../../../di/injection.dart';
import '../../../../l10n/generated/app_localizations.dart';
import '../../../shared/models/content_model.dart';
import '../bloc/home_bloc.dart';
import '../widgets/content_rail.dart';
import '../widgets/hero_carousel.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => getIt<HomeBloc>()..add(HomeStarted()),
      child: const _HomeView(),
    );
  }
}

class _HomeView extends StatelessWidget {
  const _HomeView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      extendBody: true,
      backgroundColor: AppColors.bg,
      body: RefreshIndicator(
        color: AppColors.accent,
        backgroundColor: Colors.black,
        onRefresh: () async {
          context.read<HomeBloc>().add(HomeRefreshed());
          await context
              .read<HomeBloc>()
              .stream
              .firstWhere((s) => s.status != HomeStatus.loading);
        },
        child: BlocBuilder<HomeBloc, HomeState>(
          builder: (ctx, state) {
            return switch (state.status) {
              HomeStatus.loading || HomeStatus.initial => const ShimmerHomeSkeleton(),
              HomeStatus.error => ErrorView(
                  message: state.errorMessage ?? 'Failed to load',
                  onRetry: () => ctx.read<HomeBloc>().add(HomeStarted()),
                ),
              HomeStatus.loaded => _LoadedContent(rails: state.rails),
            };
          },
        ),
      ),
    );
  }
}

class _LoadedContent extends StatelessWidget {
  const _LoadedContent({required this.rails});
  final List<HomeRailModel> rails;

  @override
  Widget build(BuildContext context) {
    final s = S.of(context)!;
    final genres = [
      _GenreTab(s.genreAll, 'all', Icons.auto_awesome_rounded),
      _GenreTab(s.genreRomance, 'romance', Icons.favorite_rounded),
      _GenreTab(s.genreFamily, 'family', Icons.diversity_3_rounded),
      _GenreTab(s.genreThriller, 'thriller', Icons.bolt_rounded),
      _GenreTab(s.genreComedy, 'comedy', Icons.mood_rounded),
      _GenreTab(s.genreDrama, 'drama', Icons.theater_comedy_rounded),
    ];
    final hero = rails.isNotEmpty && rails.first.railType == 'hero' ? rails.first : null;
    final recentRelease = rails.where((r) => r.railType == 'recent_release' && r.items.isNotEmpty).firstOrNull;
    final otherRails = rails.where((r) => r.railType != 'hero' && r.railType != 'recent_release' && r.items.isNotEmpty).toList();

    return CustomScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      slivers: [
        if (hero != null)
          SliverToBoxAdapter(child: HeroCarousel(items: hero.items)),
        const SliverToBoxAdapter(child: SizedBox(height: 14)),
        SliverToBoxAdapter(child: _GenresStrip(tabs: genres)),
        if (recentRelease != null) ...[
          const SliverToBoxAdapter(child: SizedBox(height: 18)),
          SliverToBoxAdapter(
            child: ContentRail(
              title: recentRelease.title,
              items: recentRelease.items,
              variant: RailVariant.landscape,
              showNewBadge: true,
            ),
          ),
        ],
        const SliverToBoxAdapter(child: SizedBox(height: 18)),
        SliverList(
          delegate: SliverChildBuilderDelegate(
            (ctx, i) {
              final rail = otherRails[i];
              final isTop10 = rail.railType == 'top10' ||
                  rail.title.toLowerCase().contains('top 10');
              final isNewRail = rail.railType == 'new' ||
                  rail.title.toLowerCase().contains('new');
              final variant = !isTop10 && i.isOdd
                  ? RailVariant.landscape
                  : RailVariant.poster;
              return AnimationConfiguration.staggeredList(
                position: i,
                duration: const Duration(milliseconds: 420),
                child: SlideAnimation(
                  verticalOffset: 36.0,
                  curve: Curves.easeOutCubic,
                  child: FadeInAnimation(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 6, bottom: 26),
                      child: ContentRail(
                        title: isTop10 ? s.homeTop10Today : rail.title,
                        items: rail.items,
                        isTop10: isTop10,
                        variant: variant,
                        showNewBadge: isNewRail,
                      ),
                    ),
                  ),
                ),
              );
            },
            childCount: otherRails.length,
          ),
        ),
        const SliverToBoxAdapter(child: _FooterBrand()),
        const SliverToBoxAdapter(child: SizedBox(height: 80)),
      ],
    );
  }
}

class _GenreTab {
  final String label;
  final String slug;
  final IconData icon;
  const _GenreTab(this.label, this.slug, this.icon);
}

class _GenresStrip extends StatelessWidget {
  const _GenresStrip({required this.tabs});
  final List<_GenreTab> tabs;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 90,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        itemCount: tabs.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (ctx, i) {
          final t = tabs[i];
          return GestureDetector(
            onTap: () => context.go(
              t.slug == 'all'
                  ? AppRoutes.browse
                  : '${AppRoutes.browse}?genre=${t.slug}',
            ),
            child: Container(
              width: 74,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppColors.surfaceElevated,
                    AppColors.surface,
                  ],
                ),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.06),
                  width: 0.6,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: AppColors.accent.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: Icon(t.icon, color: AppColors.accent, size: 20),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    t.label,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.1,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _FooterBrand extends StatelessWidget {
  const _FooterBrand();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Column(
        children: [
          Text(
            S.of(context)!.homeBrand,
            style: const TextStyle(
              color: AppColors.accent,
              fontSize: 14,
              fontWeight: FontWeight.w900,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Stream the very best of Pakistan  •  Always free',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.4),
              fontSize: 11,
              fontWeight: FontWeight.w500,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}
