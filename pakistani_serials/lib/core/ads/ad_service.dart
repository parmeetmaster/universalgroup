import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:injectable/injectable.dart';

// Ad unit IDs
const _interstitialId = 'ca-app-pub-9421269541566983/9864047181';
const _appOpenId = 'ca-app-pub-9421269541566983/8415234146';
const _descBannerId = 'ca-app-pub-9421269541566983/4603981640';
const _playBannerId = 'ca-app-pub-9421269541566983/9001401974';
const _homeNativeId = 'ca-app-pub-9421269541566983/8259851704';
const _browseNativeId = 'ca-app-pub-9421269541566983/7198355391';

const _interstitialPoolSize = 2;

/// Master kill switch — set to false to disable ALL ads app-wide.
const adsEnabled = true;

@singleton
class AdService {
  bool _sdkInitialized = false;

  // ── Interstitial pool ──
  final List<InterstitialAd> _interstitialPool = [];
  bool _isShowingInterstitial = false;

  // ── App Open Ad ──
  AppOpenAd? _appOpenAd;
  bool _isShowingAppOpen = false;
  DateTime? _appOpenLoadTime;

  /// Initialize SDK + preload all ad types.
  Future<void> init() async {
    if (!adsEnabled || _sdkInitialized) return;
    await MobileAds.instance.initialize();
    _sdkInitialized = true;
    debugPrint('AdService: SDK initialized');

    // Preload interstitials
    for (var i = 0; i < _interstitialPoolSize; i++) {
      _loadInterstitial();
    }

    // Preload app open ad
    _loadAppOpenAd();
  }

  // ═══════════════════════════════════════════════════
  // INTERSTITIAL
  // ═══════════════════════════════════════════════════

  void showInterstitial({VoidCallback? onDone}) {
    if (!adsEnabled) { onDone?.call(); return; }
    if (_isShowingInterstitial) {
      onDone?.call();
      return;
    }

    if (_interstitialPool.isEmpty) {
      debugPrint('AdService: no interstitial in pool, skipping');
      _loadInterstitial();
      onDone?.call();
      return;
    }

    _isShowingInterstitial = true;
    final ad = _interstitialPool.removeAt(0);

    ad.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        _isShowingInterstitial = false;
        _loadInterstitial();
        onDone?.call();
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        debugPrint('AdService: interstitial show failed: ${error.message}');
        ad.dispose();
        _isShowingInterstitial = false;
        _loadInterstitial();
        onDone?.call();
      },
    );

    ad.show();
  }

  Future<void> showAndWait() {
    final completer = Completer<void>();
    showInterstitial(onDone: completer.complete);
    return completer.future;
  }

  void _loadInterstitial() {
    if (!_sdkInitialized) return;
    InterstitialAd.load(
      adUnitId: _interstitialId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          debugPrint('AdService: interstitial loaded (pool: ${_interstitialPool.length + 1})');
          _interstitialPool.add(ad);
        },
        onAdFailedToLoad: (error) {
          debugPrint('AdService: interstitial load failed: ${error.message}');
          Future<void>.delayed(const Duration(seconds: 30), _loadInterstitial);
        },
      ),
    );
  }

  // ═══════════════════════════════════════════════════
  // APP OPEN AD
  // ═══════════════════════════════════════════════════

  void showAppOpenAd() {
    if (!adsEnabled || _isShowingAppOpen || _isShowingInterstitial) return;

    if (_appOpenAd == null || _isAppOpenExpired()) {
      _appOpenAd?.dispose();
      _appOpenAd = null;
      _loadAppOpenAd();
      return;
    }

    _isShowingAppOpen = true;
    _appOpenAd!.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        _appOpenAd = null;
        _isShowingAppOpen = false;
        _loadAppOpenAd();
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        debugPrint('AdService: app open show failed: ${error.message}');
        ad.dispose();
        _appOpenAd = null;
        _isShowingAppOpen = false;
        _loadAppOpenAd();
      },
    );
    _appOpenAd!.show();
  }

  bool _isAppOpenExpired() {
    if (_appOpenLoadTime == null) return true;
    return DateTime.now().difference(_appOpenLoadTime!).inHours >= 4;
  }

  void _loadAppOpenAd() {
    if (!_sdkInitialized) return;
    AppOpenAd.load(
      adUnitId: _appOpenId,
      request: const AdRequest(),
      adLoadCallback: AppOpenAdLoadCallback(
        onAdLoaded: (ad) {
          debugPrint('AdService: app open ad loaded');
          _appOpenAd = ad;
          _appOpenLoadTime = DateTime.now();
        },
        onAdFailedToLoad: (error) {
          debugPrint('AdService: app open load failed: ${error.message}');
          Future<void>.delayed(const Duration(seconds: 60), _loadAppOpenAd);
        },
      ),
    );
  }

  // ═══════════════════════════════════════════════════
  // BANNER ADS
  // ═══════════════════════════════════════════════════

  /// Pre-built ad widgets — const to avoid rebuilds.
  static const Widget descriptionBanner = _BannerAdWidget(adUnitId: _descBannerId);
  static const Widget playBanner = _BannerAdWidget(adUnitId: _playBannerId);
  static const Widget homeNativeAd = _NativeAdWidget(adUnitId: _homeNativeId);
  static const Widget browseNativeAd = _NativeAdWidget(adUnitId: _browseNativeId);
}

