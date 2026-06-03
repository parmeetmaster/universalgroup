import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/routes.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/spacing.dart';
import '../../../../core/util/image_utils.dart';
import '../../../../l10n/generated/app_localizations.dart';
import '../../../shared/models/content_model.dart';

/// Netflix-style rail. Two variants:
/// - default: horizontal list of poster cards
/// - top10: giant outlined rank number + poster side-by-side
class ContentRail extends StatelessWidget {
  const ContentRail({
    super.key,
    required this.title,
    required this.items,
    this.isTop10 = false,
    this.variant = RailVariant.poster,
    this.showNewBadge = false,
  });
  final String title;
  final List<ContentModel> items;
  final bool isTop10;
  final RailVariant variant;
  final bool showNewBadge;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();

    final double rowHeight;
    if (isTop10) {
      rowHeight = 228;
    } else if (variant == RailVariant.landscape) {
      rowHeight = 184;
    } else {
      rowHeight = 240;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 4, AppSpacing.lg, 12),
          child: Row(
            children: [
              Expanded(
                child: Row(
                  children: [
                    Flexible(
                      child: Text(
                        title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.3,
                          height: 1.1,
                        ),
                      ),
                    ),
                    if (showNewBadge) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.accent,
                          borderRadius: BorderRadius.circular(3),
                        ),
                        child: Text(
                          S.of(context)!.badgeNew,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.2,
                            height: 1.2,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => context.go(AppRoutes.browse),
                child: Row(
                  children: [
                    Text(
                      S.of(context)!.homeSeeAll,
                      style: const TextStyle(
                        color: AppColors.onSurfaceMuted,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 2),
                    const Icon(Icons.chevron_right_rounded, color: AppColors.onSurfaceMuted, size: 18),
                  ],
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: rowHeight,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: EdgeInsets.symmetric(
              horizontal: isTop10 ? 10 : AppSpacing.lg,
            ),
            itemCount: isTop10 ? items.length.clamp(0, 10) : items.length,
            separatorBuilder: (_, __) => SizedBox(width: isTop10 ? 4 : 12),
            itemBuilder: (ctx, i) {
              if (isTop10) return _Top10Row(content: items[i], rank: i + 1);
              if (variant == RailVariant.landscape) {
                return _LandscapeCard(content: items[i]);
              }
              return _PosterCard(content: items[i]);
            },
          ),
        ),
      ],
    );
  }
}

enum RailVariant { poster, landscape }

class _PosterCard extends StatelessWidget {
  const _PosterCard({required this.content});
  final ContentModel content;

  @override
  Widget build(BuildContext context) {
    const w = 126.0, h = 189.0;
    return SizedBox(
      width: w,
      child: GestureDetector(
        onTap: () => context.push(AppRoutes.detailPath(content.slug)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: w,
              height: h,
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: _buildImage(
                      resolveImageUrl(content.posterUrl),
                      w, h, content.title,
                    ),
                  ),
                  // Subtle bottom gradient for poster overlay
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
                  const Positioned(top: 6, left: 6, child: _NBadge()),
                  if (content.status.toLowerCase() == 'ongoing')
                    const Positioned(
                      top: 6,
                      right: 6,
                      child: _StatusDot(label: 'LIVE'),
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
      ),
    );
  }
}

class _LandscapeCard extends StatelessWidget {
  const _LandscapeCard({required this.content});
  final ContentModel content;

