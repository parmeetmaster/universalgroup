import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';

/// Comprehensive multi-layer ad blocker for WebView.
///
/// Ported from the Video Downloader app's 880-line Kotlin AdBlocker.
/// - 300+ hardcoded ad domains
/// - 4 downloadable filter lists (170K+ domains)
/// - URL pattern blocking
/// - Whitelist for CDNs and video platforms
/// - LRU-style cache for fast lookups
/// - JS injection scripts (anti-popup + cosmetic filtering)
class AdBlocker {
  AdBlocker._();
  static final AdBlocker instance = AdBlocker._();

  bool _initialized = false;
  bool get isInitialized => _initialized;

  final Set<String> _hostsSet = {};
  final Set<String> _popupSet = {};
  final Set<String> _adguardSet = {};
  final Set<String> _antiPopSet = {};

  // Simple LRU-ish cache
  final Map<String, bool> _cache = {};
  static const int _cacheMax = 2000;

  static const Duration _refreshInterval = Duration(days: 7);

  static const _filterLists = [
    _FilterList(
      url: 'https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts',
      filename: 'ad_hosts.txt',
      format: _FilterFormat.hosts,
    ),
    _FilterList(
      url:
          'https://gitlab.com/hagezi/mirror/-/raw/main/dns-blocklists/adblock/popupads.txt',
      filename: 'popup_ads.txt',
      format: _FilterFormat.adblock,
    ),
    _FilterList(
      url:
          'https://adguardteam.github.io/AdGuardSDNSFilter/Filters/filter.txt',
      filename: 'adguard_dns.txt',
      format: _FilterFormat.adblock,
    ),
    _FilterList(
      url:
          'https://raw.githubusercontent.com/Veticia/antipopads/master/popads.txt',
      filename: 'antipopads.txt',
      format: _FilterFormat.adblock,
    ),
  ];

  /// Initialize: download filter lists (if stale) and parse them.
  Future<void> init() async {
    if (_initialized) return;
    try {
      final dir = await getApplicationSupportDirectory();
      final sets = [_hostsSet, _popupSet, _adguardSet, _antiPopSet];

      for (var i = 0; i < _filterLists.length; i++) {
        final fl = _filterLists[i];
        final file = File('${dir.path}/${fl.filename}');

        final needsRefresh = !file.existsSync() ||
            DateTime.now().difference(file.lastModifiedSync()) >
                _refreshInterval;

        if (needsRefresh) {
          await _download(fl.url, file);
        }

        if (file.existsSync()) {
          final domains = await compute(_parseFile, _ParseArgs(file.path, fl.format));
          sets[i].addAll(domains);
          final name = fl.filename;
          debugPrint('AdBlocker: loaded ${domains.length} domains from $name');
        }
      }

      _cache.clear();
      _initialized = true;
      final total = _totalDomains;
      debugPrint('AdBlocker: initialized ($total total domains)');
    } catch (e) {
      debugPrint('AdBlocker: init error: $e');
      _initialized = true; // Still mark as init so hardcoded list works
    }
  }

  int get _totalDomains =>
      _hostsSet.length +
      _popupSet.length +
      _adguardSet.length +
      _antiPopSet.length +
      _extraAdDomains.length;

  Future<void> _download(String url, File target) async {
    try {
      final client = HttpClient()
        ..connectionTimeout = const Duration(seconds: 15);
      final request = await client.getUrl(Uri.parse(url));
      final response = await request.close().timeout(const Duration(seconds: 30));
      if (response.statusCode == 200) {
        final sink = target.openWrite();
        await response.pipe(sink);
        debugPrint('AdBlocker: downloaded ${target.path.split('/').last}');
      }
      client.close(force: true);
    } catch (e) {
      debugPrint('AdBlocker: download failed for ${target.path.split('/').last}: $e');
    }
  }

