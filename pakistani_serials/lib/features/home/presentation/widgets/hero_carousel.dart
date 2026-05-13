import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/routes.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/gradients.dart';
import '../../../../core/theme/spacing.dart';
import '../../../../l10n/generated/app_localizations.dart';
import '../../../shared/models/content_model.dart';

/// Netflix-style hero: full-bleed tall poster, top chips bar overlaid,
/// brand red wordmark top-left, title logo area, metadata line, action row.
class HeroCarousel extends StatefulWidget {
  const HeroCarousel({super.key, required this.items});
  final List<ContentModel> items;

  @override
  State<HeroCarousel> createState() => _HeroCarouselState();
}

class _HeroCarouselState extends State<HeroCarousel> {
  final PageController _ctrl = PageController();
  Timer? _autoAdvance;
  int _page = 0;

  @override
  void initState() {
    super.initState();
    if (widget.items.length > 1) {
      _autoAdvance = Timer.periodic(const Duration(seconds: 6), (_) {
        if (!mounted || !_ctrl.hasClients) return;
        final next = (_page + 1) % widget.items.length;
        _ctrl.animateToPage(
          next,
          duration: const Duration(milliseconds: 650),
          curve: Curves.easeInOutCubic,
        );
      });
    }
  }

  @override
  void dispose() {
    _autoAdvance?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.items.isEmpty) return const SizedBox.shrink();
    final h = MediaQuery.of(context).size.height;
    return SizedBox(
      height: h * 0.72,
      child: Stack(
        children: [
          PageView.builder(
            controller: _ctrl,
            itemCount: widget.items.length,
            onPageChanged: (i) => setState(() => _page = i),
            itemBuilder: (ctx, i) => _HeroSlide(content: widget.items[i]),
          ),
          if (widget.items.length > 1)
            Positioned(
              bottom: 10,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  widget.items.length.clamp(0, 8),
                  (i) => AnimatedContainer(
                    duration: const Duration(milliseconds: 220),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width: i == _page ? 16 : 5,
                    height: 5,
                    decoration: BoxDecoration(
                      color: i == _page
                          ? Colors.white
                          : Colors.white.withValues(alpha: 0.35),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _HeroSlide extends StatelessWidget {
  const _HeroSlide({required this.content});
  final ContentModel content;

  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.of(context).padding.top;
    return GestureDetector(
      onTap: () => context.push(AppRoutes.detailPath(content.slug)),
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Backdrop — align subject upper third so big text below stays on dark area
          CachedNetworkImage(
            imageUrl: content.backdropUrl ?? content.posterUrl ?? '',
            fit: BoxFit.cover,
            alignment: const Alignment(0, -0.35),
            errorWidget: (_, __, ___) => Container(color: AppColors.surface),
          ),
          // Top shade
          Container(
            decoration: const BoxDecoration(gradient: AppGradients.heroTopShade),
          ),
          // Strong bottom fade to pure black for title legibility
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                stops: const [0.0, 0.45, 0.72, 1.0],
                colors: [
                  Colors.transparent,
                  Colors.black.withValues(alpha: 0.15),
                  Colors.black.withValues(alpha: 0.72),
                  Colors.black,
                ],
              ),
            ),
          ),
          // Top bar
          Positioned(
            top: topPad + 6,
            left: 0,
            right: 0,
            child: _TopBar(),
          ),
          // Filter chips
          Positioned(
            top: topPad + 54,
            left: 0,
            right: 0,
            child: const _FilterChips(),
          ),
          // Bottom content
          Positioned(
            left: 0,
            right: 0,
            bottom: 34,
            child: _HeroContent(content: content),
          ),
        ],
      ),
    );
  }
}

class _TopBar extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Row(
        children: [
          // Brand wordmark
          Text(
            S.of(context)!.homeBrand,
            style: const TextStyle(
              color: AppColors.accent,
              fontSize: 16,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.5,
              height: 1,
            ),
          ),
          const Spacer(),
          GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => ScaffoldMessenger.of(context)
              ..hideCurrentSnackBar()
              ..showSnackBar(const SnackBar(
                content: Text('Cast coming soon'),
                duration: Duration(seconds: 2),
                behavior: SnackBarBehavior.floating,
              )),
            child: const Icon(Icons.cast_rounded, color: Colors.white, size: 22),
          ),
          const SizedBox(width: 18),
          GestureDetector(
            onTap: () => context.go('/search'),
            child: const Icon(Icons.search_rounded, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 14),
          GestureDetector(
            onTap: () => context.go(AppRoutes.profile),
            child: Container(
              width: 26,
              height: 26,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFEBC66B), Color(0xFFA8841F)],
                ),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Icon(Icons.person, color: Colors.white, size: 18),
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChips extends StatelessWidget {
  const _FilterChips();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 34,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        children: [
          _Chip(label: 'All Dramas', onTap: () => context.go('/browse')),
          const SizedBox(width: 8),
          _Chip(label: 'Ongoing', onTap: () => context.go('/browse?status=ongoing')),
          const SizedBox(width: 8),
          _Chip(
            label: 'Genres',
            trailing: Icons.keyboard_arrow_down_rounded,
            onTap: () => context.go('/browse'),
          ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.label, this.trailing, this.onTap});
  final String label;
  final IconData? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.55),
          border: Border.all(color: Colors.white24, width: 0.8),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w500,
                height: 1.2,
              ),
            ),
            if (trailing != null) ...[
              const SizedBox(width: 2),
              Icon(trailing, color: Colors.white, size: 18),
            ],
          ],
        ),
      ),
    );
  }
}