  @override
  Widget build(BuildContext context) {
    const w = 240.0, h = 135.0;
    return SizedBox(
      width: w,
      child: GestureDetector(
        onTap: () => context.push(AppRoutes.detailPath(content.slug)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: w,
              height: h,
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: _buildImage(
                      resolveImageUrl(content.backdropUrl ?? content.posterUrl),
                      w, h, content.title,
                    ),
                  ),
                  Positioned.fill(
                    child: IgnorePointer(
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.black.withValues(alpha: 0.15),
                              Colors.black.withValues(alpha: 0.85),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  const Positioned(top: 8, left: 8, child: _NBadge()),
                  Positioned(
                    left: 10,
                    right: 10,
                    bottom: 8,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          content.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.3,
                            shadows: [
                              Shadow(color: Colors.black87, blurRadius: 6),
                            ],
                          ),
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 5, vertical: 1.5),
                              decoration: BoxDecoration(
                                color: AppColors.accent,
                                borderRadius: BorderRadius.circular(2),
                              ),
                              child: const Text(
                                'HD',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ),
                            const SizedBox(width: 6),
                            if (content.releaseYear != null)
                              Text(
                                '${content.releaseYear}',
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 6),
            Text(
              _statusLabel(content.status),
              style: TextStyle(
                color: _statusColor(content.status),
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Top 10 row: big outlined rank number on the left, poster on the right.
class _Top10Row extends StatelessWidget {
  const _Top10Row({required this.content, required this.rank});
  final ContentModel content;
  final int rank;

  @override
  Widget build(BuildContext context) {
    final width = rank == 10 ? 220.0 : 196.0;
    return GestureDetector(
      onTap: () => context.push(AppRoutes.detailPath(content.slug)),
      child: SizedBox(
        width: width,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 180,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Positioned(
                    left: -6,
                    bottom: -14,
                    child: _OutlinedRank(rank: rank),
                  ),
                  Positioned(
                    right: 6,
                    top: 2,
                    child: SizedBox(
                      width: 120,
                      height: 178,
                      child: Stack(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: _buildImage(
                              resolveImageUrl(content.posterUrl),
                              120, 178, content.title,
                            ),
                          ),
                          const Positioned(top: 6, left: 6, child: _NBadge()),
                          if (content.status.toLowerCase() == 'ongoing')
                            const Positioned(
                              top: 6,
                              right: 6,
                              child: _StatusDot(label: 'LIVE'),
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: EdgeInsets.only(
                left: rank == 10 ? 100 : 76,
                right: 6,
              ),
              child: Text(
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
            ),
          ],
        ),
      ),
    );
  }
}

class _OutlinedRank extends StatelessWidget {
  const _OutlinedRank({required this.rank});
  final int rank;

  @override
  Widget build(BuildContext context) {
    final text = '$rank';
    final strokePaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..color = Colors.white;
    const fillStyle = TextStyle(
      fontSize: 180,
      height: 1,
      fontWeight: FontWeight.w900,
      color: AppColors.bg,
      letterSpacing: -8,
    );
    return Stack(
      children: [
        Text(text, style: fillStyle),
        Text(
          text,
          style: TextStyle(
            fontSize: 180,
            height: 1,
            fontWeight: FontWeight.w900,
            letterSpacing: -8,
            foreground: strokePaint,
          ),
        ),
      ],
    );
  }
}

class _NBadge extends StatelessWidget {
  const _NBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 20,
      height: 20,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFEBC66B), Color(0xFFA8841F)],
        ),
        borderRadius: BorderRadius.circular(3),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.4),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      alignment: Alignment.center,
      child: const Text(
        'N',
        style: TextStyle(
          color: Colors.white,
          fontSize: 14,
          fontWeight: FontWeight.w900,
          height: 1,
        ),
      ),
    );
  }
}

class _StatusDot extends StatelessWidget {
  const _StatusDot({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(3),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 5,
            height: 5,
            decoration: const BoxDecoration(
              color: Color(0xFF22C55E),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 9,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.8,
            ),
          ),
        ],
      ),
    );
  }
}

String _statusLabel(String status) {
  switch (status.toLowerCase()) {
    case 'ongoing':
      return 'New Episodes';
    case 'completed':
      return 'Complete';
    case 'upcoming':
      return 'Coming Soon';
    default:
      return 'Drama';
  }
}

Color _statusColor(String status) {
  switch (status.toLowerCase()) {
    case 'ongoing':
      return const Color(0xFF22C55E);
    case 'upcoming':
      return const Color(0xFFF59E0B);
    default:
      return AppColors.onSurfaceMuted;
  }
}

Widget _buildImage(String? url, double w, double h, String title) {
  if (url == null || url.isEmpty) {
    return _ImagePlaceholder(width: w, height: h, title: title);
  }
  return CachedNetworkImage(
    imageUrl: url,
    fit: BoxFit.cover,
    width: w,
    height: h,
    placeholder: (_, __) => Container(color: AppColors.surfaceElevated),
    errorWidget: (_, __, ___) =>
        _ImagePlaceholder(width: w, height: h, title: title),
  );
}

class _ImagePlaceholder extends StatelessWidget {
  const _ImagePlaceholder({
    required this.width,
    required this.height,
    required this.title,
  });
  final double width;
  final double height;
  final String title;

  @override
  Widget build(BuildContext context) {
    final letter = title.isNotEmpty ? title[0].toUpperCase() : '?';
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.surfaceElevated,
            AppColors.surfaceElevated.withValues(alpha: 0.6),
          ],
        ),
      ),
      alignment: Alignment.center,
      child: Text(
        letter,
        style: TextStyle(
          color: AppColors.onSurfaceMuted,
          fontSize: height * 0.3,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}