class _BannerAdWidget extends StatefulWidget {
  const _BannerAdWidget({required this.adUnitId});
  final String adUnitId;

  @override
  State<_BannerAdWidget> createState() => _BannerAdWidgetState();
}

class _BannerAdWidgetState extends State<_BannerAdWidget> {
  BannerAd? _bannerAd;
  bool _isLoaded = false;

  @override
  void initState() {
    super.initState();
    if (adsEnabled) _loadAd();
  }

  void _loadAd() {
    _bannerAd = BannerAd(
      adUnitId: widget.adUnitId,
      size: AdSize.banner,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (ad) {
          if (mounted) setState(() => _isLoaded = true);
        },
        onAdFailedToLoad: (ad, error) {
          debugPrint('Banner load failed: ${error.message}');
          ad.dispose();
          _bannerAd = null;
        },
      ),
    )..load();
  }

  @override
  void dispose() {
    _bannerAd?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isLoaded || _bannerAd == null) return const SizedBox.shrink();
    return SizedBox(
      width: _bannerAd!.size.width.toDouble(),
      height: _bannerAd!.size.height.toDouble(),
      child: AdWidget(ad: _bannerAd!),
    );
  }
}

class _NativeAdWidget extends StatefulWidget {
  const _NativeAdWidget({required this.adUnitId});
  final String adUnitId;

  @override
  State<_NativeAdWidget> createState() => _NativeAdWidgetState();
}

class _NativeAdWidgetState extends State<_NativeAdWidget> {
  NativeAd? _nativeAd;
  bool _isLoaded = false;

  @override
  void initState() {
    super.initState();
    if (adsEnabled) _loadAd();
  }

  void _loadAd() {
    _nativeAd = NativeAd(
      adUnitId: widget.adUnitId,
      request: const AdRequest(),
      factoryId: 'listTile',
      listener: NativeAdListener(
        onAdLoaded: (ad) {
          if (mounted) setState(() => _isLoaded = true);
        },
        onAdFailedToLoad: (ad, error) {
          debugPrint('Native ad load failed: ${error.message}');
          ad.dispose();
          _nativeAd = null;
        },
      ),
    )..load();
  }

  @override
  void dispose() {
    _nativeAd?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isLoaded || _nativeAd == null) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      height: 120,
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A24),
        borderRadius: BorderRadius.circular(10),
      ),
      clipBehavior: Clip.antiAlias,
      child: AdWidget(ad: _nativeAd!),
    );
  }
}