class _HeroContent extends StatelessWidget {
  const _HeroContent({required this.content});
  final ContentModel content;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Featured ribbon
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.accent.withValues(alpha: 0.15),
            border: Border.all(
                color: AppColors.accent.withValues(alpha: 0.55), width: 0.8),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.local_fire_department_rounded,
                  color: AppColors.accent, size: 14),
              const SizedBox(width: 4),
              Text(
                S.of(context)!.homeFeatured,
                style: const TextStyle(
                  color: AppColors.accent,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        // Title — bigger, tighter
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.x2),
          child: Text(
            content.title,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 44,
              height: 1.0,
              fontWeight: FontWeight.w900,
              letterSpacing: -1.2,
              shadows: [
                Shadow(blurRadius: 16, color: Colors.black87, offset: Offset(0, 2)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 10),
        if (content.genres != null && content.genres!.isNotEmpty)
          _GenresLine(genres: content.genres!.take(4).map((g) => g.name).toList()),
        const SizedBox(height: 18),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _StackedIconAction(
              icon: Icons.add_rounded,
              label: S.of(context)!.homeMyList,
              onTap: () => context.go(AppRoutes.watchlist),
            ),
            const SizedBox(width: 14),
            _PlayButton(
              onTap: () => context.push(AppRoutes.detailPath(content.slug)),
            ),
            const SizedBox(width: 14),
            _StackedIconAction(
              icon: Icons.info_outline_rounded,
              label: 'Info',
              onTap: () => context.push(AppRoutes.detailPath(content.slug)),
            ),
          ],
        ),
      ],
    );
  }
}

class _GenresLine extends StatelessWidget {
  const _GenresLine({required this.genres});
  final List<String> genres;

  @override
  Widget build(BuildContext context) {
    final widgets = <Widget>[];
    for (int i = 0; i < genres.length; i++) {
      widgets.add(Text(
        genres[i],
        style: const TextStyle(
          color: Colors.white,
          fontSize: 13,
          fontWeight: FontWeight.w500,
        ),
      ));
      if (i != genres.length - 1) {
        widgets.add(Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Container(
            width: 3,
            height: 3,
            decoration: const BoxDecoration(
              color: AppColors.accent,
              shape: BoxShape.circle,
            ),
          ),
        ));
      }
    }
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: widgets,
    );
  }
}

class _PlayButton extends StatelessWidget {
  const _PlayButton({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 110,
        height: 40,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(4),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.play_arrow_rounded, color: Colors.black, size: 28),
            const SizedBox(width: 2),
            Text(
              S.of(context)!.homePlay,
              style: const TextStyle(
                color: Colors.black,
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StackedIconAction extends StatelessWidget {
  const _StackedIconAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 26),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w500,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }
}