  /// Check if a URL host is a known ad domain (lightweight, for sub-resources).
  bool isAdHost(String host) {
    if (host.isEmpty) return false;
    final h = host.toLowerCase();

    // Whitelist check first
    if (_isWhitelisted(h)) return false;

    // Cache check
    final cached = _cache[h];
    if (cached != null) return cached;

    final result = _checkDomain(h);

    // Simple cache eviction
    if (_cache.length >= _cacheMax) {
      _cache.remove(_cache.keys.first);
    }
    _cache[h] = result;
    return result;
  }

  /// Full check for main-frame navigations (includes URL pattern check).
  bool isAdOrSuspicious(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null) return false;

    final host = uri.host.toLowerCase();
    if (host.isEmpty) return false;
    if (_isWhitelisted(host)) return false;

    // Domain check
    if (isAdHost(host)) return true;

    // URL pattern check
    final lower = url.toLowerCase();
    for (final p in _suspiciousPatterns) {
      if (lower.contains(p)) return true;
    }

    return false;
  }

  bool _checkDomain(String host) {
    // Hardcoded extra domains
    if (_matchesDomainSet(host, _extraAdDomains)) return true;

    // Downloaded lists
    if (_hostsSet.contains(host)) return true;
    if (_popupSet.contains(host)) return true;
    if (_adguardSet.contains(host)) return true;
    if (_antiPopSet.contains(host)) return true;

    // Check parent domain (e.g., "cdn.popads.net" → check "popads.net")
    final dot = host.indexOf('.');
    if (dot > 0 && dot < host.length - 1) {
      final parent = host.substring(dot + 1);
      if (_extraAdDomains.contains(parent)) return true;
      if (_hostsSet.contains(parent)) return true;
      if (_popupSet.contains(parent)) return true;
    }

    return false;
  }

  bool _matchesDomainSet(String host, Set<String> domains) {
    if (domains.contains(host)) return true;
    // Partial match: host contains a known ad domain
    for (final d in domains) {
      if (host.endsWith('.$d') || host == d) return true;
    }
    return false;
  }

  bool _isWhitelisted(String host) {
    for (final w in _whitelist) {
      if (host == w || host.endsWith('.$w')) return true;
    }
    return false;
  }

  // ═══════════════════════════════════════════════════════════════
  // HARDCODED AD DOMAINS (300+)
  // ═══════════════════════════════════════════════════════════════
  static const _extraAdDomains = <String>{
    // Popup/popunder networks
    'popads.net', 'popcash.net', 'popunder.net', 'popunderjs.com',
    'popundertotal.com', 'popmyads.com', 'poperblocker.com',
    'popadscdn.net', 'serve.popads.net', 'cdn.popads.net',
    // Click/redirect networks
    'clickadu.com', 'clickaine.com', 'clickadilla.com',
    'propellerads.com', 'propellerpops.com', 'propellerclick.com',
    'adsterra.com', 'adsterratech.com',
    'juicyads.com', 'exoclick.com', 'exosrv.com', 'exdynsrv.com',
    'realsrv.com', 'syndication.realsrv.com',
    'trafficjunky.net', 'trafficjunky.com',
    'trafficstars.com', 'trafficfactory.biz', 'a-ads.com',
    // Hilltopads/Monetag/Galaksion
    'hilltopads.net', 'hilltopads.com', 'monetag.com', 'galaksion.com',
    'onclasrv.com', 'go.onclasrv.com', 'adsco.re',
    // Push notification ad networks
    'pushprofit.net', 'pushnative.com', 'notifpush.com',
    'pushame.com', 'pushwhy.com', 'pushails.com', 'pushking.net',
    'pushance.com', 'pushno.com', 'pushsrv.com',
    'richpush.net', 'richpush.co', 'webpushsdk.com',
    'subscribecounter.com', 'pushwoosh.com', 'pushcrew.com',
    'gravitec.net', 'sendpulse.com',
    // Ad/popup broker networks
    'onclickmax.com', 'onclickgenius.com', 'onclicksuper.com',
    'onclickbright.com', 'onclickperformance.com',
    'dolohen.com', 'cdn.dolohen.com', 'dollarrevenue.com',
    'dismaltrack.com', 'betteradsblock.com', 'surfrivalry.com',
    'jokfrail.com', 'atodfrail.com', 'stickyadstv.com',
    // Native/content ad networks
    'adskeeper.co.uk', 'adskeeper.com', 'bidvertiser.com',
    'revcontent.com', 'contentabc.com', 'cpmstar.com',
    'ad-maven.com', 'admaven.com', 'tsyndicate.com',
    'outbrain.com', 'taboola.com', 'mgid.com',
    'zedo.com', 'nativo.com', 'sharethrough.com',
    // Google ad serving
    'pagead2.googlesyndication.com', 'tpc.googlesyndication.com',
    'googleadservices.com', 'adservice.google.com',
    'doubleclick.net', 'googletagservices.com',
    'googlesyndication.com', 'securepubads.g.doubleclick.net',
    'adclick.g.doubleclick.net', 'googletagmanager.com',
    // Programmatic/SSP ad networks
    'serving-sys.com', 'smartadserver.com', 'amazon-adsystem.com',
    'media.net', 'pubmatic.com', 'openx.net', 'openx.com',
    'rubiconproject.com', 'criteo.com', 'criteo.net',
    'indexexchange.com', 'casalemedia.com', '33across.com',
    'sovrn.com', 'lijit.com', 'undertone.com', 'gumgum.com',
    'conversantmedia.com', 'yieldmo.com',
    'teads.tv', 'teads.com', 'freestar.com',
    'mediavine.com', 'ezoic.net', 'ezoic.com',
    'adnxs.com', 'adtechus.com', 'advertising.com',
    'yieldmanager.com', 'buysellads.com', 'carbonads.com',
    'revjet.com', 'adroll.com', 'perfectaudience.com',
    'retargeter.com', 'fastclick.net',
    // Mobile ad networks
    'adcolony.com', 'unityads.unity3d.com', 'applovin.com',
    'mopub.com', 'inmobi.com', 'startapp.com',
    'vungle.com', 'chartboost.com', 'ironsrc.com',
    'ironsource.com', 'fyber.com', 'tapjoy.com',
    // URL shortener/monetization
    'adf.ly', 'bc.vc', 'ouo.io', 'ouo.press', 'sh.st',
    'linkvertise.com', 'shrinkme.io', 'exe.io', 'gplinks.co',
    'shrinkforearn.com', 'shortzon.com', 'linkbucks.com',
    'cpmlink.net', 'adshort.co', 'adsrt.com', 'adsafelink.com',
    // Popup redirect (adult)
    'bongacams.com', 'chaturbate.com', 'livejasmin.com',
    'cam4.com', 'stripchat.com', 'xhamsteradult.com', 'camsoda.com',
    // Tracking/analytics
    'scorecardresearch.com', 'hotjar.com', 'quantserve.com',
    'quantcount.com', 'bluekai.com', 'demdex.net', 'krxd.net',
    'rlcdn.com', 'exelator.com', 'eyeota.net',
    'adform.net', 'adform.com', 'adsrvr.org', 'mathtag.com',
    'histats.com', 'statcounter.com',
    'mc.yandex.ru', 'yandex.metric',
    'chartbeat.com',
    // Video ad networks
    'springserve.com', 'spotxchange.com', 'spotx.tv',
    'brightroll.com', 'innovid.com', 'tremormedia.com',
    'tubemogul.com', 'videologygroup.com',
    // Anti-adblock services
    'blockadblock.com', 'blockthrough.com',
    'detectadblock.com', 'adblock-detector.com',
    // Misc aggressive networks
    'ladsrv.com', 'adserverplus.com', 'advertserve.com',
    'ero-advertising.com', 'plugrush.com', 'traffichunt.com',
    'zeroredirect.com', 'adxpansion.com', 'adsessionserv.com',
    'adspyglass.com', 'adtng.com', 'adxprtz.com', 'bebi.com',
    // Popup redirect domains
    'omg10.com', 'omg1.com', 'omg2.com', 'omg3.com', 'omg4.com',
    'omg5.com', 'omg6.com', 'omg7.com', 'omg8.com', 'omg9.com',
    // Additional redirect networks
    'syndtr.com', 'dfrfrnt.com', 'srfrnt.com', 'scrnch.me',
    'sfrfrnt.com', 'notifzone.com',
    'go.oclasrv.com', 'go.strfrnt.com', 'go.mobisla.com',
    'go.onclickmax.com', 'go.onclkds.com', 'go.padstm.com',
    'cpasmedia.com', 'landingtrack.com', 'pusherism.com',
    'syndication.exoclick.com', 'static.surfercloud.com',
    // Drama-specific ad domains
    'betterads.org', 'disqus.com', 'revive-adserver.com',
    'whos.amung.us',
  };

  // ═══════════════════════════════════════════════════════════════
  // SUSPICIOUS URL PATTERNS
  // ═══════════════════════════════════════════════════════════════
  static const _suspiciousPatterns = [
    '/popunder', '/popup', '/clickunder',
    '/afu.php', '/go.php?', '/redirect.php',
    'track.php?', '/adclick', '/ad_click',
    '/ad/popup', '/ads/popup',
    '/pop.php', '/popunder.js',
    'syncedCookie=true', 'rhd=false',
  ];

  // ═══════════════════════════════════════════════════════════════
  // WHITELIST (CDNs, video platforms — never block)
  // ═══════════════════════════════════════════════════════════════
  static const _whitelist = <String>{
    // Video platforms
    'youtube.com', 'googlevideo.com', 'ytimg.com', 'ggpht.com',
    'dailymotion.com', 'dm-event.net', 'dmcdn.net',
    'vimeo.com', 'vimeocdn.com',
    'tiktok.com', 'tiktokcdn.com',
    // Social
    'instagram.com', 'cdninstagram.com',
    'facebook.com', 'facebook.net', 'fbcdn.net', 'fbcdn.com',
    'twitter.com', 'twimg.com', 'x.com',
    // CDNs
    'cloudfront.net', 'akamaihd.net', 'akamaized.net',
    'cloudflare.com', 'cloudflareinsights.com',
    'challenges.cloudflare.com', 'cdnjs.cloudflare.com',
    'fastly.net', 'jsdelivr.net', 'unpkg.com',
    'stackpath.com', 'stackpathdns.com', 'maxcdn.com',
    'azureedge.net', 'azurefd.net',
    'b-cdn.net', 'bunny.net', 'bunnycdn.com', 'keycdn.com',
    // Web infrastructure
    'jquery.com', 'fontawesome.com', 'bootstrapcdn.com',
    'hcaptcha.com', 'recaptcha.net', 'sentry.io', 'sentry-cdn.com',
    // Google (non-ad)
    'google.com', 'googleapis.com', 'gstatic.com', 'ampproject.org',
    // Drama/video embed services
    'dramaxima.com',
    'megacloud.blog', 'megacloud.tv', 'megacloud.club',
    'rapid-cloud.co', 'rapid-cloud.ru', 'rabbitstream.net',
    'vidplay.site', 'vidplay.online', 'vidplay.lol',
    'vidstream.pro', 'vidstreaming.io',
    'filemoon.sx', 'filemoon.to', 'filemoon.in',
    'mp4upload.com', 'mixdrop.co', 'mixdrop.to',
    'doodstream.com', 'dood.wf', 'dood.watch',
    'streamtape.com', 'stape.fun',
    'sbplay.org', 'embedsb.com', 'streamsb.net',
    'vizcloud.co', 'mcloud.bz', 'mcloud.to',
    'gogocdn.net', 'goone.pro', 'embtaku.pro',
    'playtaku.net', 'playtaku.online',
    's3taku.com', 'vipanicdn.net',
    'awish.pro', 'alions.pro',
    'biananset.net', 'dokicloud.one', 'netmagcdn.com',
  };

  // ═══════════════════════════════════════════════════════════════
  // JS INJECTION SCRIPTS
  // ═══════════════════════════════════════════════════════════════

  /// Inject EARLY on page start — blocks window.open, click hijacking, redirects.
  static const antiPopupEarlyJs = '''
(function() {
  'use strict';
  if (window.__abp_early) return;
  window.__abp_early = true;
  var currentHost = location.hostname;
  var noop = function() { return null; };
  window.open = noop;
  try { Object.defineProperty(window, 'open', { get: function() { return noop; }, set: function() {}, configurable: false }); } catch(e) {}
  var _ael = EventTarget.prototype.addEventListener;
  var hijackTypes = {'click':1,'mousedown':1,'pointerdown':1,'mouseup':1,'pointerup':1,'touchstart':1,'touchend':1,'contextmenu':1};
  EventTarget.prototype.addEventListener = function(type, fn, opts) {
    if (hijackTypes[type] && (this === document || this === document.body || this === document.documentElement || this === window)) {
      try { var s = fn.toString(); if (/window\\.(open|location)|location\\.(assign|replace|href)|popunder|_blank|\\.click\\(\\)/.test(s)) return; } catch(e) {}
    }
    return _ael.call(this, type, fn, opts);
  };
  var _st = window.setTimeout, _si = window.setInterval;
  window.setTimeout = function(fn, d) { if (typeof fn === 'string' && /window\\.(location|open)|location\\.(assign|replace|href)|popunder/.test(fn)) return 0; return _st.apply(window, arguments); };
  window.setInterval = function(fn, d) { if (typeof fn === 'string' && /window\\.(location|open)|location\\.(assign|replace|href)|popunder/.test(fn)) return 0; return _si.apply(window, arguments); };
  if (window.Notification) { window.Notification.requestPermission = function() { return Promise.resolve('denied'); }; }
  var adPat = /popads|popcash|clickadu|propeller|adsterra|exoclick|juicyads|trafficjunky|hilltopads|monetag|galaksion|admaven|dolohen|onclickmax|surfrivalry|pushprofit|bongacams|chaturbate|livejasmin|stripchat|cam4|popunder|afu\\.php|\\/go\\.php/i;
  var _assign = location.assign.bind(location), _replace = location.replace.bind(location);
  location.assign = function(url) { try { if (adPat.test(url) || (new URL(url, location.href).hostname !== currentHost && adPat.test(new URL(url, location.href).hostname))) return; } catch(e) {} return _assign(url); };
  location.replace = function(url) { try { if (adPat.test(url) || (new URL(url, location.href).hostname !== currentHost && adPat.test(new URL(url, location.href).hostname))) return; } catch(e) {} return _replace(url); };
  var _click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function() {
    var href = this.href || '';
    if (this.offsetWidth === 0 || this.offsetHeight === 0 || this.style.display === 'none' || this.style.visibility === 'hidden') return;
    if (adPat.test(href)) return;
    if (this.target === '_blank') { try { var h = new URL(href).hostname; if (h !== currentHost && adPat.test(h)) return; } catch(e) {} }
    return _click.call(this);
  };
  var _headAppend = HTMLHeadElement.prototype.appendChild;
  HTMLHeadElement.prototype.appendChild = function(node) {
    if (node.tagName === 'META' && node.httpEquiv && node.httpEquiv.toLowerCase() === 'refresh') { var content = (node.content || '').toLowerCase(); if (adPat.test(content)) return node; }
    return _headAppend.call(this, node);
  };
  window.addEventListener('beforeunload', function(e) { delete e.returnValue; }, true);
})();
''';

  /// Inject AFTER page load — CSS cosmetic filtering + overlay removal.
  static const antiAdFullJs = '''
(function() {
  'use strict';
  if (window.__abp_full) return;
  window.__abp_full = true;
  window.open = function() { return null; };
  try { Object.defineProperty(window, 'open', { get: function() { return function() { return null; }; }, set: function() {}, configurable: false }); } catch(e) {}
  var sels = [
    'ins.adsbygoogle','[class*="adsbygoogle"]','[id*="google_ads"]',
    'div[id^="div-gpt-ad"]','[id^="google_ads_iframe"]',
    '[class*="ad-container"]','[class*="ad-wrapper"]','[class*="ad-slot"]',
    '[class*="ad-unit"]','[class*="ad-banner"]','[class*="ad-space"]',
    '[class*="ad-placement"]','[class*="ad-holder"]','[class*="ad-zone"]',
    '[id*="ad-container"]','[id*="ad-wrapper"]','[id*="ad-slot"]',
    '[id*="ad-unit"]','[id*="ad-banner"]','[id*="ad-space"]',
    '[class*="adsBox"]','[class*="ads-box"]','[class*="adBox"]',
    '[class*="ads-banner"]','[class*="adBanner"]',
    '[class*="adContainer"]','[class*="adsContainer"]',
    '[class*="adWrapper"]','[class*="adsWrapper"]',
    '[class*="popup-overlay"]','[class*="popunder"]',
    '[class*="overlay-ad"]','[class*="ad-overlay"]',
    '[id*="popup-overlay"]','[id*="popunder"]',
    '[class*="sticky-ad"]','[class*="floating-ad"]','[class*="fixed-ad"]',
    '[class*="stickyAd"]','[class*="floatingAd"]',
    '[class*="push-notification"]','[class*="notification-popup"]',
    '[class*="webpush"]','[id*="webpush"]',
    '[class*="monetag"]','[class*="galaksion"]',
    '[class*="propellerads"]','[class*="adsterra"]',
    '[id*="ScriptRoot"]','[class*="ScriptRoot"]',
    '[class*="exoclick"]','[class*="juicyads"]',
    '[class*="hilltopads"]','[class*="clickadu"]',
    'iframe[src*="doubleclick"]','iframe[src*="googlesyndication"]',
    'iframe[src*="popads"]','iframe[src*="adsterra"]',
    'iframe[src*="exoclick"]','iframe[src*="juicyads"]',
    'iframe[src*="clickadu"]','iframe[src*="propellerads"]',
    'iframe[src*="monetag"]','iframe[src*="galaksion"]',
    'iframe[src*="hilltopads"]','iframe[src*="admaven"]',
    'a[href*="clickadu.com"]','a[href*="juicyads.com"]',
    'a[href*="exoclick.com"]','a[href*="popads.net"]',
    'a[href*="propellerads.com"]','a[href*="adsterra.com"]',
    'a[href*="monetag"]','a[href*="galaksion"]',
    'a[href*="bongacams"]','a[href*="chaturbate"]',
    'a[href*="livejasmin"]','a[href*="stripchat"]',
    'img[width="1"][height="1"]','img[width="0"]','img[height="0"]',
    '[class*="taboola"]','[class*="outbrain"]','[class*="mgid"]'
  ];
  var css = document.createElement('style');
  css.id = '__abp_css';
  var r = '', hide = '{display:none!important;height:0!important;min-height:0!important;max-height:0!important;overflow:hidden!important;}';
  for (var i = 0; i < sels.length; i++) r += sels[i] + hide;
  css.textContent = r;
  (document.head || document.documentElement).appendChild(css);
  var adDomains = ['popads','popunder','popcash','clickadu','propellerads','adsterra','juicyads','exoclick','exosrv','trafficjunky','trafficstars','hilltopads','monetag','galaksion','admaven','richpush','dolohen','onclickmax','doubleclick','googlesyndication','googleadservices','bongacams','chaturbate','livejasmin','cam4','stripchat'];
  function isAdEl(el) {
    try {
      var tag = (el.tagName || '').toUpperCase();
      if (!tag) return false;
      if (tag === 'VIDEO' || tag === 'AUDIO' || tag === 'CANVAS' || tag === 'SOURCE') return false;
      if (tag === 'IFRAME') {
        var src = (el.src || el.getAttribute('src') || '').toLowerCase();
        if (src) { for (var i = 0; i < adDomains.length; i++) { if (src.indexOf(adDomains[i]) >= 0) return true; } }
      }
      var cn = ((el.className || '') + ' ' + (el.id || '')).toLowerCase();
      var adPats = ['adsbox','ad-box','adcontainer','ad-container','adwrapper','ad-wrapper','adslot','ad-slot','adbanner','ad-banner','adunit','ad-unit','adsbygoogle','scriptroot','popunder','pop-under','popup-overlay','ad-overlay','overlay-ad','sticky-ad','floating-ad','push-notification','webpush'];
      for (var i = 0; i < adPats.length; i++) { if (cn.indexOf(adPats[i]) >= 0) return true; }
      var st = el.style || {};
      if (tag === 'DIV' || tag === 'SECTION') {
        var op = parseFloat(st.opacity); var zi = parseInt(st.zIndex || '0');
        if (op <= 0.01 && zi > 999) return true;
      }
    } catch(e) {}
    return false;
  }
  function sweep() {
    var all = document.querySelectorAll('div,iframe,section,aside,ins,a');
    for (var i = 0; i < all.length; i++) { if (isAdEl(all[i])) { all[i].style.display = 'none'; all[i].style.height = '0'; all[i].style.overflow = 'hidden'; } }
  }
  sweep();
  var delays = [500, 1500, 3000, 6000, 10000];
  delays.forEach(function(d) { setTimeout(sweep, d); });
  try {
    var obs = new MutationObserver(function(muts) {
      for (var i = 0; i < muts.length; i++) {
        var added = muts[i].addedNodes;
        for (var j = 0; j < added.length; j++) { if (added[j].nodeType === 1 && isAdEl(added[j])) { added[j].style.display = 'none'; } }
      }
    });
    obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
  } catch(e) {}
  try { if (document.body) { document.body.onclick = null; document.body.removeAttribute('onclick'); } } catch(e) {}
})();
''';
}

