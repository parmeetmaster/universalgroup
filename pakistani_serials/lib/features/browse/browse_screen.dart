import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/routes.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/spacing.dart';
import '../../core/util/image_utils.dart';
import '../../core/widgets/error_view.dart';
import '../../di/injection.dart';
import '../shared/data/api_service.dart';
import '../shared/models/content_model.dart';

class BrowseScreen extends StatefulWidget {
  const BrowseScreen({super.key, this.initialGenre});
  final String? initialGenre;

  @override
  State<BrowseScreen> createState() => _BrowseScreenState();
}

class _BrowseScreenState extends State<BrowseScreen> {
  late Future<List<GenreModel>> _genres;
  late Future<List<ContentModel>> _dramas;
  String? _active;

  @override
  void initState() {
    super.initState();
    _active = widget.initialGenre;
    _genres = getIt<ApiService>().genres();
    _load();
  }

  void _load() {
    _dramas = getIt<ApiService>().listContent(
      genreSlug: _active,
      limit: 50,
    );
  }

  void _select(String? slug) {
    setState(() {
      _active = slug;
      _load();
    });
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
            FutureBuilder<List<GenreModel>>(
              future: _genres,
              builder: (ctx, snap) {
                final items = snap.data ?? const <GenreModel>[];
                return SizedBox(
                  height: 52,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.fromLTRB(
                        AppSpacing.lg, 8, AppSpacing.lg, 8),
                    itemCount: items.length + 1,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (ctx, i) {
                      if (i == 0) {
                        return _GenrePill(
                          label: 'All',
                          active: _active == null,
                          onTap: () => _select(null),
                        );
                      }
                      final g = items[i - 1];
                      return _GenrePill(
                        label: g.name,
                        active: _active == g.slug,
                        onTap: () => _select(g.slug),
                      );
                    },
                  ),
                );
              },
            ),
            Expanded(
              child: FutureBuilder<List<ContentModel>>(
                future: _dramas,
                builder: (ctx, snap) {
                  if (snap.connectionState != ConnectionState.done) {
                    return const Center(
                        child: CircularProgressIndicator(
                      color: AppColors.accent,
                    ));
                  }
                  if (snap.hasError) {
                    return ErrorView(
                      message: snap.error.toString(),
                      onRetry: () => setState(_load),
                    );
                  }
                  final items = snap.data ?? const [];
                  if (items.isEmpty) {
                    return const Center(
                      child: Text(
                        'No dramas in this genre yet.',
                        style: TextStyle(color: AppColors.onSurfaceMuted),
                      ),
                    );
                  }
                  return GridView.builder(
                    padding: const EdgeInsets.fromLTRB(
                        AppSpacing.lg, 10, AppSpacing.lg, 90),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 18,
                      childAspectRatio: 0.58,
                    ),
                    itemCount: items.length,
                    itemBuilder: (ctx, i) => _BrowseCard(content: items[i]),
                  );
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
  const _BrowseCard({required this.content});
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
