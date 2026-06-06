import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import 'package:url_launcher/url_launcher.dart';

import '../../../../core/ads/ad_service.dart';
import '../../../../core/router/routes.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/spacing.dart';
import '../../../../core/util/image_utils.dart' show resolveImageUrl, formatCount;
import '../../../../core/util/watch_history.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../di/injection.dart';
import '../../../../l10n/generated/app_localizations.dart';
import '../../../shared/data/api_service.dart';
import '../../../shared/models/content_model.dart';
import '../bloc/detail_bloc.dart';

class DetailScreen extends StatelessWidget {
  const DetailScreen({super.key, required this.slug});
  final String slug;

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => getIt<DetailBloc>()..add(DetailLoad(slug)),
      child: const _DetailView(),
    );
  }
}

class _DetailView extends StatelessWidget {
  const _DetailView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: BlocBuilder<DetailBloc, DetailState>(
        builder: (ctx, state) {
          if (state.status == DetailStatus.loading ||
              state.status == DetailStatus.initial) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.accent),
            );
          }
          if (state.status == DetailStatus.error || state.content == null) {
            return ErrorView(
              message: state.errorMessage ?? 'Failed to load',
              onRetry: () => ctx.read<DetailBloc>().add(
                  DetailLoad(state.content?.slug ?? '')),
            );
          }
          return _Loaded(state: state);
        },
      ),
    );
  }
}

class _Loaded extends StatefulWidget {
  const _Loaded({required this.state});
  final DetailState state;

  @override
  State<_Loaded> createState() => _LoadedState();
}

class _LoadedState extends State<_Loaded> {
  final ScrollController _scrollCtrl = ScrollController();
  final GlobalKey _relatedKey = GlobalKey();
  final GlobalKey _episodesKey = GlobalKey();
  int _activeTab = 0;