// ── Filter list parsing (runs in isolate via compute) ──

enum _FilterFormat { hosts, adblock }

class _FilterList {
  const _FilterList({
    required this.url,
    required this.filename,
    required this.format,
  });
  final String url;
  final String filename;
  final _FilterFormat format;
}

class _ParseArgs {
  const _ParseArgs(this.path, this.format);
  final String path;
  final _FilterFormat format;
}

Set<String> _parseFile(_ParseArgs args) {
  final file = File(args.path);
  final domains = <String>{};

  for (final line in file.readAsLinesSync()) {
    final trimmed = line.trim();
    if (trimmed.isEmpty || trimmed.startsWith('#') || trimmed.startsWith('!')) {
      continue;
    }

    switch (args.format) {
      case _FilterFormat.hosts:
        // Format: "0.0.0.0 domain.com" or "127.0.0.1 domain.com"
        if (trimmed.startsWith('0.0.0.0 ') || trimmed.startsWith('127.0.0.1 ')) {
          final parts = trimmed.split(RegExp(r'\s+'));
          if (parts.length >= 2) {
            final host = parts[1].trim();
            if (host.isNotEmpty && host != '0.0.0.0' && host != 'localhost') {
              domains.add(host);
            }
          }
        }
      case _FilterFormat.adblock:
        // AdBlock Plus format: "||domain.com^" or "||domain.com"
        if (trimmed.startsWith('||')) {
          var domain = trimmed.substring(2);
          final caret = domain.indexOf('^');
          if (caret > 0) domain = domain.substring(0, caret);
          final dollar = domain.indexOf('\$');
          if (dollar > 0) domain = domain.substring(0, dollar);
          domain = domain.trim().toLowerCase();
          if (domain.isNotEmpty &&
              !domain.contains('/') &&
              !domain.contains('*') &&
              domain.contains('.')) {
            domains.add(domain);
          }
        }
    }
  }

  return domains;
}
