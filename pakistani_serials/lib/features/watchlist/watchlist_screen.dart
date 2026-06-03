import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/routes.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/spacing.dart';
import '../../core/util/image_utils.dart';
import '../../l10n/generated/app_localizations.dart';
import '../shared/models/content_model.dart';
import 'presentation/bloc/watchlist_bloc.dart';

class WatchlistScreen extends StatelessWidget {
  const WatchlistScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final s = S.of(context)!;
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 16, AppSpacing.lg, 12),
              child: Text(
                s.watchlistTitle,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                ),
              ),
            ),
            Expanded(
              child: BlocBuilder<WatchlistBloc, WatchlistState>(
                builder: (ctx, state) {
                  if (state.items.isEmpty) return _Empty(s: s);
                  return GridView.builder(
                    padding: const EdgeInsets.fromLTRB(
                        AppSpacing.lg, 4, AppSpacing.lg, 90),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 18,
                      childAspectRatio: 0.52,
                    ),
                    itemCount: state.items.length,
                    itemBuilder: (ctx, i) => _WatchlistCard(content: state.items[i]),
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

class _Empty extends StatelessWidget {
  const _Empty({required this.s});
  final S s;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 88,
            height: 88,
            decoration: BoxDecoration(
              color: AppColors.surfaceElevated,
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Icon(
              Icons.bookmark_border_rounded,
              color: AppColors.onSurfaceMuted,
              size: 42,
            ),
          ),
          const SizedBox(height: 18),
          Text(
            s.watchlistEmpty,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 20),
          GestureDetector(
            onTap: () => context.go(AppRoutes.browse),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                s.watchlistBrowseDramas,
                style: const TextStyle(
                  color: Colors.black,
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _WatchlistCard extends StatelessWidget {
  const _WatchlistCard({required this.content});
  final ContentModel content;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push(AppRoutes.detailPath(content.slug)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: CachedNetworkImage(
                    imageUrl: resolveImageUrl(content.posterUrl) ?? '',
                    fit: BoxFit.cover,
                    width: double.infinity,
                    height: double.infinity,
                    placeholder: (_, __) =>
                        Container(color: AppColors.surfaceElevated),
                    errorWidget: (_, __, ___) => Container(
                      color: AppColors.surfaceElevated,
                      alignment: Alignment.center,
                      child: const Icon(Icons.broken_image_outlined,
                          color: AppColors.onSurfaceMuted, size: 28),
                    ),
                  ),
                ),
                // Bottom gradient
                Positioned.fill(
                  child: IgnorePointer(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          stops: const [0.6, 1.0],
                          colors: [
                            Colors.transparent,
                            Colors.black.withValues(alpha: 0.6),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                // N badge
                Positioned(
                  top: 6,
                  left: 6,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                    decoration: BoxDecoration(
                      color: AppColors.accent,
                      borderRadius: BorderRadius.circular(3),
                    ),
                    child: const Text(
                      'N',
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ),
                // Status dot
                if (content.status.toLowerCase() == 'ongoing')
                  Positioned(
                    top: 6,
                    right: 6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.7),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(
                          color: Colors.greenAccent.withValues(alpha: 0.6),
                          width: 0.5,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 5,
                            height: 5,
                            decoration: const BoxDecoration(
                              color: Colors.greenAccent,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Text(
                            'LIVE',
                            style: TextStyle(
                              color: Colors.greenAccent,
                              fontSize: 8,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            content.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.w700,
              height: 1.2,
              letterSpacing: -0.1,
            ),
          ),
          const SizedBox(height: 3),
          Row(
            children: [
              if (content.releaseYear != null) ...[
                Text(
                  '${content.releaseYear}',
                  style: const TextStyle(
                    color: AppColors.onSurfaceMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  width: 3,
                  height: 3,
                  decoration: const BoxDecoration(
                    color: AppColors.onSurfaceMuted,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
              ],
              Flexible(
                child: Text(
                  _statusLabel(content.status),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: _statusColor(content.status),
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.2,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

String _statusLabel(String status) {
  switch (status.toLowerCase()) {
    case 'ongoing':
      return 'On Air';
    case 'completed':
      return 'Completed';
    case 'upcoming':
      return 'Coming Soon';
    default:
      return status;
  }
}

Color _statusColor(String status) {
  switch (status.toLowerCase()) {
    case 'ongoing':
      return Colors.greenAccent;
    case 'completed':
      return AppColors.accent;
    case 'upcoming':
      return Colors.amberAccent;
    default:
      return AppColors.onSurfaceMuted;
  }
}
