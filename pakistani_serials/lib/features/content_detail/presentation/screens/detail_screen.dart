import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import '../../../../core/router/routes.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/spacing.dart';
import '../../../../core/util/image_utils.dart' show resolveImageUrl, formatCount;
import '../../../../core/widgets/error_view.dart';
import '../../../../di/injection.dart';
import '../../../../l10n/generated/app_localizations.dart';
import '../../../home/presentation/widgets/content_rail.dart';
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
    final ctx = _relatedKey.currentContext;
    if (ctx == null) return;
    final ro = ctx.findRenderObject();
    if (ro is! RenderBox) return;
    final topInViewport = ro.localToGlobal(Offset.zero).dy;
    final active = topInViewport < MediaQuery.of(context).size.height * 0.5 ? 1 : 0;
    if (active != _activeTab) setState(() => _activeTab = active);
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
                  _PlayAction(
                    content: c,
                    hasEpisodes: state.episodes.isNotEmpty,
                    currentSeason: state.currentSeason,
                    firstEpNumber: state.episodes.isNotEmpty
                        ? state.episodes.first.episodeNumber
                        : null,
                    onPlay: () {
                      if (state.episodes.isNotEmpty) {
                        context.push(
                          AppRoutes.sources,
                          extra: state.episodes.first,
                        );
                      }
                    },
                  ),
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
                            onTap: () => context.push(
                                AppRoutes.sources, extra: e.value),
                          ),
                        ),
                  const SizedBox(height: 22),
                ]),
              ),
            ),
            if (state.related.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  key: _relatedKey,
                  padding: const EdgeInsets.only(top: 4, bottom: 60),
                  child: ContentRail(
                    title: S.of(context)!.detailRelated,
                    items: state.related,
                  ),
                ),
              )
            else
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
                  IconButton(
                    onPressed: () => _showComingSoon(context, 'Cast'),
                    icon: const _RoundIcon(icon: Icons.cast_rounded),
                  ),
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
      ],
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
              errorWidget: (_, __, ___) => Container(color: AppColors.surface),
            )
          else
            Container(color: AppColors.surface),
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
    bits.add(Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 6,
          height: 6,
          decoration: BoxDecoration(
            color: s == 'ongoing'
                ? const Color(0xFF22C55E)
                : (s == 'upcoming'
                    ? const Color(0xFFF59E0B)
                    : Colors.white54),
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 5),
        Text(
          s == 'ongoing'
              ? 'On Air'
              : s == 'upcoming'
                  ? 'Upcoming'
                  : 'Complete',
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
    required this.firstEpNumber,
    required this.onPlay,
  });
  final ContentModel content;
  final bool hasEpisodes;
  final int currentSeason;
  final int? firstEpNumber;
  final VoidCallback onPlay;

  @override
  Widget build(BuildContext context) {
    final label = hasEpisodes
        ? 'Play S$currentSeason:E${firstEpNumber ?? 1}'
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
  });
  final EpisodeModel episode;
  final int index;
  final VoidCallback onTap;
  final String fallbackImageUrl;

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
              width: 34,
              child: Text(
                '${episode.episodeNumber}',
                style: const TextStyle(
                  color: Colors.white54,
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
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
                    child: CachedNetworkImage(
                      imageUrl: resolveImageUrl(episode.thumbnailUrl) ??
                          resolveImageUrl(fallbackImageUrl) ??
                          '',
                      fit: BoxFit.cover,
                      placeholder: (_, __) =>
                          Container(color: AppColors.surfaceElevated),
                      errorWidget: (_, __, ___) =>
                          Container(color: AppColors.surfaceElevated),
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
                  if (episode.durationSeconds > 0) ...[
                    const SizedBox(height: 4),
                    Text(
                      _fmtDuration(episode.durationSeconds),
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 6),
            GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () {
                ScaffoldMessenger.of(context)
                  ..hideCurrentSnackBar()
                  ..showSnackBar(const SnackBar(
                    content: Text('Download coming soon'),
                    duration: Duration(seconds: 2),
                    behavior: SnackBarBehavior.floating,
                  ));
              },
              child: const Icon(
                Icons.file_download_outlined,
                color: Colors.white54,
                size: 22,
              ),
            ),
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
