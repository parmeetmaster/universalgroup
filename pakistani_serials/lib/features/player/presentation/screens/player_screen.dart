import 'package:better_player_plus/better_player_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

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
          ? _NativePlayer(url: url)
          : _EmbedPlayer(url: url),
    );
  }

  static bool _isDirectVideo(String url) {
    final u = url.toLowerCase();
    return u.contains('.m3u8') || u.contains('.mp4') || u.contains('.webm');
  }
}

class _NativePlayer extends StatefulWidget {
  const _NativePlayer({required this.url});
  final String url;

  @override
  State<_NativePlayer> createState() => _NativePlayerState();
}

class _NativePlayerState extends State<_NativePlayer> {
  late final BetterPlayerController _controller;

  @override
  void initState() {
    super.initState();
    final isHls = widget.url.contains('.m3u8');
    _controller = BetterPlayerController(
      const BetterPlayerConfiguration(
        autoPlay: true,
        fit: BoxFit.contain,
        allowedScreenSleep: false,
        controlsConfiguration: BetterPlayerControlsConfiguration(
          enableSkips: true,
          enablePlayPause: true,
          enableMute: true,
          enableFullscreen: false,
        ),
      ),
      betterPlayerDataSource: BetterPlayerDataSource(
        BetterPlayerDataSourceType.network,
        widget.url,
        videoFormat: isHls
            ? BetterPlayerVideoFormat.hls
            : BetterPlayerVideoFormat.other,
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(child: BetterPlayer(controller: _controller));
  }
}

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

  /// Desktop-flavoured UA. Some Invidious mirrors throw an anti-bot
  /// challenge at the Chrome-on-Android UA we used earlier; the generic
  /// Linux Chrome string sails through while not hurting dramaspice,
  /// Dailymotion, or the YouTube IFrame API path.
  static const String _ua =
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  /// Host-appropriate Referer for direct-URL loads (dramaspice wants
  /// dramaxima's referer so its anti-hotlink check passes).
  String get _referer {
    final host = Uri.tryParse(widget.url)?.host ?? '';
    if (host.contains('dailymotion.com')) return 'https://www.dailymotion.com/';
    if (host.contains('youtube.com') || host.contains('youtu.be')) {
      return 'https://www.youtube.com/';
    }
    return 'https://dramaxima.com/';
  }

  /// YouTube blocks playback when its `/embed/<id>` URL is loaded as the
  /// WebView's top document ("Video unavailable — Playback on other
  /// websites has been disabled by the video owner"). The workaround —
  /// lifted from the animeworld client — is to serve an inline HTML page
  /// containing the YT IFrame Player API, with a `baseUrl` that makes the
  /// page look like it's coming from youtube-nocookie.com. The player
  /// then treats it as a normal same-origin iframe host.
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

  /// Dailymotion behaves similarly enough that the same wrapper pattern
  /// gives us one consistent init path + avoids intermittent redirect
  /// failures in Android WebView when loading `geo.dailymotion.com`
  /// directly as the top document.
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
        javaScriptEnabled: true,
        useShouldOverrideUrlLoading: true,
        allowsInlineMediaPlayback: true,
        mediaPlaybackRequiresUserGesture: false,
        enableViewportScale: true,
        domStorageEnabled: true,
        javaScriptCanOpenWindowsAutomatically: false,
        supportZoom: true,
        displayZoomControls: false,
        builtInZoomControls: true,
        userAgent: _ua,
      );

  /// Decide which init path to use:
  ///   • YouTube  → inline HTML + IFrame API, baseUrl = youtube-nocookie.com
  ///   • Dailymotion → inline HTML containing the geo-player iframe,
  ///                   baseUrl = dailymotion.com
  ///   • Everything else (dramaspice embeds) → direct URL load with
  ///                                            host-aware Referer
  Widget _buildWebView() {
    final yt = _youtubeVideoId;
    if (yt != null) {
      return InAppWebView(
        initialSettings: _webviewSettings,
        initialData: InAppWebViewInitialData(
          data: _buildYouTubeHtml(yt),
          baseUrl: WebUri.uri(Uri.https('www.youtube-nocookie.com', '/')),
          encoding: 'utf-8',
          mimeType: 'text/html',
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
          encoding: 'utf-8',
          mimeType: 'text/html',
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
                      'TAP ▶ 2-3 TIMES IF VIDEO DOES NOT PLAY',
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
