import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../core/ads/ad_service.dart';
import '../../core/router/routes.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/spacing.dart';
import '../../core/util/image_utils.dart';
import '../../core/widgets/error_view.dart';
import '../../di/injection.dart';
import '../shared/models/content_model.dart';
import 'see_all_cubit.dart';

class SeeAllScreen extends StatelessWidget {
  const SeeAllScreen({super.key, required this.railId, required this.title});
  final String railId;
  final String title;

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => getIt<SeeAllCubit>()..init(railId),
      child: _SeeAllView(title: title),
    );
  }
}

class _SeeAllView extends StatefulWidget {
  const _SeeAllView({required this.title});
  final String title;

  @override
  State<_SeeAllView> createState() => _SeeAllViewState();
}

class _SeeAllViewState extends State<_SeeAllView> {
  static const _genres = [
    _GenreChip('All', null),
    _GenreChip('Romance', 'romance'),
    _GenreChip('Family', 'family'),
    _GenreChip('Thriller', 'thriller'),
    _GenreChip('Comedy', 'comedy'),
    _GenreChip('Drama', 'drama'),
  ];

  final _scrollController = ScrollController();
  final _chipScrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _chipScrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      context.read<SeeAllCubit>().loadMore();
    }
  }

  void _scrollChipsForward() {
    final pos = _chipScrollController.position;
    final target = (pos.pixels + 150).clamp(0.0, pos.maxScrollExtent);
    _chipScrollController.animateTo(
      target,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildAppBar(),
            _buildGenreChips(),
            Expanded(child: _buildBody()),
            const SafeArea(
              top: false,
              child: ColoredBox(
                color: AppColors.bg,
                child: AdService.browseBanner,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.xs, AppSpacing.sm, AppSpacing.lg, AppSpacing.xs),
      child: Row(
        children: [
          IconButton(
            onPressed: () => context.pop(),
            icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          ),
          const SizedBox(width: AppSpacing.xs),
          Expanded(
            child: Text(
              widget.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.3,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGenreChips() {
    return SizedBox(
      height: 52,
      child: Stack(
        children: [
          BlocBuilder<SeeAllCubit, SeeAllState>(
            buildWhen: (p, c) => p.activeGenre != c.activeGenre,
            builder: (ctx, s) => ListView.separated(
              controller: _chipScrollController,
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(
                  AppSpacing.lg, AppSpacing.sm, 50, AppSpacing.sm),
              itemCount: _genres.length,
              separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
              itemBuilder: (ctx, i) {
                final chip = _genres[i];
                final active = chip.slug == s.activeGenre;
                return GestureDetector(
                  onTap: () =>
                      context.read<SeeAllCubit>().selectGenre(chip.slug),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: active ? Colors.white : AppColors.surfaceElevated,
                      borderRadius: BorderRadius.circular(AppRadii.pill),
                      border: Border.all(
                        color: active
                            ? Colors.white
                            : Colors.white.withValues(alpha: 0.12),
                        width: 0.8,
                      ),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      chip.label,
                      style: TextStyle(
                        color: active ? Colors.black : Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.1,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          Positioned(
            right: 0,
            top: 0,
            bottom: 0,
            child: GestureDetector(
              onTap: _scrollChipsForward,
              child: Container(
                width: 40,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.bg.withValues(alpha: 0),
                      AppColors.bg.withValues(alpha: 0.9),
                    ],
                  ),
                ),
                alignment: Alignment.center,
                child: Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Icon(
                    Icons.chevron_right_rounded,
                    color: Colors.white.withValues(alpha: 0.8),
                    size: 20,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    return BlocBuilder<SeeAllCubit, SeeAllState>(
      builder: (ctx, s) {
        if (s.status == SeeAllStatus.loading ||
            s.status == SeeAllStatus.initial) {
          return const Center(
            child: CircularProgressIndicator(color: AppColors.accent),
          );
        }

        if (s.status == SeeAllStatus.error && s.items.isEmpty) {
          return ErrorView(
            message: s.error ?? 'Unknown error',
            onRetry: () => ctx.read<SeeAllCubit>().retry(),
          );
        }

        if (s.items.isEmpty) {
          return const Center(
            child: Text(
              'No dramas found.',
              style: TextStyle(color: AppColors.onSurfaceMuted),
            ),
          );
        }

        return GridView.builder(
          controller: _scrollController,
          padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg, 10, AppSpacing.lg, AppSpacing.lg),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 10,
            mainAxisSpacing: 18,
            childAspectRatio: 0.58,
          ),
          itemCount: s.items.length + (s.hasMore ? 1 : 0),
          itemBuilder: (ctx, i) {
            if (i >= s.items.length) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(AppSpacing.lg),
                  child: CircularProgressIndicator(
                    color: AppColors.accent,
                    strokeWidth: 2,
                  ),
                ),
              );
            }
            return _SeeAllCard(content: s.items[i]);
          },
        );
      },
    );
  }
}

class _GenreChip {
  const _GenreChip(this.label, this.slug);
  final String label;
  final String? slug;
}

class _SeeAllCard extends StatelessWidget {
  const _SeeAllCard({required this.content});
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
              child: CachedNetworkImage(
                imageUrl: resolveImageUrl(content.posterUrl) ?? '',
                fit: BoxFit.cover,
                width: double.infinity,
                placeholder: (_, __) =>
                    Container(color: AppColors.surfaceElevated),
                errorWidget: (_, __, ___) =>
                    Container(color: AppColors.surfaceElevated),
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
