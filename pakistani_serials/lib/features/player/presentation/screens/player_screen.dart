import 'dart:async';

import 'package:better_player_plus/better_player_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

import '../../../../core/adblock/ad_blocker.dart';
import 'sources_screen.dart';

// Video Downloader ExoPlayer colors — exact match
const _kGreen = Color(0xFF4CAF50);
const _kControlBg = Color(0x66000000); // #66000000 player_circle_bg
const _kPlayBg = Color(0x99000000); // #99000000 player_play_circle_bg
const _kOverlayBg = Color(0x44000000); // #44000000 controls_bg
const _kTopBarBg = Color(0x26000000); // #26000000 black_15

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
// NATIVE PLAYER — exact replica of Video Downloader ExoPlayer
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
  bool _isInitialized = false;
  bool _hasError = false;
  bool _isMuted = false;
  bool _isLocked = false;
  double _speed = 1.0;
  Duration _position = Duration.zero;
  Duration _duration = Duration.zero;
  bool _disposed = false;
  Timer? _hideTimer;

  static const _speeds = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

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
    _ctrl.addEventsListener(_onEvent);
    _scheduleHide();
  }

  @override
  void dispose() {
    _disposed = true;
    _hideTimer?.cancel();
    _ctrl.removeEventsListener(_onEvent);
    _ctrl.dispose();
    super.dispose();
  }

  void _onEvent(BetterPlayerEvent e) {
    if (_disposed) return;
    switch (e.betterPlayerEventType) {
      case BetterPlayerEventType.initialized:
        setState(() { _isInitialized = true; _isBuffering = false; _hasError = false; });
      case BetterPlayerEventType.play:
        setState(() { _isPlaying = true; _isBuffering = false; });
      case BetterPlayerEventType.pause:
        setState(() => _isPlaying = false);
      case BetterPlayerEventType.bufferingStart:
        setState(() => _isBuffering = true);
      case BetterPlayerEventType.bufferingEnd:
        setState(() => _isBuffering = false);
      case BetterPlayerEventType.progress:
        final pos = e.parameters?['progress'] as Duration?;
        final dur = e.parameters?['duration'] as Duration?;
        if (pos != null) _position = pos;
        if (dur != null && dur.inSeconds > 0) _duration = dur;
        if (mounted) setState(() {});
      case BetterPlayerEventType.finished:
        setState(() { _isPlaying = false; _showControls = true; });
      case BetterPlayerEventType.exception:
        setState(() { _hasError = true; _isBuffering = false; });
      case BetterPlayerEventType.seekTo:
        setState(() => _isBuffering = true);
      default:
        break;
    }
  }

  void _togglePlayPause() {
    _isPlaying ? _ctrl.pause() : _ctrl.play();
    _showControlsBriefly();
  }

  void _seekRelative(int seconds) {
    if (!_isInitialized) return;
    final target = _position + Duration(seconds: seconds);
    final clamped = target < Duration.zero ? Duration.zero
        : target > _duration ? _duration : target;
    _ctrl.seekTo(clamped);
    _showControlsBriefly();
  }

  void _toggleMute() {
    if (!_isInitialized) return;
    setState(() => _isMuted = !_isMuted);
    _ctrl.setVolume(_isMuted ? 0 : 1);
    _showControlsBriefly();
  }

  void _cycleSpeed() {
    if (!_isInitialized) return;
    final idx = _speeds.indexOf(_speed);
    final next = _speeds[(idx + 1) % _speeds.length];
    setState(() => _speed = next);
    _ctrl.setSpeed(next);
    _showControlsBriefly();
  }

  void _toggleLock() {
    setState(() => _isLocked = !_isLocked);
  }

  void _onTapVideo() {
    if (_isLocked) {
      setState(() => _showControls = !_showControls);
      return;
    }
    setState(() => _showControls = !_showControls);
    if (_showControls) _scheduleHide();
  }

  void _showControlsBriefly() {
    setState(() => _showControls = true);
    _scheduleHide();
  }

  void _scheduleHide() {
    _hideTimer?.cancel();
    _hideTimer = Timer(const Duration(seconds: 4), () {
      if (mounted && !_disposed && _isPlaying) {
        setState(() => _showControls = false);
      }
    });
  }

  void _onSeek(double value) {
    if (!_isInitialized) return;
    final target = Duration(milliseconds: (value * _duration.inMilliseconds).round());
    _ctrl.seekTo(target);
  }

  String _fmt(Duration d) {
    final h = d.inHours;
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    if (h > 0) return '${h.toString().padLeft(2, '0')}:$m:$s';
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final ep = widget.request.episode;
    final title = ep.title ?? 'Episode ${ep.episodeNumber}';
    final progress = _duration.inMilliseconds > 0
        ? (_position.inMilliseconds / _duration.inMilliseconds).clamp(0.0, 1.0)
        : 0.0;

    return GestureDetector(
      onTap: _onTapVideo,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Video
          Center(child: BetterPlayer(controller: _ctrl)),

          // Lock overlay — only unlock button visible when locked
          if (_isLocked && _showControls)
            Positioned(
              left: 16,
              bottom: 80,
              child: GestureDetector(
                onTap: _toggleLock,
                child: Container(
                  width: 56,
                  height: 56,
                  decoration: const BoxDecoration(shape: BoxShape.circle, color: _kControlBg),
                  alignment: Alignment.center,
                  child: const Icon(Icons.lock_rounded, color: Colors.white, size: 24),
                ),
              ),
            ),

          // Full controls (hidden when locked)
          if (!_isLocked)
            AnimatedOpacity(
              opacity: _showControls ? 1.0 : 0.0,
              duration: const Duration(milliseconds: 200),
              child: IgnorePointer(
                ignoring: !_showControls,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    // Semi-transparent overlay bg
                    Container(color: _kOverlayBg),

                    // ── TOP BAR ──
                    Positioned(
                      top: 0, left: 0, right: 0,
                      child: Container(
                        color: _kTopBarBg,
                        child: SafeArea(
                          bottom: false,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                            child: Row(
                              children: [
                                // Back button (40dp)
                                _iconBtn(Icons.arrow_back_rounded, 40, () => Navigator.of(context).pop()),
                                // Title
                                Expanded(
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 4),
                                    child: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(color: Colors.white, fontSize: 16)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),

                    // ── LEFT SIDE CONTROLS ──
                    Positioned(
                      left: 16,
                      top: 0, bottom: 0,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Mute
                          _sideButton(
                            icon: _isMuted ? Icons.volume_off_rounded : Icons.volume_up_rounded,
                            label: _isMuted ? 'Unmute' : 'Mute',
                            onTap: _toggleMute,
                          ),
                          const SizedBox(height: 12),
                          // Speed
                          _sideButtonText(
                            text: '${_speed}x',
                            label: 'Speed',
                            onTap: _cycleSpeed,
                          ),
                        ],
                      ),
                    ),

                    // ── CENTER CONTROLS ──
                    Center(
                      child: _hasError
                          // Error state — retry button
                          ? GestureDetector(
                              onTap: () {
                                setState(() { _hasError = false; _isBuffering = true; });
                                _ctrl.retryDataSource();
                              },
                              child: Container(
                                width: 64, height: 64,
                                decoration: const BoxDecoration(shape: BoxShape.circle, color: _kPlayBg),
                                alignment: Alignment.center,
                                child: const Icon(Icons.refresh_rounded, color: Colors.white, size: 36),
                              ),
                            )
                          : Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                // Rewind 5s (hide during initial load)
                                if (_isInitialized)
                                  _iconBtn(Icons.replay_5_rounded, 48, () => _seekRelative(-5),
                                    bgColor: Colors.transparent),
                                if (_isInitialized) const SizedBox(width: 24),
                                // Center button: loader when buffering, play/pause when ready
                                GestureDetector(
                                  onTap: (_isBuffering && !_isInitialized) ? null : _togglePlayPause,
                                  child: Container(
                                    width: 64, height: 64,
                                    decoration: const BoxDecoration(shape: BoxShape.circle, color: _kPlayBg),
                                    alignment: Alignment.center,
                                    child: _isBuffering
                                        ? const SizedBox(
                                            width: 32, height: 32,
                                            child: CircularProgressIndicator(
                                              color: Colors.white, strokeWidth: 3,
                                            ),
                                          )
                                        : Icon(
                                            _isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                                            color: Colors.white, size: 42,
                                          ),
                                  ),
                                ),
                                if (_isInitialized) const SizedBox(width: 24),
                                // Forward 5s (hide during initial load)
                                if (_isInitialized)
                                  _iconBtn(Icons.forward_5_rounded, 48, () => _seekRelative(5),
                                    bgColor: Colors.transparent),
                              ],
                            ),
                    ),

                    // ── BOTTOM CONTROLS ──
                    Positioned(
                      left: 8, right: 8, bottom: 8,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Seekbar row: position | bar | duration
                          Row(
                            children: [
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 4),
                                child: Text(_fmt(_position),
                                  style: const TextStyle(color: Colors.white, fontSize: 12)),
                              ),
                              Expanded(
                                child: SliderTheme(
                                  data: SliderThemeData(
                                    trackHeight: 2,
                                    thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                                    overlayShape: const RoundSliderOverlayShape(overlayRadius: 12),
                                    activeTrackColor: _kGreen,
                                    inactiveTrackColor: Colors.white.withValues(alpha: 0.27),
                                    thumbColor: _kGreen,
                                    overlayColor: _kGreen.withValues(alpha: 0.2),
                                  ),
                                  child: Slider(value: progress, onChanged: _onSeek),
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 4),
                                child: Text(_fmt(_duration),
                                  style: const TextStyle(color: Colors.white, fontSize: 12)),
                              ),
                            ],
                          ),
                          // Bottom button row: lock | prev | next | stretch
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                _iconBtn(Icons.lock_open_rounded, 40, _toggleLock),
                                const SizedBox(width: 20),
                                _iconBtn(Icons.skip_previous_rounded, 40, () => _seekRelative(-30)),
                                const SizedBox(width: 20),
                                _iconBtn(Icons.skip_next_rounded, 40, () => _seekRelative(30)),
                                const SizedBox(width: 20),
                                _iconBtn(Icons.fullscreen_rounded, 40, () {
                                  // Toggle fit
                                  final current = _ctrl.betterPlayerConfiguration.fit;
                                  _ctrl.setOverriddenFit(
                                    current == BoxFit.contain ? BoxFit.cover : BoxFit.contain,
                                  );
                                }),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _iconBtn(IconData icon, double size, VoidCallback onTap, {Color bgColor = Colors.transparent}) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: size, height: size,
        child: Icon(icon, color: Colors.white, size: size * 0.6),
      ),
    );
  }

  Widget _sideButton({required IconData icon, required String label, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 44, height: 44,
            decoration: const BoxDecoration(shape: BoxShape.circle, color: _kControlBg),
            alignment: Alignment.center,
            child: Icon(icon, color: Colors.white, size: 22),
          ),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 10)),
        ],
      ),
    );
  }

  Widget _sideButtonText({required String text, required String label, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 44, height: 44,
            decoration: const BoxDecoration(shape: BoxShape.circle, color: _kControlBg),
            alignment: Alignment.center,
            child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 10)),
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
        useShouldInterceptRequest: true,
        allowsInlineMediaPlayback: true,
        mediaPlaybackRequiresUserGesture: false,
        enableViewportScale: true,
        userAgent: _ua,
      );

  Widget _buildWebView() {
    final blocker = AdBlocker.instance;

    final yt = _youtubeVideoId;
    if (yt != null) {
      return InAppWebView(
        initialSettings: _webviewSettings,
        initialData: InAppWebViewInitialData(
          data: _buildYouTubeHtml(yt),
          baseUrl: WebUri.uri(Uri.https('www.youtube-nocookie.com', '/')),
        ),
        onWebViewCreated: (c) => _controller = c,
        shouldInterceptRequest: (_, req) async {
          if (blocker.isAdHost(req.url.host)) return WebResourceResponse(statusCode: 204);
          return null;
        },
        onRenderProcessGone: (_, __) { if (!_disposed) _close(); },
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
        shouldInterceptRequest: (_, req) async {
          if (blocker.isAdHost(req.url.host)) return WebResourceResponse(statusCode: 204);
          return null;
        },
        onRenderProcessGone: (_, __) { if (!_disposed) _close(); },
      );
    }

    return InAppWebView(
      initialSettings: _webviewSettings,
      initialUrlRequest: URLRequest(
        url: WebUri(widget.url),
        headers: { 'Referer': _referer, 'Origin': _referer },
      ),
      onWebViewCreated: (c) => _controller = c,
      onLoadStart: (controller, url) {
        // Inject anti-popup JS early
        controller.evaluateJavascript(source: AdBlocker.antiPopupEarlyJs);
      },
      onLoadStop: (controller, url) {
        // Inject full cosmetic filtering + overlay removal after page load
        controller.evaluateJavascript(source: AdBlocker.antiPopupEarlyJs);
        controller.evaluateJavascript(source: AdBlocker.antiAdFullJs);
      },
      shouldOverrideUrlLoading: (_, action) async {
        final url = action.request.url?.toString() ?? '';
        final host = action.request.url?.host ?? '';
        if (host.isEmpty) return NavigationActionPolicy.ALLOW;
        if (blocker.isAdOrSuspicious(url)) return NavigationActionPolicy.CANCEL;
        return NavigationActionPolicy.ALLOW;
      },
      shouldInterceptRequest: (_, req) async {
        final host = req.url.host;
        if (blocker.isAdHost(host)) {
          return WebResourceResponse(statusCode: 204);
        }
        return null;
      },
      onRenderProcessGone: (_, __) { if (!_disposed) _close(); },
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) { if (!didPop) _close(); },
      child: Stack(
        children: [
          _buildWebView(),
          Positioned(
            top: 12, left: 12, right: 12,
            child: Row(
              children: [
                GestureDetector(
                  onTap: _close,
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                    child: const Icon(Icons.close, color: Colors.white, size: 20),
                  ),
                ),
                const Spacer(),
                AnimatedOpacity(
                  opacity: _showHint ? 1.0 : 0.0,
                  duration: const Duration(milliseconds: 400),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'TAP \u25B6 2-3 TIMES IF VIDEO DOES NOT PLAY',
                      style: TextStyle(color: Colors.red, fontSize: 11, fontWeight: FontWeight.w800),
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

}
