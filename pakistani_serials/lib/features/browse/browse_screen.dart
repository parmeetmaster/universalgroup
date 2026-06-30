import '../../core/widgets/app_cached_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../core/ads/ad_service.dart';
import '../../core/router/routes.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/spacing.dart';
import '../../core/widgets/error_view.dart';
import '../../di/injection.dart';
import '../shared/models/content_model.dart';
import 'browse_cubit.dart';

class BrowseScreen extends StatelessWidget {
  const BrowseScreen({super.key, this.initialGenre});
  final String? initialGenre;

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => getIt<BrowseCubit>()..init(initialGenre: initialGenre),
      child: const _BrowseView(),
    );
  }
}

class _BrowseView extends StatelessWidget {
  const _BrowseView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(AppSpacing.lg, 16, AppSpacing.lg, 4),
              child: Text(
                'Browse',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                ),
              ),
            ),
            BlocBuilder<BrowseCubit, BrowseState>(
              buildWhen: (p, c) =>
                  p.genres != c.genres || p.activeGenre != c.activeGenre,
              builder: (ctx, state) {
                final items = state.genres;
                return SizedBox(
                  height: 52,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.fromLTRB(
                        AppSpacing.lg, 8, AppSpacing.lg, 8),
                    itemCount: items.length + 1,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (ctx, i) {
                      final cubit = context.read<BrowseCubit>();
                      if (i == 0) {
                        return _GenrePill(
                          label: 'All',
                          active: state.activeGenre == null,
                          onTap: () => cubit.selectGenre(null),
                        );
                      }
                      final g = items[i - 1];
                      return _GenrePill(
                        label: g.name,
                        active: state.activeGenre == g.slug,
                        onTap: () => cubit.selectGenre(g.slug),
                      );
                    },
                  ),
                );
              },
            ),
            Expanded(
              child: BlocBuilder<BrowseCubit, BrowseState>(
                buildWhen: (p, c) =>
                    p.status != c.status || p.dramas != c.dramas,
                builder: (ctx, state) {
                  if (state.status == BrowseStatus.loading) {
                    return const Center(
                      child: CircularProgressIndicator(
                        color: AppColors.accent,
                      ),
                    );
                  }
                  if (state.status == BrowseStatus.error) {
                    return ErrorView(
                      message: state.error ?? 'Unknown error',
                      onRetry: () => ctx.read<BrowseCubit>().retry(),
                    );
                  }
                  if (state.dramas.isEmpty) {
                    return const Center(
                      child: Text(
                        'No dramas in this genre yet.',
                        style: TextStyle(color: AppColors.onSurfaceMuted),
                      ),
                    );
                  }
                  return _BrowseGridWithAds(items: state.dramas);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GenrePill extends StatelessWidget {
  const _GenrePill({
    required this.label,
    required this.active,
    required this.onTap,
  });
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: active ? Colors.white : AppColors.surfaceElevated,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: active ? Colors.white : Colors.white.withValues(alpha: 0.12),
            width: 0.8,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            color: active ? Colors.black : Colors.white,
            fontSize: 13,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.1,
          ),
        ),
      ),
    );
  }
}

class _BrowseCard extends StatelessWidget {
  const _BrowseCard({super.key, required this.content});
  final ContentModel content;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push(AppRoutes.detailPath(content.slug)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: AppCachedImage(
                imageUrl: content.posterUrl,
                width: double.infinity,
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            content.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.1,
            ),
          ),
        ],
      ),
    );
  }
}

class _BrowseGridWithAds extends StatelessWidget {
  const _BrowseGridWithAds({required this.items});
  final List<ContentModel> items;

  static const _chunkSize = 9;

  List<_BrowseSection> _buildSections() {
    final sections = <_BrowseSection>[];
    for (var start = 0; start < items.length; start += _chunkSize) {
      final end = (start + _chunkSize).clamp(0, items.length);
      sections.add(_BrowseSection.grid(items.sublist(start, end), start));
      sections.add(const _BrowseSection.ad());
    }
    return sections;
  }

  @override
  Widget build(BuildContext context) {
    final sections = _buildSections();
    return ListView.builder(
      padding: const EdgeInsets.only(bottom: 90),
      itemCount: sections.length,
      itemBuilder: (ctx, index) {
        final section = sections[index];
        if (section.isAd) {
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: AdService.browseNativeAd,
          );
        }

        final chunk = section.chunk!;
        final isFirst = section.start == 0;
        return GridView.builder(
          key: ValueKey('browse-chunk-${section.start}'),
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: EdgeInsets.fromLTRB(
            AppSpacing.lg, isFirst ? 10 : 0, AppSpacing.lg, 18,
          ),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 10,
            mainAxisSpacing: 18,
            childAspectRatio: 0.58,
          ),
          itemCount: chunk.length,
          itemBuilder: (ctx, i) => _BrowseCard(
            key: ValueKey('browse-${chunk[i].slug}'),
            content: chunk[i],
          ),
        );
      },
    );
  }
}

class _BrowseSection {
  const _BrowseSection.grid(this.chunk, this.start) : isAd = false;
  const _BrowseSection.ad()
      : chunk = null,
        start = -1,
        isAd = true;

  final List<ContentModel>? chunk;
  final int start;
  final bool isAd;
}