  @override
  void initState() {
    super.initState();
    _scrollCtrl.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollCtrl.removeListener(_onScroll);
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!mounted) return;
    final ctx = _relatedKey.currentContext;
    if (ctx == null) return;
    final ro = ctx.findRenderObject();
    if (ro is! RenderBox || !ro.attached) return;
    try {
      final topInViewport = ro.localToGlobal(Offset.zero).dy;
      final active = topInViewport < MediaQuery.of(context).size.height * 0.5 ? 1 : 0;
      if (active != _activeTab) setState(() => _activeTab = active);
    } catch (_) {}
  }

  void _scrollTo(GlobalKey key) {
    final ctx = key.currentContext;
    if (ctx == null) return;
    Scrollable.ensureVisible(
      ctx,
      duration: const Duration(milliseconds: 380),
      curve: Curves.easeOutCubic,
      alignment: 0.05,
    );
  }

  void _showComingSoon(BuildContext context, String feature) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text('$feature coming soon'),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
      ));
  }

  void _saveAndPlay(BuildContext context, String slug, int season, EpisodeModel ep) {
    final watchHistory = getIt<WatchHistoryService>();
    watchHistory.saveLastPlayed(slug, season, ep.episodeNumber);
    watchHistory.markWatched(slug, ep.episodeNumber);
    setState(() {}); // refresh watched state
    // Navigate first, then show ad on the new screen
    context.push(AppRoutes.sources, extra: ep);
    if (adsEnabled) {
      // Small delay so sources screen renders first, then ad overlays it
      Future<void>.delayed(const Duration(milliseconds: 500), () {
        getIt<AdService>().showInterstitial();
      });
    }
  }

  Future<void> _shareDrama(BuildContext context, ContentModel content) async {
    final title = content.title;
    final url = 'https://global.animekill.com/api/pakistani-serials/content/${content.slug}';
    await Share.share(
      'Watch $title on Pakistani Serials\n$url',
      subject: title,
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = widget.state;
    final c = state.content!;
    final topPad = MediaQuery.of(context).padding.top;
    return Stack(
      children: [
        CustomScrollView(
          controller: _scrollCtrl,
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(child: _Hero(content: c)),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 2, AppSpacing.lg, 0),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  _MetaRow(content: c),
                  const SizedBox(height: 14),
                  Builder(builder: (ctx) {
                    final lp = state.lastPlayed;
                    // Find last played episode in current list, fallback to first
                    final targetEp = lp != null
                        ? state.episodes.cast<EpisodeModel?>().firstWhere(
                              (e) => e!.episodeNumber == lp.episodeNumber,
                              orElse: () => null,
                            ) ?? (state.episodes.isNotEmpty ? state.episodes.first : null)
                        : (state.episodes.isNotEmpty ? state.episodes.first : null);
                    final displaySeason = lp?.seasonNumber ?? state.currentSeason;
                    final displayEp = targetEp?.episodeNumber ?? 1;
                    return _PlayAction(
                      content: c,
                      hasEpisodes: state.episodes.isNotEmpty,
                      currentSeason: displaySeason,
                      epNumber: displayEp,
                      isResume: lp != null,
                      onPlay: () {
                        if (targetEp != null) {
                          _saveAndPlay(context, c.slug, state.currentSeason, targetEp);
                        }
                      },
                    );
                  }),
                  const SizedBox(height: 10),
                  _SecondaryActions(
                    inWatchlist: state.inWatchlist,
                    onToggleList: () => context
                        .read<DetailBloc>()
                        .add(DetailWatchlistToggled()),
                    isLiked: state.isLiked,
                    totalLikes: state.totalLikes,
                    onLike: () => context.read<DetailBloc>().add(DetailLikeToggled()),
                    onDownload: () => _showComingSoon(context, 'Download'),
                    onShare: () => _shareDrama(context, c),
                  ),
                  const SizedBox(height: 18),
                  if (c.synopsis != null && c.synopsis!.isNotEmpty)
                    _Synopsis(text: c.synopsis!),
                  if (c.genres != null && c.genres!.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    _GenreRow(genres: c.genres!),
                  ],
                  const SizedBox(height: 16),
                  const SizedBox(height: 20),
                  _TabsBar(
                    tabs: [S.of(context)!.detailEpisodes, S.of(context)!.detailRelated],
                    active: _activeTab,
                    onTap: (i) {
                      setState(() => _activeTab = i);
                      _scrollTo(i == 0 ? _episodesKey : _relatedKey);
                    },
                  ),
                  const SizedBox(height: 14),
                  KeyedSubtree(key: _episodesKey, child: const SizedBox.shrink()),
                  if (state.seasons.length > 1) ...[
                    _SeasonsPicker(
                      seasons: state.seasons,
                      current: state.currentSeason,
                      onPick: (n) => context
                          .read<DetailBloc>()
                          .add(DetailSeasonChanged(n)),
                    ),
                    const SizedBox(height: 12),
                  ],
                  if (state.episodes.isEmpty)
                    const _EpisodeEmptyState()
                  else
                    ...state.episodes.asMap().entries.map(
                          (e) => _EpisodeTile(
                            episode: e.value,
                            index: e.key,
                            fallbackImageUrl:
                                c.posterUrl ?? c.backdropUrl ?? '',
                            isWatched: getIt<WatchHistoryService>()
                                .isWatched(c.slug, e.value.episodeNumber),
                            onTap: () => _saveAndPlay(
                                context, c.slug, state.currentSeason, e.value),
                          ),
                        ),
                  const SizedBox(height: 22),
                ]),
              ),
            ),
            if (state.related.isNotEmpty)
              SliverPadding(
                key: _relatedKey,
                padding: const EdgeInsets.fromLTRB(
                    AppSpacing.lg, 4, AppSpacing.lg, 0),
                sliver: SliverGrid(
                  gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    mainAxisSpacing: 14,
                    crossAxisSpacing: 10,
                    childAspectRatio: 0.55,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (ctx, i) => _RelatedCard(content: state.related[i]),
                    childCount: state.related.length,
                  ),
                ),
              )
            else
              const SliverToBoxAdapter(child: SizedBox.shrink()),
            const SliverToBoxAdapter(child: SizedBox(height: 20)),
            const SliverToBoxAdapter(child: SizedBox(height: 60)),
          ],
        ),
        // Floating top bar (gradient fade)
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: Container(
            height: topPad + 54,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withValues(alpha: 0.55),
                  Colors.transparent,
                ],
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => context.pop(),
                    icon: const _RoundIcon(icon: Icons.arrow_back_rounded),
                  ),
                  const Spacer(),
                  const _CastButton(),
                  IconButton(
                    onPressed: () => _shareDrama(context, c),
                    icon: const _RoundIcon(icon: Icons.share_rounded),
                  ),
                  const SizedBox(width: 6),
                ],
              ),
            ),
          ),
        ),
        // Fast episode scroller (right edge) — only for 20+ episodes
        if (state.episodes.length >= 20 && _activeTab == 0)
          _EpisodeFastScroller(
            totalEpisodes: state.episodes.length,
            scrollController: _scrollCtrl,
            episodesKey: _episodesKey,
          ),
      ],
    );
  }
}

