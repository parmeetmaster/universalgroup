import 'package:better_player_plus/better_player_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

import '../../../../core/theme/colors.dart';
import 'sources_screen.dart';

class PlayerScreen extends StatefulWidget {
  const PlayerScreen({super.key, required this.request});
  final PlaybackRequest request;

  @override
  State<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends State<PlayerScreen> {
  @override
  void initState() {
    super.initState();
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  }

  @override
  void dispose() {
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final url = widget.request.url;
    return Scaffold(
      backgroundColor: Colors.black,
      body: _isDirectVideo(url)
          ? _NativePlayer(request: widget.request)
          : _EmbedPlayer(url: url),
    );
  }

  static bool _isDirectVideo(String url) {
    final u = url.toLowerCase();
    return u.contains('.m3u8') || u.contains('.mp4') || u.contains('.webm');
  }
}

// ═══════════════════════════════════════════════════════════════
// NATIVE PLAYER — ExoPlayer style with custom controls overlay
// ═══════════════════════════════════════════════════════════════

class _NativePlayer extends StatefulWidget {
  const _NativePlayer({required this.request});
  final PlaybackRequest request;

  @override
  State<_NativePlayer> createState() => _NativePlayerState();
}

class _NativePlayerState extends State<_NativePlayer> {
  late final BetterPlayerController _ctrl;
  bool _showControls = true;
  bool _isPlaying = false;
  bool _isBuffering = true;
  Duration _position = Duration.zero;
  Duration _duration = Duration.zero;
  bool _disposed = false;

  @override
  void initState() {
    super.initState();
    final isHls = widget.request.url.contains('.m3u8');
    _ctrl = BetterPlayerController(
      const BetterPlayerConfiguration(
        autoPlay: true,
        fit: BoxFit.contain,
        allowedScreenSleep: false,
        controlsConfiguration: BetterPlayerControlsConfiguration(
          showControls: false,
        ),
      ),
      betterPlayerDataSource: BetterPlayerDataSource(
        BetterPlayerDataSourceType.network,
        widget.request.url,
        videoFormat: isHls
            ? BetterPlayerVideoFormat.hls
            : BetterPlayerVideoFormat.other,
      ),
    );
    _ctrl.addEventsListener(_onPlayerEvent);
    _autoHideControls();
  }

  @override
  void dispose() {
    _disposed = true;
    _ctrl.removeEventsListener(_onPlayerEvent);
    _ctrl.dispose();
    super.dispose();
  }

  void _onPlayerEvent(BetterPlayerEvent event) {
    if (_disposed) return;
    switch (event.betterPlayerEventType) {
      case BetterPlayerEventType.play:
        setState(() {
          _isPlaying = true;
          _isBuffering = false;
        });
      case BetterPlayerEventType.pause:
        setState(() => _isPlaying = false);
      case BetterPlayerEventType.bufferingStart:
        setState(() => _isBuffering = true);
      case BetterPlayerEventType.bufferingEnd:
        setState(() => _isBuffering = false);
      case BetterPlayerEventType.progress:
        final pos = event.parameters?['progress'] as Duration?;
        final dur = event.parameters?['duration'] as Duration?;
        if (pos != null) _position = pos;
        if (dur != null && dur.inSeconds > 0) _duration = dur;
        if (mounted) setState(() {});
      case BetterPlayerEventType.finished:
        setState(() => _isPlaying = false);
      default:
        break;
    }
  }

  void _togglePlayPause() {
    if (_isPlaying) {
      _ctrl.pause();
    } else {
      _ctrl.play();
    }
    _showControlsBriefly();
  }

  void _seekRelative(int seconds) {
    final target = _position + Duration(seconds: seconds);
    final clamped = target < Duration.zero
        ? Duration.zero
        : target > _duration
            ? _duration
            : target;
    _ctrl.seekTo(clamped);
    _showControlsBriefly();
  }

  void _showControlsBriefly() {
    setState(() => _showControls = true);
    _autoHideControls();
  }

