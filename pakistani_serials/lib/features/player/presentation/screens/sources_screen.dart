import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/ads/ad_service.dart';
import '../../../../core/router/routes.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/spacing.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../di/injection.dart';
import '../../../shared/data/api_service.dart';
import '../../../shared/models/content_model.dart';

class SourcesScreen extends StatefulWidget {
  const SourcesScreen({super.key, required this.episode});
  final EpisodeModel episode;

  @override
  State<SourcesScreen> createState() => _SourcesScreenState();
}

class _SourcesScreenState extends State<SourcesScreen> {
  final ApiService _api = getIt<ApiService>();

  Future<List<ResolvedServer>>? _future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    setState(() {
      _future = _api.resolveEpisode(widget.episode.id);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        title: Text(
          widget.episode.title ?? 'Episode ${widget.episode.episodeNumber}',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => context.pop(),
        ),
      ),
      bottomNavigationBar: adsEnabled
          ? SizedBox(
              height: 60,
              child: ColoredBox(
                color: AppColors.bg,
                child: const Center(child: AdService.playBanner),
              ),
            )
          : null,
      body: FutureBuilder<List<ResolvedServer>>(
        future: _future,
        builder: (ctx, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const _LoadingState();
          }
          if (snap.hasError) {
            return ErrorView(
              message: 'Failed to fetch servers:\n${_friendly(snap.error)}',
              onRetry: _load,
            );
          }
          final servers = snap.data ?? const <ResolvedServer>[];
          if (servers.isEmpty) return const _EmptyState();
          return ListView.separated(
            padding: const EdgeInsets.all(AppSpacing.lg),
            itemCount: servers.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) => _SourceTile(
              server: servers[i],
              onTap: () => context.push(
                AppRoutes.player,
                extra: PlaybackRequest(
                  episode: widget.episode,
                  url: servers[i].url,
                  label: servers[i].label,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  String _friendly(Object? err) {
    if (err == null) return 'Unknown error';
    return err.toString().replaceAll('Exception:', '').trim();
  }
}

class PlaybackRequest {
  const PlaybackRequest({
    required this.episode,
    required this.url,
    this.label,
  });
  final EpisodeModel episode;
  final String url;
  final String? label;
}

class _SourceTile extends StatelessWidget {
  const _SourceTile({required this.server, required this.onTap});
  final ResolvedServer server;
  final VoidCallback onTap;

  bool get _isDownloadable =>
      server.format == 'mp4' || server.format == 'hls';

  Future<void> _download(BuildContext context) async {
    try {
      await launchUrl(
        Uri.parse(server.url),
        mode: LaunchMode.externalApplication,
      );
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(SnackBar(
            content: Text('Could not open: $e'),
            behavior: SnackBarBehavior.floating,
          ));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surfaceElevated,
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        child: Row(
          children: [
            // Play area (tappable)
            Expanded(
              child: InkWell(
                onTap: onTap,
                borderRadius: BorderRadius.circular(8),
                child: Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: AppColors.accent.withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      alignment: Alignment.center,
                      child: const Icon(
                        Icons.play_arrow_rounded,
                        color: AppColors.accent,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            server.label,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _isDownloadable ? 'Tap to play · MP4' : 'Tap to play',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.55),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(
                      Icons.chevron_right_rounded,
                      color: Colors.white54,
                    ),
                  ],
                ),
              ),
            ),
            // Download button (separate tap target)
            if (_isDownloadable) ...[
              const SizedBox(width: 8),
              InkWell(
                onTap: () => _download(context),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: AppColors.accent.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: AppColors.accent.withValues(alpha: 0.3),
                    ),
                  ),
                  alignment: Alignment.center,
                  child: const Icon(
                    Icons.file_download_rounded,
                    color: AppColors.accent,
                    size: 22,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _LoadingState extends StatelessWidget {
  const _LoadingState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(
            width: 28,
            height: 28,
            child: CircularProgressIndicator(
              color: AppColors.accent,
              strokeWidth: 2.5,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Parsing servers…',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.7),
              fontSize: 13,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.cloud_off_rounded,
              size: 48,
              color: Colors.white.withValues(alpha: 0.4),
            ),
            const SizedBox(height: 12),
            const Text(
              'No servers available',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'We couldn\'t find a playable stream for this episode right now.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white54, fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }
}