class _EpisodeFastScroller extends StatefulWidget {
  const _EpisodeFastScroller({
    required this.totalEpisodes,
    required this.scrollController,
    required this.episodesKey,
  });

  final int totalEpisodes;
  final ScrollController scrollController;
  final GlobalKey episodesKey;

  @override
  State<_EpisodeFastScroller> createState() => _EpisodeFastScrollerState();
}

class _EpisodeFastScrollerState extends State<_EpisodeFastScroller> {
  bool _dragging = false;
  double _dragFraction = 0;
  int _currentEp = 1;
  double? _episodesStartOffset;
  int _lastScrolledEp = -1;

  void _cacheEpisodesStart() {
    final ctx = widget.episodesKey.currentContext;
    if (ctx == null || !widget.scrollController.hasClients) return;
    final ro = ctx.findRenderObject();
    if (ro is! RenderBox || !ro.attached) return;
    _episodesStartOffset = widget.scrollController.offset +
        ro.localToGlobal(Offset.zero).dy;
  }

  void _onDragStart(double localY, double trackHeight) {
    _cacheEpisodesStart();
    _lastScrolledEp = -1;
    _onDrag(localY, trackHeight);
  }

  void _onDrag(double localY, double trackHeight) {
    final fraction = (localY / trackHeight).clamp(0.0, 1.0);
    final ep = (fraction * (widget.totalEpisodes - 1)).round() + 1;

    setState(() {
      _dragging = true;
      _dragFraction = fraction;
      _currentEp = ep;
    });

    // Skip if same episode — prevents jitter
    if (ep == _lastScrolledEp) return;
    _lastScrolledEp = ep;

    final startOffset = _episodesStartOffset;
    if (startOffset == null || !widget.scrollController.hasClients) return;
    const tileHeight = 88.0;
    final screenHeight = MediaQuery.of(context).size.height;
    final target = startOffset + (ep - 1) * tileHeight - (screenHeight / 3);
    widget.scrollController.animateTo(
      target.clamp(0.0, widget.scrollController.position.maxScrollExtent),
      duration: const Duration(milliseconds: 120),
      curve: Curves.easeOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.of(context).padding.top;
    return Positioned(
      right: 0,
      top: topPad + 60,
      bottom: 80,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final trackHeight = constraints.maxHeight;
          final thumbTop = _dragging
              ? (_dragFraction * (trackHeight - 40)).clamp(0.0, trackHeight - 40)
              : 0.0;

          return GestureDetector(
            behavior: HitTestBehavior.translucent,
            onVerticalDragStart: (d) =>
                _onDragStart(d.localPosition.dy, trackHeight),
            onVerticalDragUpdate: (d) =>
                _onDrag(d.localPosition.dy, trackHeight),
            onVerticalDragEnd: (_) => setState(() => _dragging = false),
            onVerticalDragCancel: () => setState(() => _dragging = false),
            child: SizedBox(
              width: 40,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  // Track line
                  Positioned(
                    right: 6,
                    top: 0,
                    bottom: 0,
                    child: Container(
                      width: 3,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  // Thumb handle
                  if (_dragging)
                    Positioned(
                      right: 2,
                      top: thumbTop,
                      child: Container(
                        width: 12,
                        height: 40,
                        decoration: BoxDecoration(
                          color: AppColors.accent,
                          borderRadius: BorderRadius.circular(6),
                        ),
                      ),
                    ),
                  // Bubble — WhatsApp style
                  if (_dragging)
                    Positioned(
                      right: 44,
                      top: thumbTop,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppColors.accent,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          'Ep $_currentEp',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
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

class _RoundIcon extends StatelessWidget {
  const _RoundIcon({required this.icon});
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.55),
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Icon(icon, color: Colors.white, size: 20),
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero({required this.content});
  final ContentModel content;

  @override
  Widget build(BuildContext context) {
    final h = MediaQuery.of(context).size.height;
    return SizedBox(
      height: h * 0.6,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (resolveImageUrl(content.backdropUrl ?? content.posterUrl) != null)
            CachedNetworkImage(
              imageUrl: resolveImageUrl(content.backdropUrl ?? content.posterUrl)!,
              fit: BoxFit.cover,
              alignment: const Alignment(0, -0.25),
              errorWidget: (_, __, ___) => _HeroPlaceholder(title: content.title),
            )
          else
            _HeroPlaceholder(title: content.title),
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                stops: const [0.3, 0.75, 1.0],
                colors: [
                  Colors.transparent,
                  Colors.black.withValues(alpha: 0.55),
                  AppColors.bg,
                ],
              ),
            ),
          ),
          Positioned(
            left: AppSpacing.lg,
            right: AppSpacing.lg,
            bottom: 4,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.accent.withValues(alpha: 0.15),
                    border: Border.all(
                      color: AppColors.accent.withValues(alpha: 0.55),
                      width: 0.8,
                    ),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'PAKISTANI SERIAL',
                    style: TextStyle(
                      color: AppColors.accent,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.3,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  content.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 34,
                    fontWeight: FontWeight.w900,
                    height: 1,
                    letterSpacing: -1,
                    shadows: [
                      Shadow(color: Colors.black87, blurRadius: 14),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MetaRow extends StatelessWidget {
  const _MetaRow({required this.content});
  final ContentModel content;

  @override
  Widget build(BuildContext context) {
    final bits = <Widget>[];
    if (content.releaseYear != null) {
      bits.add(Text(
        '${content.releaseYear}',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 13,
          fontWeight: FontWeight.w700,
        ),
      ));
    }
    bits.add(_dot());
    bits.add(Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.white54, width: 0.8),
        borderRadius: BorderRadius.circular(2),
      ),
      child: const Text(
        'HD',
        style: TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.8,
        ),
      ),
    ));
    bits.add(_dot());
    bits.add(Text(
      content.totalEpisodes > 0
          ? '${content.totalEpisodes} Episodes'
          : 'New Series',
      style: const TextStyle(
        color: Colors.white,
        fontSize: 13,
        fontWeight: FontWeight.w600,
      ),
    ));
    if (content.lastEpisodeAt != null && content.lastEpisodeAt!.isNotEmpty) {
      bits.add(_dot());
      bits.add(Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.update_rounded, color: Colors.white54, size: 14),
          const SizedBox(width: 4),
          Text(
            _formatDate(content.lastEpisodeAt!),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ));
    }
    bits.add(_dot());
    final s = content.status.toLowerCase();
    final isActivelyAiring = s == 'ongoing' && _isRecentlyAired(content.lastEpisodeAt);
    final statusLabel = isActivelyAiring
        ? 'On Air'
        : s == 'upcoming'
            ? 'Upcoming'
            : s == 'ongoing'
                ? 'On Break'
                : 'Complete';
    final statusColor = isActivelyAiring
        ? const Color(0xFF22C55E)
        : s == 'upcoming'
            ? const Color(0xFFF59E0B)
            : Colors.white54;
    bits.add(Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 6,
          height: 6,
          decoration: BoxDecoration(
            color: statusColor,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 5),
        Text(
          statusLabel,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    ));
    return Wrap(
      spacing: 8,
      runSpacing: 6,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: bits,
    );
  }

  String _formatDate(String dateStr) {
    final d = DateTime.tryParse(dateStr);
    if (d == null) return dateStr;
    final now = DateTime.now();
    final diff = now.difference(d).inDays;
    if (diff == 0) return 'Today';
    if (diff == 1) return 'Yesterday';
    if (diff < 7) return '${diff}d ago';
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return '${months[d.month - 1]} ${d.day}';
  }

  bool _isRecentlyAired(String? lastEpisodeAt) {
    if (lastEpisodeAt == null || lastEpisodeAt.isEmpty) return false;
    final d = DateTime.tryParse(lastEpisodeAt);
    if (d == null) return false;
    return DateTime.now().difference(d).inDays <= 30;
  }

  Widget _dot() => Container(
        width: 3,
        height: 3,
        decoration: const BoxDecoration(
          color: Colors.white54,
          shape: BoxShape.circle,
        ),
      );
}

class _PlayAction extends StatelessWidget {
  const _PlayAction({
    required this.content,
    required this.hasEpisodes,
    required this.currentSeason,
    required this.epNumber,
    required this.onPlay,
    this.isResume = false,
  });
  final ContentModel content;
  final bool hasEpisodes;
  final int currentSeason;
  final int epNumber;
  final VoidCallback onPlay;
  final bool isResume;

  @override
  Widget build(BuildContext context) {
    final label = hasEpisodes
        ? '${isResume ? 'Resume' : 'Play'} S$currentSeason:E$epNumber'
        : 'No Episodes Yet';
    return SizedBox(
      width: double.infinity,
      height: 46,
      child: Material(
        color: hasEpisodes ? Colors.white : const Color(0xFF2A2A35),
        borderRadius: BorderRadius.circular(4),
        child: InkWell(
          onTap: hasEpisodes ? onPlay : null,
          borderRadius: BorderRadius.circular(4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                hasEpisodes
                    ? Icons.play_arrow_rounded
                    : Icons.hourglass_empty_rounded,
                color: hasEpisodes ? Colors.black : Colors.white70,
                size: 26,
              ),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  color: hasEpisodes ? Colors.black : Colors.white70,
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SecondaryActions extends StatelessWidget {
  const _SecondaryActions({
    required this.inWatchlist,
    required this.onToggleList,
    required this.isLiked,
    required this.totalLikes,
    required this.onLike,
    required this.onDownload,
    required this.onShare,
  });
  final bool inWatchlist;
  final VoidCallback onToggleList;
  final bool isLiked;
  final int totalLikes;
  final VoidCallback onLike;
  final VoidCallback onDownload;
  final VoidCallback onShare;

  @override
  Widget build(BuildContext context) {
    final likeLabel = totalLikes > 0 ? formatCount(totalLikes) : 'Like';
    return Row(
      children: [
        Expanded(
          child: _Btn(
            icon: inWatchlist ? Icons.check_rounded : Icons.add_rounded,
            label: inWatchlist ? 'Added' : 'My List',
            onTap: onToggleList,
          ),
        ),
        Expanded(
          child: _Btn(
            icon: isLiked ? Icons.thumb_up_rounded : Icons.thumb_up_outlined,
            label: likeLabel,
            onTap: onLike,
          ),
        ),
        Expanded(child: _Btn(icon: Icons.file_download_outlined, label: 'Download', onTap: onDownload)),
        Expanded(child: _Btn(icon: Icons.share_outlined, label: 'Share', onTap: onShare)),
      ],
    );
  }
}

class _Btn extends StatelessWidget {
  const _Btn({required this.icon, required this.label, this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Column(
          children: [
            Icon(icon, color: Colors.white, size: 22),
            const SizedBox(height: 5),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Synopsis extends StatefulWidget {
  const _Synopsis({required this.text});
  final String text;

  @override
  State<_Synopsis> createState() => _SynopsisState();
}

class _SynopsisState extends State<_Synopsis> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => setState(() => _expanded = !_expanded),
      behavior: HitTestBehavior.opaque,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AnimatedSize(
            duration: const Duration(milliseconds: 180),
            alignment: Alignment.topCenter,
            child: Text(
              widget.text,
              maxLines: _expanded ? 12 : 3,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 13.5,
                height: 1.45,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            _expanded ? 'Show less' : 'Read more',
            style: const TextStyle(
              color: AppColors.accent,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _GenreRow extends StatelessWidget {
  const _GenreRow({required this.genres});
  final List<GenreModel> genres;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: genres.map((g) {
        return GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => context.go('${AppRoutes.browse}?genre=${g.slug}'),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.surfaceElevated,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.06),
                width: 0.6,
              ),
            ),
            child: Text(
              g.name,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.1,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _TabsBar extends StatelessWidget {
  const _TabsBar({required this.tabs, required this.active, this.onTap});
  final List<String> tabs;
  final int active;
  final ValueChanged<int>? onTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(tabs.length, (i) {
        final isActive = i == active;
        return Padding(
          padding: const EdgeInsets.only(right: 22),
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: onTap == null ? null : () => onTap!(i),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tabs[i],
                  style: TextStyle(
                    color: isActive ? Colors.white : Colors.white54,
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  width: 26,
                  height: 3,
                  color: isActive ? AppColors.accent : Colors.transparent,
                ),
              ],
            ),
          ),
        );
      }),
    );
  }
}

class _SeasonsPicker extends StatelessWidget {
  const _SeasonsPicker({
    required this.seasons,
    required this.current,
    required this.onPick,
  });
  final List<SeasonModel> seasons;
  final int current;
  final ValueChanged<int> onPick;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        showModalBottomSheet<void>(
          context: context,
          backgroundColor: AppColors.surface,
          builder: (ctx) {
            return SafeArea(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: seasons.map((s) {
                  return ListTile(
                    title: Text(
                      s.title ?? 'Season ${s.seasonNumber}',
                      style: const TextStyle(color: Colors.white),
                    ),
                    trailing: s.seasonNumber == current
                        ? const Icon(Icons.check, color: AppColors.accent)
                        : null,
                    onTap: () {
                      Navigator.of(ctx).pop();
                      onPick(s.seasonNumber);
                    },
                  );
                }).toList(),
              ),
            );
          },
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.surfaceElevated,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
              color: Colors.white.withValues(alpha: 0.08), width: 0.6),
        ),
        child: Row(
          children: [
            Text(
              'Season $current',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(width: 6),
            const Icon(Icons.keyboard_arrow_down_rounded,
                color: Colors.white, size: 20),
          ],
        ),
      ),
    );
  }
}

class _EpisodeTile extends StatelessWidget {
  const _EpisodeTile({
    required this.episode,
    required this.index,
    required this.onTap,
    required this.fallbackImageUrl,
    this.isWatched = false,
  });
  final EpisodeModel episode;
  final int index;
  final VoidCallback onTap;
  final String fallbackImageUrl;
  final bool isWatched;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 36,
              child: FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: Text(
                  '${episode.episodeNumber}',
                  style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 6),
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: SizedBox(
                    width: 128,
                    height: 72,
                    child: _EpisodeThumb(
                      thumbnailUrl: resolveImageUrl(episode.thumbnailUrl),
                      fallbackUrl: resolveImageUrl(fallbackImageUrl),
                    ),
                  ),
                ),
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(6),
                      color: Colors.black.withValues(alpha: 0.22),
                    ),
                    alignment: Alignment.center,
                    child: Container(
                      width: 30,
                      height: 30,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.92),
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: const Icon(
                        Icons.play_arrow_rounded,
                        color: Colors.black,
                        size: 20,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    episode.title ?? 'Episode ${episode.episodeNumber}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      if (episode.durationSeconds > 0) ...[
                        Text(
                          _fmtDuration(episode.durationSeconds),
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        if (episode.airDate != null) ...[
                          const SizedBox(width: 4),
                          const Text('·', style: TextStyle(color: Colors.white54, fontSize: 12)),
                          const SizedBox(width: 4),
                        ],
                      ],
                      if (episode.airDate != null)
                        Text(
                          _fmtAirDate(episode.airDate!),
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                    ],
                  ),
                  if (isWatched) ...[
                    const SizedBox(height: 4),
                    const Row(
                      children: [
                        Icon(Icons.visibility, color: Colors.white38, size: 13),
                        SizedBox(width: 4),
                        Text(
                          'Watched',
                          style: TextStyle(
                            color: Colors.white38,
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 6),
            _DownloadButton(episodeId: episode.id),
          ],
        ),
      ),
    );
  }

  String _fmtDuration(int seconds) {
    final m = seconds ~/ 60;
    if (m < 60) return '${m}m';
    final h = m ~/ 60;
    return '${h}h ${m % 60}m';
  }

  String _fmtAirDate(String dateStr) {
    final d = DateTime.tryParse(dateStr);
    if (d == null) return dateStr;
    final now = DateTime.now();
    final diff = DateTime(now.year, now.month, now.day)
        .difference(DateTime(d.year, d.month, d.day))
        .inDays;
    if (diff == 0) return 'Today';
    if (diff == 1) return 'Yesterday';
    if (diff < 7) return '${diff}d ago';
    if (diff < 30) return '${diff ~/ 7}w ago';
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return '${months[d.month - 1]} ${d.day}';
  }
}

class _EpisodeEmptyState extends StatelessWidget {
  const _EpisodeEmptyState();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 16),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.05),
          width: 0.6,
        ),
      ),
      child: Column(
        children: [
          Icon(
            Icons.movie_creation_outlined,
            color: Colors.white.withValues(alpha: 0.6),
            size: 36,
          ),
          const SizedBox(height: 10),
          const Text(
            'Episodes dropping soon',
            style: TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'We\'re processing the video sources — check back shortly.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white54,
              fontSize: 12,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

class _EpisodeThumb extends StatefulWidget {
  const _EpisodeThumb({this.thumbnailUrl, this.fallbackUrl});
  final String? thumbnailUrl;
  final String? fallbackUrl;

  @override
  State<_EpisodeThumb> createState() => _EpisodeThumbState();
}

class _EpisodeThumbState extends State<_EpisodeThumb> {
  bool _useFallback = false;

  String? get _url {
    if (!_useFallback && widget.thumbnailUrl != null) return widget.thumbnailUrl;
    return widget.fallbackUrl;
  }

  @override
  Widget build(BuildContext context) {
    final url = _url;
    if (url == null || url.isEmpty) {
      return Container(color: AppColors.surfaceElevated);
    }
    return CachedNetworkImage(
      imageUrl: url,
      fit: BoxFit.cover,
      placeholder: (_, __) => Container(color: AppColors.surfaceElevated),
      errorWidget: (_, __, ___) {
        if (!_useFallback && widget.fallbackUrl != null && widget.fallbackUrl != widget.thumbnailUrl) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) setState(() => _useFallback = true);
          });
          return Container(color: AppColors.surfaceElevated);
        }
        return Container(color: AppColors.surfaceElevated);
      },
    );
  }
}

class _HeroPlaceholder extends StatelessWidget {
  const _HeroPlaceholder({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    final letter = title.isNotEmpty ? title[0].toUpperCase() : '?';
    return Container(
      color: AppColors.surfaceElevated,
      alignment: Alignment.center,
      child: Text(
        letter,
        style: const TextStyle(
          color: AppColors.onSurfaceMuted,
          fontSize: 120,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class _DownloadButton extends StatefulWidget {
  const _DownloadButton({required this.episodeId});
  final String episodeId;

  @override
  State<_DownloadButton> createState() => _DownloadButtonState();
}

class _DownloadButtonState extends State<_DownloadButton> {
  bool _loading = false;

  Future<void> _onTap() async {
    if (_loading) return;
    setState(() => _loading = true);
    try {
      final api = getIt<ApiService>();
      final servers = await api.resolveEpisode(widget.episodeId);
      // Find first MP4/HLS server URL
      final server = servers.isNotEmpty ? servers.first : null;
      if (server == null) {
        if (mounted) {
          ScaffoldMessenger.of(context)
            ..hideCurrentSnackBar()
            ..showSnackBar(const SnackBar(
              content: Text('No download source available'),
              duration: Duration(seconds: 2),
              behavior: SnackBarBehavior.floating,
            ));
        }
        return;
      }
      // Open in Chrome for download
      final uri = Uri.parse(server.url);
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(SnackBar(
            content: Text('Download failed: $e'),
            duration: const Duration(seconds: 2),
            behavior: SnackBarBehavior.floating,
          ));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: _onTap,
      child: _loading
          ? const SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white54,
              ),
            )
          : const Icon(
              Icons.file_download_outlined,
              color: Colors.white54,
              size: 22,
            ),
    );
  }
}

class _CastButton extends StatelessWidget {
  const _CastButton();

  static const _channel = MethodChannel('com.pakistanidrama.serial/cast');

  void _openCast(BuildContext context) {
    final messenger = ScaffoldMessenger.of(context);
    _channel.invokeMethod<void>('openCastDialog').catchError((_) {
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(const SnackBar(
          content: Text('Screen mirroring not available on this device'),
          behavior: SnackBarBehavior.floating,
        ));
    });
  }

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: () => _openCast(context),
      icon: const _RoundIcon(icon: Icons.cast_rounded),
    );
  }
}

class _RelatedCard extends StatelessWidget {
  const _RelatedCard({required this.content});
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
              child: resolveImageUrl(content.posterUrl) != null
                  ? CachedNetworkImage(
                      imageUrl: resolveImageUrl(content.posterUrl)!,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      placeholder: (_, __) =>
                          Container(color: AppColors.surfaceElevated),
                      errorWidget: (_, __, ___) =>
                          Container(color: AppColors.surfaceElevated),
                    )
                  : Container(
                      color: AppColors.surfaceElevated,
                      alignment: Alignment.center,
                      child: Text(
                        content.title.isNotEmpty
                            ? content.title[0].toUpperCase()
                            : '?',
                        style: const TextStyle(
                          color: AppColors.onSurfaceMuted,
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
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
              fontSize: 12,
              fontWeight: FontWeight.w700,
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}
