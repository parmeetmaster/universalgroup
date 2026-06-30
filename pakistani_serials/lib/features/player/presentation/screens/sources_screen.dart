import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/ads/ad_service.dart';
import '../../../../core/router/routes.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/spacing.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../di/injection.dart';
import '../../../shared/models/content_model.dart';
import 'sources_cubit.dart';

class SourcesScreen extends StatelessWidget {
  const SourcesScreen({super.key, required this.episode});
  final EpisodeModel episode;

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => getIt<SourcesCubit>()..resolve(episode.id),
      child: _SourcesView(episode: episode),
    );
  }
}

class _SourcesView extends StatelessWidget {
  const _SourcesView({required this.episode});
  final EpisodeModel episode;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        title: Text(
          episode.title ?? 'Episode ${episode.episodeNumber}',
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
          ? SafeArea(
              child: ColoredBox(
                color: AppColors.bg,
                child: AdService.streamOptionBanner,
              ),
            )
          : null,
      body: BlocBuilder<SourcesCubit, SourcesState>(
        builder: (ctx, state) {
          return switch (state.status) {
            SourcesStatus.initial || SourcesStatus.loading =>
              const _LoadingState(),
            SourcesStatus.error => ErrorView(
                message: 'Failed to fetch servers:\n${state.errorMessage ?? "Unknown error"}',
                onRetry: () => ctx.read<SourcesCubit>().resolve(episode.id),
              ),
            SourcesStatus.loaded => state.servers.isEmpty
                ? const _EmptyState()
                : ListView.separated(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    itemCount: state.servers.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) => _SourceTile(
                      server: state.servers[i],
                      onTap: () => context.push(
                        AppRoutes.player,
                        extra: PlaybackRequest(
                          episode: episode,
                          url: state.servers[i].url,
                          label: state.servers[i].label,
                        ),
                      ),
                    ),
                  ),
          };
        },
      ),
    );
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