  void _autoHideControls() {
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted && !_disposed && _isPlaying) {
        setState(() => _showControls = false);
      }
    });
  }

  void _onTapVideo() {
    setState(() => _showControls = !_showControls);
    if (_showControls) _autoHideControls();
  }

  String _fmtTime(Duration d) {
    final h = d.inHours;
    final m = d.inMinutes.remainder(60);
    final s = d.inSeconds.remainder(60);
    if (h > 0) return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final ep = widget.request.episode;
    final title = ep.title ?? 'Episode ${ep.episodeNumber}';

    return GestureDetector(
      onTap: _onTapVideo,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Video
          Center(child: BetterPlayer(controller: _ctrl)),

          // Buffering indicator
          if (_isBuffering)
            const Center(
              child: SizedBox(
                width: 44,
                height: 44,
                child: CircularProgressIndicator(
                  color: AppColors.accent,
                  strokeWidth: 3,
                ),
              ),
            ),

          // Controls overlay
          AnimatedOpacity(
            opacity: _showControls ? 1.0 : 0.0,
            duration: const Duration(milliseconds: 250),
            child: IgnorePointer(
              ignoring: !_showControls,
              child: Container(
                color: Colors.black.withValues(alpha: 0.45),
                child: SafeArea(
                  child: Column(
                    children: [
                      // Top bar — title + close
                      _TopBar(title: title, onClose: () => Navigator.of(context).pop()),
                      // Center controls
                      Expanded(
                        child: _CenterControls(
                          isPlaying: _isPlaying,
                          onPlayPause: _togglePlayPause,
                          onRewind: () => _seekRelative(-10),
                          onForward: () => _seekRelative(10),
                        ),
                      ),
                      // Bottom bar — progress + time
                      _BottomBar(
                        position: _position,
                        duration: _duration,
                        fmtTime: _fmtTime,
                        onSeek: (value) {
                          final target = Duration(
                            milliseconds: (value * _duration.inMilliseconds).round(),
                          );
                          _ctrl.seekTo(target);
                        },
                      ),
                    ],
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

class _TopBar extends StatelessWidget {
  const _TopBar({required this.title, required this.onClose});
  final String title;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: Row(
        children: [
          IconButton(
            onPressed: onClose,
            icon: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CenterControls extends StatelessWidget {
  const _CenterControls({
    required this.isPlaying,
    required this.onPlayPause,
    required this.onRewind,
    required this.onForward,
  });
  final bool isPlaying;
  final VoidCallback onPlayPause;
  final VoidCallback onRewind;
  final VoidCallback onForward;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Rewind 10s
        _ControlButton(
          icon: Icons.replay_10_rounded,
          size: 36,
          onTap: onRewind,
        ),
        const SizedBox(width: 40),
        // Play / Pause
        GestureDetector(
          onTap: onPlayPause,
          child: Container(
            width: 62,
            height: 62,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Icon(
              isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
              color: Colors.white,
              size: 42,
            ),
          ),
        ),
        const SizedBox(width: 40),
        // Forward 10s
        _ControlButton(
          icon: Icons.forward_10_rounded,
          size: 36,
          onTap: onForward,
        ),
      ],
    );
  }
}

class _ControlButton extends StatelessWidget {
  const _ControlButton({required this.icon, required this.size, required this.onTap});
  final IconData icon;
  final double size;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Icon(icon, color: Colors.white, size: size),
      ),
    );
  }
}

class _BottomBar extends StatelessWidget {
  const _BottomBar({
    required this.position,
    required this.duration,
    required this.fmtTime,
    required this.onSeek,
  });
  final Duration position;
  final Duration duration;
  final String Function(Duration) fmtTime;
  final ValueChanged<double> onSeek;

  @override
  Widget build(BuildContext context) {
    final progress = duration.inMilliseconds > 0
        ? (position.inMilliseconds / duration.inMilliseconds).clamp(0.0, 1.0)
        : 0.0;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SliderTheme(
            data: SliderThemeData(
              trackHeight: 3,
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
              overlayShape: const RoundSliderOverlayShape(overlayRadius: 14),
              activeTrackColor: AppColors.accent,
              inactiveTrackColor: Colors.white.withValues(alpha: 0.25),
              thumbColor: AppColors.accent,
              overlayColor: AppColors.accent.withValues(alpha: 0.2),
            ),
            child: Slider(
              value: progress,
              onChanged: onSeek,
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  fmtTime(position),
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  fmtTime(duration),
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
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

// ═══════════════════════════════════════════════════════════════
// EMBED PLAYER — WebView for YouTube, Dailymotion, other embeds
// ═══════════════════════════════════════════════════════════════

class _EmbedPlayer extends StatefulWidget {
  const _EmbedPlayer({required this.url});
  final String url;

  @override
  State<_EmbedPlayer> createState() => _EmbedPlayerState();
}

class _EmbedPlayerState extends State<_EmbedPlayer> {
  // ignore: unused_field
  InAppWebViewController? _controller;
  bool _disposed = false;
  bool _showHint = true;

  static const String _ua =
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  String get _referer {
    final host = Uri.tryParse(widget.url)?.host ?? '';
    if (host.contains('dailymotion.com')) return 'https://www.dailymotion.com/';
    if (host.contains('youtube.com') || host.contains('youtu.be')) {
      return 'https://www.youtube.com/';
    }
    return 'https://dramaxima.com/';
  }

  String? get _youtubeVideoId {
    final u = Uri.tryParse(widget.url);
    if (u == null) return null;
    final host = u.host.toLowerCase();
    if (host.contains('youtube.com')) {
      if (u.pathSegments.isNotEmpty && u.pathSegments.first == 'embed') {
        return u.pathSegments.length > 1 ? u.pathSegments[1] : null;
      }
      return u.queryParameters['v'];
    }
    if (host.contains('youtu.be')) {
      return u.pathSegments.isNotEmpty ? u.pathSegments.first : null;
    }
    return null;
  }

  String? get _dailymotionVideoId {
    final u = Uri.tryParse(widget.url);
    if (u == null) return null;
    final host = u.host.toLowerCase();
    if (!host.contains('dailymotion.com')) return null;
    final fromQuery = u.queryParameters['video'];
    if (fromQuery != null && fromQuery.isNotEmpty) return fromQuery;
    final i = u.pathSegments.indexOf('video');
    if (i >= 0 && i + 1 < u.pathSegments.length) return u.pathSegments[i + 1];
    return null;
  }

  String _buildYouTubeHtml(String videoId) => '''
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<style>
  html, body { margin:0; padding:0; height:100%; background:#000; overflow:hidden; }
  #player { position:fixed; inset:0; width:100%; height:100%; }
</style>
</head>
<body>
<div id="player"></div>
<script>
  var tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
  function onYouTubeIframeAPIReady() {
    new YT.Player('player', {
      videoId: '$videoId',
      width: '100%', height: '100%',
      playerVars: {
        autoplay: 1, controls: 1, playsinline: 1,
        rel: 0, modestbranding: 1, fs: 1, iv_load_policy: 3
      }
    });
  }
</script>
</body>
</html>
''';

  String _buildDailymotionHtml(String videoId) => '''
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<style>
  html, body { margin:0; padding:0; height:100%; background:#000; overflow:hidden; }
  iframe { position:fixed; inset:0; width:100%; height:100%; border:0; }
</style>
</head>
<body>
<iframe
  src="https://geo.dailymotion.com/player.html?video=$videoId&autoplay=1&queue-enable=false"
  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
  allowfullscreen
  frameborder="0"></iframe>
</body>
</html>
''';

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 8), () {
      if (mounted && !_disposed) setState(() => _showHint = false);
    });
  }

  Future<void> _close() async {
    if (!mounted) return;
    Navigator.of(context).pop();
  }

  @override
  void dispose() {
    _disposed = true;
    _controller = null;
    super.dispose();
  }

  InAppWebViewSettings get _webviewSettings => InAppWebViewSettings(
        useShouldOverrideUrlLoading: true,
        allowsInlineMediaPlayback: true,
        mediaPlaybackRequiresUserGesture: false,
        enableViewportScale: true,
        userAgent: _ua,
      );

  Widget _buildWebView() {
    final yt = _youtubeVideoId;
    if (yt != null) {
      return InAppWebView(
        initialSettings: _webviewSettings,
        initialData: InAppWebViewInitialData(
          data: _buildYouTubeHtml(yt),
          baseUrl: WebUri.uri(Uri.https('www.youtube-nocookie.com', '/')),
        ),
        onWebViewCreated: (c) => _controller = c,
        onRenderProcessGone: (_, __) {
          if (!_disposed) _close();
        },
      );
    }

    final dm = _dailymotionVideoId;
    if (dm != null) {
      return InAppWebView(
        initialSettings: _webviewSettings,
        initialData: InAppWebViewInitialData(
          data: _buildDailymotionHtml(dm),
          baseUrl: WebUri.uri(Uri.https('www.dailymotion.com', '/')),
        ),
        onWebViewCreated: (c) => _controller = c,
        onRenderProcessGone: (_, __) {
          if (!_disposed) _close();
        },
      );
    }

    return InAppWebView(
      initialSettings: _webviewSettings,
      initialUrlRequest: URLRequest(
        url: WebUri(widget.url),
        headers: {
          'Referer': _referer,
          'Origin': _referer,
        },
      ),
      onWebViewCreated: (c) => _controller = c,
      shouldOverrideUrlLoading: (_, action) async {
        final host = action.request.url?.host ?? '';
        if (host.isEmpty) return NavigationActionPolicy.ALLOW;
        if (_isAdHost(host)) return NavigationActionPolicy.CANCEL;
        return NavigationActionPolicy.ALLOW;
      },
      shouldInterceptRequest: (_, req) async {
        if (_isAdHost(req.url.host)) {
          return WebResourceResponse(statusCode: 204);
        }
        return null;
      },
      onRenderProcessGone: (_, __) {
        if (!_disposed) _close();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _close();
      },
      child: Stack(
        children: [
          _buildWebView(),
          Positioned(
            top: 12,
            left: 12,
            right: 12,
            child: Row(
              children: [
                GestureDetector(
                  onTap: _close,
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.close,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                ),
                const Spacer(),
                AnimatedOpacity(
                  opacity: _showHint ? 1.0 : 0.0,
                  duration: const Duration(milliseconds: 400),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'TAP \u25B6 2-3 TIMES IF VIDEO DOES NOT PLAY',
                      style: TextStyle(
                        color: Colors.red,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static bool _isAdHost(String host) {
    const patterns = [
      'doubleclick.net',
      'googlesyndication.com',
      'googletagmanager.com',
      'googletagservices.com',
      'adservice.google',
      'adsterra',
      'popads',
      'propellerads',
      'onclickstar',
      'exosrv',
      'exoclick',
      'hilltopads',
      'trafficjunky',
      'clickadu',
      'mgid',
      'taboola',
      'outbrain',
      'histats',
      'mc.yandex',
      'yandex.metric',
      'zedo',
      'pubmatic',
      'rubiconproject',
      'chartbeat',
    ];
    final h = host.toLowerCase();
    return patterns.any(h.contains);
  }
}
