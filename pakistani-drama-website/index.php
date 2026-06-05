<?php
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');

$domain = 'https://pakistanidramaapp.animekill.com';
$playStoreUrl = 'https://play.google.com/store/apps/details?id=com.pakistanidrama.serial&referrer=utm_source%3Dwebsite%26utm_medium%3Dlanding_page%26utm_campaign%3Dpak_drama';
$appName = 'Pakistani Drama & Serials';
$year = date('Y');
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- Primary SEO -->
    <title>Pakistani Drama App - Watch Free Pakistani Serials & Dramas in HD</title>
    <meta name="description" content="Watch 1000+ Pakistani dramas and serials free in HD. Stream ARY Digital, Geo TV, Hum TV shows. Download the #1 Pakistani drama app for Android now.">
    <meta name="keywords" content="pakistani drama app, pakistani serials app, watch pakistani dramas free, ary digital dramas, geo tv dramas, hum tv dramas, download pakistani drama app, pakistani drama app download">
    <meta name="author" content="Pakistani Drama & Serials">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="googlebot" content="index, follow">
    <link rel="canonical" href="<?= $domain ?>/">

    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="<?= $domain ?>/">
    <meta property="og:title" content="Pakistani Drama App - Watch Free Dramas & Serials in HD">
    <meta property="og:description" content="Watch 1000+ Pakistani dramas free in HD. Stream ARY Digital, Geo TV, Hum TV shows. Download the #1 drama app for Android.">
    <meta property="og:image" content="<?= $domain ?>/og-image.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Pakistani Drama App showing popular drama thumbnails on Android phone">
    <meta property="og:site_name" content="<?= $appName ?>">
    <meta property="og:locale" content="en_US">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="<?= $domain ?>/">
    <meta name="twitter:title" content="Pakistani Drama App - Watch Free Dramas & Serials in HD">
    <meta name="twitter:description" content="Stream 1000+ Pakistani dramas free. ARY Digital, Geo TV, Hum TV — all in one app.">
    <meta name="twitter:image" content="<?= $domain ?>/og-image.png">

    <!-- App Linking -->
    <meta name="google-play-app" content="app-id=com.pakistanidrama.serial">
    <meta property="al:android:app_name" content="Pakistani Drama & Serials">
    <meta property="al:android:package" content="com.pakistanidrama.serial">

    <!-- Theme & Icons -->
    <meta name="theme-color" content="#D4AF37">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="format-detection" content="telephone=no">
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png">
    <link rel="icon" type="image/png" sizes="512x512" href="/favicon-512.png">

    <!-- Sitemap -->
    <link rel="sitemap" type="application/xml" href="<?= $domain ?>/sitemap.xml">

    <!-- Preconnect -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://play.google.com">

    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- JSON-LD: SoftwareApplication -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Pakistani Drama & Serials",
        "description": "Watch 1000+ Pakistani dramas and serials from ARY Digital, Geo TV, Hum TV in HD quality. Free streaming app for Android with daily new episodes.",
        "url": "<?= $domain ?>/",
        "applicationCategory": "EntertainmentApplication",
        "operatingSystem": "Android 7.0+",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.5",
            "ratingCount": "8500",
            "bestRating": "5",
            "worstRating": "1"
        },
        "author": {
            "@type": "Organization",
            "name": "Pakistani Drama & Serials"
        },
        "featureList": "HD Streaming, Daily New Episodes, Favorites Watchlist, Push Notifications, Fast Loading, Genre Browsing",
        "downloadUrl": "https://play.google.com/store/apps/details?id=com.pakistanidrama.serial",
        "installUrl": "https://play.google.com/store/apps/details?id=com.pakistanidrama.serial",
        "contentRating": "Everyone",
        "inLanguage": ["en", "ur"]
    }
    </script>

    <!-- JSON-LD: FAQPage -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "Is the Pakistani Drama app free to download?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, the Pakistani Drama & Serials app is completely free to download and use. Stream 1000+ Pakistani dramas from ARY Digital, Geo TV, Hum TV and more at no cost."
                }
            },
            {
                "@type": "Question",
                "name": "Which Pakistani TV channels are available in the app?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The app features dramas from all major Pakistani channels including ARY Digital, Geo TV, Hum TV, Express Entertainment, TV One, A-Plus Entertainment, and many more."
                }
            },
            {
                "@type": "Question",
                "name": "How often are new drama episodes added?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "New episodes are added daily. You will receive push notifications when new episodes of dramas you follow are available so you never miss an update."
                }
            },
            {
                "@type": "Question",
                "name": "What devices does the Pakistani Drama app support?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The app supports all Android devices running Android 7.0 (Nougat) and above. It is optimized for both phones and tablets."
                }
            },
            {
                "@type": "Question",
                "name": "Is the app safe to install?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Absolutely. The app is published on the official Google Play Store and verified by Google Play Protect. It contains no malware and requests only necessary permissions."
                }
            },
            {
                "@type": "Question",
                "name": "Can I save my favorite dramas in the app?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, you can bookmark any drama to your favorites list and build a personal watchlist. This makes it easy to resume watching from where you left off."
                }
            }
        ]
    }
    </script>

    <!-- JSON-LD: WebPage -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Pakistani Drama App - Download Free",
        "description": "Official download page for the #1 Pakistani drama streaming app. Watch dramas from ARY Digital, Geo TV, Hum TV free in HD.",
        "url": "<?= $domain ?>/",
        "datePublished": "2025-01-01",
        "dateModified": "<?= date('Y-m-d') ?>",
        "inLanguage": "en",
        "isPartOf": {
            "@type": "WebSite",
            "name": "Pakistani Drama & Serials",
            "url": "<?= $domain ?>"
        }
    }
    </script>

    <!-- JSON-LD: BreadcrumbList -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "<?= $domain ?>/"
            }
        ]
    }
    </script>

    <!-- JSON-LD: HowTo -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Download Pakistani Drama App",
        "description": "Download and install the Pakistani Drama & Serials app on your Android device in 3 simple steps.",
        "step": [
            {
                "@type": "HowToStep",
                "position": 1,
                "name": "Open Google Play Store",
                "text": "Open the Google Play Store app on your Android phone or tablet."
            },
            {
                "@type": "HowToStep",
                "position": 2,
                "name": "Search or tap Download",
                "text": "Search for 'Pakistani Drama & Serials' or tap the download button on this page to go directly to the app listing."
            },
            {
                "@type": "HowToStep",
                "position": 3,
                "name": "Install and enjoy",
                "text": "Tap Install, wait for the download to complete, then open the app and start watching your favorite Pakistani dramas in HD."
            }
        ]
    }
    </script>

    <style>
        :root {
            --gold: #D4AF37;
            --gold-dark: #A8841F;
            --gold-bright: #EBC66B;
            --gold-glow: rgba(212, 175, 55, 0.3);
            --bg: #000000;
            --surface: #0B0B0B;
            --surface-elevated: #1A1A1A;
            --surface-highest: #2A2A2A;
            --text: #FFFFFF;
            --text-muted: #B3B3B3;
            --text-subtle: #808080;
            --outline: #2A2A2A;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        html { scroll-behavior: smooth; overflow-x: hidden; }

        body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg);
            color: var(--text);
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
            font-size: 16px;
            line-height: 1.6;
        }

        /* ── NAV ── */
        .nav {
            position: fixed; top: 0; left: 0; right: 0; z-index: 100;
            padding: 16px 40px;
            display: flex; align-items: center; justify-content: space-between;
            transition: background 0.3s, backdrop-filter 0.3s;
        }
        .nav.scrolled {
            background: rgba(0,0,0,0.85);
            backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--outline);
        }
        .nav-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .nav-logo {
            width: 40px; height: 40px; border-radius: 10px;
            background: linear-gradient(135deg, var(--gold-bright), var(--gold-dark));
            display: flex; align-items: center; justify-content: center;
        }
        .nav-logo svg { width: 22px; height: 22px; fill: #000; }
        .nav-title { font-weight: 700; font-size: 18px; color: var(--text); letter-spacing: -0.3px; }
        .nav-title span { color: var(--gold); }
        .nav-links { display: flex; align-items: center; gap: 32px; }
        .nav-link { color: var(--text-muted); text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.3s; }
        .nav-link:hover { color: var(--gold); }
        .nav-download {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 10px 24px; background: var(--gold); color: #000;
            font-weight: 700; font-size: 14px; border-radius: 50px;
            text-decoration: none; transition: all 0.3s cubic-bezier(0.23,1,0.32,1);
        }
        .nav-download:hover { background: var(--gold-bright); transform: scale(1.05); box-shadow: 0 0 30px var(--gold-glow); }

        /* ── HERO ── */
        .hero {
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
            position: relative; padding: 120px 40px 80px; overflow: hidden;
        }
        .hero-bg { position: absolute; inset: 0; z-index: 0; }
        .hero-bg::before {
            content: ''; position: absolute; top: -50%; left: -20%; width: 70%; height: 120%;
            background: radial-gradient(ellipse, rgba(212,175,55,0.08) 0%, transparent 70%);
            animation: pulse-glow 6s ease-in-out infinite;
        }
        .hero-bg::after {
            content: ''; position: absolute; bottom: -30%; right: -20%; width: 60%; height: 100%;
            background: radial-gradient(ellipse, rgba(168,132,31,0.06) 0%, transparent 70%);
            animation: pulse-glow 8s ease-in-out infinite reverse;
        }
        @keyframes pulse-glow {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
        }
        .hero-grid {
            position: absolute; inset: 0;
            background-image: linear-gradient(rgba(212,175,55,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.03) 1px, transparent 1px);
            background-size: 60px 60px;
            mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
            -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
        }
        .hero-content {
            position: relative; z-index: 2; max-width: 1200px; width: 100%;
            display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center;
        }
        .hero-text { max-width: 560px; }
        .hero-badge {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 8px 16px; background: rgba(212,175,55,0.1);
            border: 1px solid rgba(212,175,55,0.2); border-radius: 50px;
            font-size: 13px; font-weight: 600; color: var(--gold-bright);
            margin-bottom: 28px; animation: fade-up 0.8s ease-out;
        }
        .badge-dot { width: 6px; height: 6px; background: var(--gold); border-radius: 50%; animation: blink 2s ease-in-out infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

        .hero h1 {
            font-size: clamp(40px, 5vw, 64px); font-weight: 800; line-height: 1.1;
            letter-spacing: -2px; margin-bottom: 24px; animation: fade-up 0.8s ease-out 0.1s both;
        }
        .hero h1 .gold {
            background: linear-gradient(135deg, var(--gold-bright), var(--gold));
            -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .hero-desc {
            font-size: 18px; line-height: 1.7; color: var(--text-muted);
            margin-bottom: 40px; max-width: 460px; animation: fade-up 0.8s ease-out 0.2s both;
        }
        .hero-actions { display: flex; align-items: center; gap: 16px; animation: fade-up 0.8s ease-out 0.3s both; }

        .btn-primary {
            display: inline-flex; align-items: center; gap: 10px;
            padding: 16px 36px; background: linear-gradient(135deg, var(--gold-bright), var(--gold));
            color: #000; font-weight: 700; font-size: 16px; border-radius: 16px;
            text-decoration: none; transition: all 0.4s cubic-bezier(0.23,1,0.32,1);
            border: none; cursor: pointer; min-height: 48px;
        }
        .btn-primary:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 20px 40px rgba(212,175,55,0.3); }
        .btn-primary svg { width: 20px; height: 20px; }

        .btn-secondary {
            display: inline-flex; align-items: center; gap: 10px;
            padding: 16px 28px; background: var(--surface-elevated); color: var(--text);
            font-weight: 600; font-size: 16px; border-radius: 16px;
            text-decoration: none; border: 1px solid var(--outline);
            transition: all 0.3s ease; min-height: 48px;
        }
        .btn-secondary:hover { background: var(--surface-highest); border-color: var(--gold); }

        .hero-stats { display: flex; gap: 40px; margin-top: 48px; animation: fade-up 0.8s ease-out 0.4s both; }
        .stat-item { display: flex; flex-direction: column; gap: 4px; }
        .stat-number {
            font-size: 28px; font-weight: 800;
            background: linear-gradient(135deg, var(--gold-bright), var(--gold));
            -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .stat-label { font-size: 13px; color: var(--text-subtle); font-weight: 500; }

        @keyframes fade-up {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* ── PHONE MOCKUP ── */
        .hero-visual {
            display: flex; justify-content: center;
            animation: float 6s ease-in-out infinite, fade-up 1s ease-out 0.3s both;
        }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }
        .phone-mockup {
            position: relative; width: 280px; height: 580px;
            background: var(--surface); border-radius: 40px;
            border: 3px solid var(--surface-highest);
            box-shadow: 0 0 0 1px rgba(212,175,55,0.1), 0 40px 80px rgba(0,0,0,0.5), 0 0 120px rgba(212,175,55,0.08);
            overflow: hidden;
        }
        .phone-notch {
            position: absolute; top: 0; left: 50%; transform: translateX(-50%);
            width: 120px; height: 28px; background: #000;
            border-radius: 0 0 18px 18px; z-index: 5;
        }
        .phone-screen { position: absolute; inset: 8px; border-radius: 34px; overflow: hidden; background: var(--bg); }
        .app-screen { width: 100%; height: 100%; position: relative; }
        .app-header { padding: 38px 16px 12px; display: flex; align-items: center; justify-content: space-between; }
        .app-logo-text { font-size: 14px; font-weight: 700; color: var(--gold); letter-spacing: 0.5px; }
        .app-search-icon { width: 18px; height: 18px; border: 2px solid var(--text-muted); border-radius: 50%; position: relative; }
        .app-search-icon::after {
            content: ''; position: absolute; bottom: -4px; right: -4px;
            width: 6px; height: 2px; background: var(--text-muted); transform: rotate(45deg);
        }
        .app-hero-card {
            margin: 8px 12px; height: 180px; border-radius: 16px;
            background: linear-gradient(135deg, #1a1200, #2a1f00);
            position: relative; overflow: hidden;
            display: flex; flex-direction: column; justify-content: flex-end; padding: 14px;
        }
        .app-hero-card::before {
            content: ''; position: absolute; top: 10px; right: 10px;
            width: 60px; height: 60px;
            background: radial-gradient(circle, rgba(212,175,55,0.3), transparent); border-radius: 50%;
        }
        .app-hero-shimmer {
            position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(212,175,55,0.05), transparent);
            animation: shimmer 3s infinite;
        }
        @keyframes shimmer { 0% { left: -100%; } 100% { left: 100%; } }
        .app-hero-title { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
        .app-hero-sub { font-size: 10px; color: var(--text-muted); }
        .app-hero-btn {
            margin-top: 8px; display: inline-flex; align-items: center; gap: 4px;
            padding: 6px 14px; background: var(--gold); color: #000;
            font-size: 10px; font-weight: 700; border-radius: 8px; width: fit-content;
        }
        .app-section-title { padding: 14px 14px 8px; font-size: 13px; font-weight: 700; color: var(--text); }
        .app-cards-row { display: flex; gap: 8px; padding: 0 14px; overflow: hidden; }
        .app-card { min-width: 80px; height: 110px; border-radius: 10px; position: relative; overflow: hidden; }
        .app-card:nth-child(1) { background: linear-gradient(180deg, #2d1f1f, #1a0f0f); }
        .app-card:nth-child(2) { background: linear-gradient(180deg, #1f2d1f, #0f1a0f); }
        .app-card:nth-child(3) { background: linear-gradient(180deg, #1f1f2d, #0f0f1a); }
        .app-card-title { position: absolute; bottom: 6px; left: 6px; right: 6px; font-size: 8px; font-weight: 600; color: var(--text); }
        .app-card-badge { position: absolute; top: 6px; left: 6px; padding: 2px 6px; background: var(--gold); color: #000; font-size: 7px; font-weight: 700; border-radius: 4px; }
        .app-bottom-nav {
            position: absolute; bottom: 0; left: 0; right: 0; height: 56px;
            background: rgba(0,0,0,0.9); backdrop-filter: blur(20px);
            display: flex; align-items: center; justify-content: space-around;
            border-top: 1px solid var(--outline);
        }
        .app-nav-item { display: flex; flex-direction: column; align-items: center; gap: 3px; }
        .app-nav-dot { width: 20px; height: 20px; border-radius: 6px; background: var(--surface-elevated); }
        .app-nav-dot.active { background: var(--gold); }
        .app-nav-label { font-size: 8px; color: var(--text-subtle); }
        .app-nav-label.active { color: var(--gold); }

        /* ── SECTIONS SHARED ── */
        .section-divider {
            position: relative;
        }
        .section-divider::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
            background: linear-gradient(90deg, transparent, var(--outline), transparent);
        }
        .section-center { text-align: center; max-width: 600px; margin: 0 auto 64px; }
        .section-label { font-size: 13px; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 3px; margin-bottom: 16px; }
        .section-title { font-size: clamp(32px, 4vw, 48px); font-weight: 800; letter-spacing: -1.5px; margin-bottom: 16px; }
        .section-desc { font-size: 16px; color: var(--text-muted); line-height: 1.7; }

        /* ── FEATURES ── */
        .features { padding: 120px 40px; }
        .features-grid { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .feature-card {
            padding: 36px 28px; background: var(--surface); border-radius: 20px;
            border: 1px solid var(--outline); transition: all 0.4s cubic-bezier(0.23,1,0.32,1);
            position: relative; overflow: hidden;
        }
        .feature-card::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
            background: linear-gradient(90deg, transparent, var(--gold), transparent);
            opacity: 0; transition: opacity 0.4s;
        }
        .feature-card:hover { border-color: rgba(212,175,55,0.3); transform: translateY(-6px); box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
        .feature-card:hover::before { opacity: 1; }
        .feature-icon {
            width: 52px; height: 52px; border-radius: 14px;
            background: rgba(212,175,55,0.1); display: flex; align-items: center;
            justify-content: center; margin-bottom: 20px; font-size: 24px;
        }
        .feature-title { font-size: 18px; font-weight: 700; margin-bottom: 10px; }
        .feature-desc { font-size: 14px; color: var(--text-muted); line-height: 1.6; }

        /* ── SCREENSHOTS ── */
        .screenshots { padding: 120px 40px; overflow: hidden; }
        .screenshots-track { display: flex; gap: 24px; max-width: 1200px; margin: 0 auto; justify-content: center; flex-wrap: wrap; }
        .screenshot-phone {
            width: 220px; height: 440px; background: var(--surface);
            border-radius: 32px; border: 2px solid var(--surface-highest);
            overflow: hidden; position: relative;
            transition: all 0.4s cubic-bezier(0.23,1,0.32,1);
            box-shadow: 0 20px 60px rgba(0,0,0,0.4);
        }
        .screenshot-phone:hover { transform: translateY(-10px) scale(1.02); box-shadow: 0 30px 80px rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.08); }
        .ss-notch { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 90px; height: 22px; background: #000; border-radius: 0 0 14px 14px; z-index: 5; }
        .ss-inner { position: absolute; inset: 6px; border-radius: 28px; overflow: hidden; background: var(--bg); }

        .ss-home .ss-bar { padding: 30px 12px 8px; font-size: 12px; font-weight: 700; color: var(--gold); }
        .ss-home .ss-hero-img { margin: 4px 10px; height: 130px; border-radius: 12px; background: linear-gradient(135deg, #2a1f00, #1a1200); position: relative; }
        .ss-home .ss-hero-img::after { content: 'Trending Now'; position: absolute; bottom: 10px; left: 10px; font-size: 11px; font-weight: 700; color: var(--text); }
        .ss-home .ss-row-title { padding: 10px 12px 6px; font-size: 10px; font-weight: 700; color: var(--text); }
        .ss-home .ss-row { display: flex; gap: 6px; padding: 0 12px; }
        .ss-home .ss-thumb { width: 58px; height: 78px; border-radius: 8px; flex-shrink: 0; }
        .ss-home .ss-thumb:nth-child(1) { background: linear-gradient(180deg, #3d2a1a, #1a1000); }
        .ss-home .ss-thumb:nth-child(2) { background: linear-gradient(180deg, #1a2a3d, #001a2a); }
        .ss-home .ss-thumb:nth-child(3) { background: linear-gradient(180deg, #2a1a3d, #1a001a); }

        .ss-player .ss-video {
            margin-top: 6px; height: 140px; background: linear-gradient(180deg, #1a1200, #000);
            position: relative; display: flex; align-items: center; justify-content: center;
        }
        .ss-player .ss-play-btn {
            width: 44px; height: 44px; border-radius: 50%;
            background: rgba(212,175,55,0.9); display: flex; align-items: center; justify-content: center;
        }
        .ss-player .ss-play-btn::after {
            content: ''; width: 0; height: 0; border-style: solid;
            border-width: 8px 0 8px 14px; border-color: transparent transparent transparent #000; margin-left: 3px;
        }
        .ss-player .ss-progress { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: var(--surface-highest); }
        .ss-player .ss-progress::after { content: ''; position: absolute; left: 0; top: 0; width: 45%; height: 100%; background: var(--gold); border-radius: 2px; }
        .ss-player .ss-ep-info { padding: 14px 12px; }
        .ss-player .ss-ep-title { font-size: 12px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
        .ss-player .ss-ep-meta { font-size: 9px; color: var(--text-subtle); }
        .ss-player .ss-ep-list { padding: 8px 12px; }
        .ss-player .ss-ep-item { display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 8px; background: var(--surface-elevated); margin-bottom: 6px; }
        .ss-player .ss-ep-thumb { width: 50px; height: 32px; border-radius: 4px; background: linear-gradient(135deg, #2a1f00, #1a1200); flex-shrink: 0; }
        .ss-player .ss-ep-name { font-size: 9px; font-weight: 600; color: var(--text-muted); }

        .ss-browse .ss-bar { padding: 30px 12px 8px; font-size: 12px; font-weight: 700; color: var(--text); }
        .ss-browse .ss-chips { display: flex; gap: 4px; padding: 4px 12px; overflow: hidden; }
        .ss-browse .ss-chip { padding: 5px 10px; border-radius: 8px; font-size: 8px; font-weight: 600; white-space: nowrap; border: 1px solid var(--outline); color: var(--text-muted); }
        .ss-browse .ss-chip.active { background: var(--gold); color: #000; border-color: var(--gold); }
        .ss-browse .ss-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 10px 12px; }
        .ss-browse .ss-grid-item { height: 100px; border-radius: 10px; position: relative; }
        .ss-browse .ss-grid-item:nth-child(1) { background: linear-gradient(180deg, #2d1f1f, #1a0e0e); }
        .ss-browse .ss-grid-item:nth-child(2) { background: linear-gradient(180deg, #1f2d1f, #0e1a0e); }
        .ss-browse .ss-grid-item:nth-child(3) { background: linear-gradient(180deg, #1f1f2d, #0e0e1a); }
        .ss-browse .ss-grid-item:nth-child(4) { background: linear-gradient(180deg, #2d2d1f, #1a1a0e); }
        .ss-browse .ss-grid-label { position: absolute; bottom: 6px; left: 6px; font-size: 8px; font-weight: 600; color: var(--text); }

        .ss-favs .ss-bar { padding: 30px 12px 8px; font-size: 12px; font-weight: 700; color: var(--text); }
        .ss-favs .ss-fav-item { display: flex; gap: 10px; padding: 8px 12px; align-items: center; }
        .ss-favs .ss-fav-poster { width: 56px; height: 75px; border-radius: 8px; flex-shrink: 0; }
        .ss-favs .ss-fav-info { flex: 1; }
        .ss-favs .ss-fav-name { font-size: 11px; font-weight: 700; color: var(--text); margin-bottom: 3px; }
        .ss-favs .ss-fav-eps { font-size: 8px; color: var(--text-subtle); }
        .ss-favs .ss-fav-heart { font-size: 14px; color: var(--gold); }
        .ss-favs .ss-fav-item:nth-child(2) .ss-fav-poster { background: linear-gradient(135deg, #3d2a1a, #1a1000); }
        .ss-favs .ss-fav-item:nth-child(3) .ss-fav-poster { background: linear-gradient(135deg, #1a2a3d, #001a2a); }
        .ss-favs .ss-fav-item:nth-child(4) .ss-fav-poster { background: linear-gradient(135deg, #2a1a3d, #1a001a); }
        .ss-favs .ss-fav-item:nth-child(5) .ss-fav-poster { background: linear-gradient(135deg, #2a3d1a, #1a2a00); }
        .ss-favs .ss-fav-item:nth-child(6) .ss-fav-poster { background: linear-gradient(135deg, #3d1a2a, #2a001a); }

        /* ── HOW TO DOWNLOAD ── */
        .howto { padding: 120px 40px; }
        .howto-steps { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 0; }
        .howto-step {
            display: flex; gap: 24px; align-items: flex-start; padding: 32px 0;
            border-bottom: 1px solid var(--outline);
        }
        .howto-step:last-child { border-bottom: none; }
        .step-num {
            flex-shrink: 0; width: 48px; height: 48px; border-radius: 14px;
            background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.2);
            display: flex; align-items: center; justify-content: center;
            font-size: 20px; font-weight: 800; color: var(--gold);
        }
        .step-content h3 { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
        .step-content p { font-size: 15px; color: var(--text-muted); line-height: 1.6; }

        /* ── POPULAR DRAMAS ── */
        .popular { padding: 120px 40px; }
        .dramas-grid { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
        .drama-chip {
            padding: 16px 20px; background: var(--surface); border: 1px solid var(--outline);
            border-radius: 14px; display: flex; align-items: center; gap: 12px;
            transition: all 0.3s ease;
        }
        .drama-chip:hover { border-color: rgba(212,175,55,0.3); transform: translateY(-2px); }
        .drama-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--gold); flex-shrink: 0; }
        .drama-name { font-size: 14px; font-weight: 600; }
        .drama-channel { font-size: 11px; color: var(--text-subtle); margin-top: 2px; }

        /* ── REVIEWS ── */
        .reviews { padding: 120px 40px; }
        .reviews-grid { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .review-card {
            padding: 28px; background: var(--surface); border: 1px solid var(--outline);
            border-radius: 20px; position: relative;
        }
        .review-stars { color: var(--gold); font-size: 14px; margin-bottom: 12px; letter-spacing: 2px; }
        .review-text { font-size: 14px; color: var(--text-muted); line-height: 1.6; margin-bottom: 16px; font-style: italic; }
        .review-author { font-size: 13px; font-weight: 600; color: var(--text); }
        .review-source { font-size: 11px; color: var(--text-subtle); }

        /* ── FAQ ── */
        .faq { padding: 120px 40px; }
        .faq-list { max-width: 800px; margin: 0 auto; }
        .faq-item {
            border-bottom: 1px solid var(--outline); overflow: hidden;
        }
        .faq-item summary {
            padding: 20px 0; font-size: 16px; font-weight: 600; cursor: pointer;
            list-style: none; display: flex; align-items: center; justify-content: space-between;
            color: var(--text); transition: color 0.3s; user-select: none;
        }
        .faq-item summary::-webkit-details-marker { display: none; }
        .faq-item summary::after {
            content: '+'; font-size: 24px; font-weight: 300; color: var(--gold);
            transition: transform 0.3s;
        }
        .faq-item[open] summary::after { content: '-'; }
        .faq-item summary:hover { color: var(--gold); }
        .faq-answer {
            padding: 0 0 20px; font-size: 15px; color: var(--text-muted); line-height: 1.7;
        }

        /* ── CTA ── */
        .cta { padding: 120px 40px; }
        .cta-box {
            max-width: 900px; margin: 0 auto; text-align: center;
            padding: 80px 60px; background: var(--surface);
            border-radius: 32px; border: 1px solid var(--outline);
            position: relative; overflow: hidden;
        }
        .cta-box::before {
            content: ''; position: absolute; top: -50%; left: 50%; transform: translateX(-50%);
            width: 400px; height: 400px;
            background: radial-gradient(circle, rgba(212,175,55,0.08), transparent 60%);
        }
        .cta-box .section-title, .cta-box .section-desc, .cta-buttons { position: relative; z-index: 2; }
        .cta-box .section-desc { margin-bottom: 36px; }
        .cta-buttons { display: flex; justify-content: center; gap: 16px; }
        .playstore-btn {
            display: inline-flex; align-items: center; gap: 14px;
            padding: 14px 32px; background: linear-gradient(135deg, var(--gold-bright), var(--gold));
            color: #000; font-weight: 700; font-size: 16px; border-radius: 16px;
            text-decoration: none; transition: all 0.4s cubic-bezier(0.23,1,0.32,1);
            min-height: 48px;
        }
        .playstore-btn:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 20px 40px rgba(212,175,55,0.3); }
        .playstore-btn svg { width: 28px; height: 28px; }
        .playstore-text { display: flex; flex-direction: column; text-align: left; }
        .playstore-text small { font-size: 10px; font-weight: 500; opacity: 0.7; }
        .playstore-text strong { font-size: 16px; }

        /* ── FOOTER ── */
        .footer { padding: 40px; border-top: 1px solid var(--outline); }
        .footer-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
        .footer p { font-size: 13px; color: var(--text-subtle); }
        .footer-links { display: flex; gap: 24px; }
        .footer-links a { font-size: 13px; color: var(--text-subtle); text-decoration: none; transition: color 0.3s; }
        .footer-links a:hover { color: var(--gold); }

        /* ── HAMBURGER MENU ── */
        .menu-toggle {
            display: none; width: 44px; height: 44px; background: none; border: none;
            cursor: pointer; position: relative; z-index: 200;
            flex-direction: column; align-items: center; justify-content: center; gap: 5px;
        }
        .menu-toggle span {
            display: block; width: 22px; height: 2px; background: var(--text);
            border-radius: 2px; transition: all 0.3s ease;
        }
        .menu-toggle.active span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
        .menu-toggle.active span:nth-child(2) { opacity: 0; }
        .menu-toggle.active span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

        .mobile-overlay {
            display: none; position: fixed; inset: 0; z-index: 150;
            background: rgba(0,0,0,0.95); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
            flex-direction: column; align-items: center; justify-content: center; gap: 0;
            opacity: 0; transition: opacity 0.3s ease;
        }
        .mobile-overlay.open { display: flex; opacity: 1; }
        .mobile-overlay a {
            display: block; padding: 18px 40px; font-size: 20px; font-weight: 600;
            color: var(--text); text-decoration: none; text-align: center;
            transition: color 0.3s; width: 100%;
        }
        .mobile-overlay a:hover, .mobile-overlay a:active { color: var(--gold); }
        .mobile-overlay .mobile-cta {
            margin-top: 24px; padding: 16px 40px;
            background: linear-gradient(135deg, var(--gold-bright), var(--gold));
            color: #000; font-weight: 700; font-size: 16px; border-radius: 16px;
            width: auto;
        }

        /* ── RESPONSIVE: TABLET ── */
        @media (max-width: 900px) {
            .hero-content { grid-template-columns: 1fr; text-align: center; gap: 40px; }
            .hero-text { max-width: 100%; margin: 0 auto; }
            .hero-desc { margin: 0 auto 32px; }
            .hero-actions { justify-content: center; flex-wrap: wrap; }
            .hero-stats { justify-content: center; }
            .features-grid { grid-template-columns: repeat(2, 1fr); max-width: 600px; margin: 0 auto; }
            .reviews-grid { grid-template-columns: 1fr; max-width: 500px; }
            .screenshots-track { gap: 16px; }
            .screenshot-phone { width: 180px; height: 360px; }
            .nav { padding: 12px 20px; }
            .nav-links { display: none; }
            .menu-toggle { display: flex; }
            .hero, .features, .screenshots, .howto, .popular, .reviews, .faq, .cta { padding-left: 20px; padding-right: 20px; }
            .cta-box { padding: 48px 24px; }
            .cta-buttons { flex-direction: column; align-items: center; }
            .dramas-grid { grid-template-columns: 1fr 1fr; }
            .footer-inner { flex-direction: column; text-align: center; }
            .howto-step { gap: 16px; }
        }

        /* ── RESPONSIVE: MOBILE ── */
        @media (max-width: 600px) {
            .hero { padding: 100px 16px 60px; min-height: auto; }
            .hero h1 { font-size: 32px; letter-spacing: -1px; }
            .hero-desc { font-size: 15px; }
            .hero-badge { font-size: 12px; margin-bottom: 20px; }
            .hero-stats { gap: 20px; margin-top: 32px; }
            .stat-number { font-size: 22px; }
            .stat-label { font-size: 11px; }
            .hero-visual { margin-top: 0; }
            .phone-mockup { width: 220px; height: 460px; border-radius: 32px; }
            .phone-notch { width: 100px; height: 24px; border-radius: 0 0 14px 14px; }
            .phone-screen { inset: 6px; border-radius: 28px; }

            .nav { padding: 10px 16px; }
            .nav-download { display: none; }
            .nav-logo { width: 36px; height: 36px; border-radius: 8px; }
            .nav-logo svg { width: 18px; height: 18px; }
            .nav-title { font-size: 16px; }

            .btn-primary { padding: 14px 28px; font-size: 15px; border-radius: 14px; width: 100%; justify-content: center; }
            .btn-secondary { display: none; }
            .hero-actions { flex-direction: column; width: 100%; max-width: 320px; margin: 0 auto; }

            .features, .screenshots, .howto, .popular, .reviews, .faq, .cta { padding-top: 80px; padding-bottom: 80px; }
            .section-center { margin-bottom: 40px; }
            .section-title { font-size: 26px; letter-spacing: -1px; }
            .section-label { font-size: 11px; letter-spacing: 2px; margin-bottom: 12px; }
            .section-desc { font-size: 14px; }

            .features-grid { grid-template-columns: 1fr; max-width: 100%; gap: 16px; }
            .feature-card { padding: 24px 20px; border-radius: 16px; }
            .feature-icon { width: 44px; height: 44px; border-radius: 12px; font-size: 20px; margin-bottom: 14px; }
            .feature-title { font-size: 16px; }
            .feature-desc { font-size: 13px; }

            .screenshots-track { flex-wrap: nowrap; overflow-x: auto; padding: 0 16px; justify-content: flex-start; -webkit-overflow-scrolling: touch; scroll-snap-type: x mandatory; scrollbar-width: none; }
            .screenshots-track::-webkit-scrollbar { display: none; }
            .screenshot-phone { width: 160px; height: 320px; scroll-snap-align: center; flex-shrink: 0; border-radius: 24px; }
            .ss-notch { width: 70px; height: 18px; border-radius: 0 0 10px 10px; }
            .ss-inner { inset: 4px; border-radius: 22px; }

            .howto-steps { gap: 0; }
            .howto-step { padding: 20px 0; gap: 14px; }
            .step-num { width: 40px; height: 40px; border-radius: 12px; font-size: 16px; }
            .step-content h3 { font-size: 16px; }
            .step-content p { font-size: 14px; }

            .dramas-grid { grid-template-columns: 1fr; gap: 10px; }
            .drama-chip { padding: 14px 16px; border-radius: 12px; }
            .drama-name { font-size: 13px; }

            .reviews-grid { grid-template-columns: 1fr; gap: 16px; }
            .review-card { padding: 22px 18px; border-radius: 16px; }
            .review-text { font-size: 13px; }

            .faq-item summary { font-size: 14px; padding: 16px 0; }
            .faq-answer { font-size: 13px; padding-bottom: 16px; }

            .cta-box { padding: 40px 20px; border-radius: 24px; }
            .cta-box .section-title { font-size: 24px; }
            .playstore-btn { padding: 14px 24px; font-size: 14px; border-radius: 14px; }
            .playstore-btn svg { width: 24px; height: 24px; }

            .footer { padding: 24px 16px; }
            .footer p { font-size: 12px; }
            .footer-links { gap: 16px; }
            .footer-links a { font-size: 12px; }
        }

        /* ── RESPONSIVE: VERY SMALL ── */
        @media (max-width: 380px) {
            .hero h1 { font-size: 26px; }
            .hero-stats { flex-direction: column; gap: 12px; align-items: center; }
            .stat-item { flex-direction: row; gap: 8px; align-items: baseline; }
            .phone-mockup { width: 200px; height: 420px; }
            .screenshot-phone { width: 140px; height: 280px; }
            .section-title { font-size: 22px; }
            .cta-box .section-title { font-size: 20px; }
        }

        /* ── SCROLL ANIMATIONS ── */
        .reveal { opacity: 0; transform: translateY(40px); transition: all 0.8s cubic-bezier(0.23,1,0.32,1); }
        .reveal.visible { opacity: 1; transform: translateY(0); }

        /* ── PARTICLES ── */
        .particles { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
        .particle {
            position: absolute; width: 2px; height: 2px;
            background: var(--gold); border-radius: 50%; opacity: 0;
            animation: particle-float linear infinite;
        }
        @keyframes particle-float {
            0% { opacity: 0; transform: translateY(100vh) scale(0); }
            10% { opacity: 0.6; } 90% { opacity: 0.6; }
            100% { opacity: 0; transform: translateY(-10vh) scale(1); }
        }
    </style>
</head>
<body>

<!-- Particles -->
<div class="particles" aria-hidden="true">
    <?php for ($i = 0; $i < 20; $i++): ?>
    <div class="particle" style="left:<?= rand(0,100) ?>%;animation-duration:<?= rand(8,20) ?>s;animation-delay:<?= rand(0,10) ?>s;width:<?= rand(1,3) ?>px;height:<?= rand(1,3) ?>px;"></div>
    <?php endfor; ?>
</div>

<!-- Navigation -->
<header>
<nav class="nav" id="nav" aria-label="Main navigation">
    <a href="<?= $domain ?>/" class="nav-brand" aria-label="Pakistani Dramas - Home">
        <div class="nav-logo" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <span class="nav-title">Pakistani <span>Dramas</span></span>
    </a>
    <div class="nav-links">
        <a href="#features" class="nav-link">Features</a>
        <a href="#screenshots" class="nav-link">Preview</a>
        <a href="#dramas" class="nav-link">Dramas</a>
        <a href="#faq" class="nav-link">FAQ</a>
    </div>
    <div style="display:flex;align-items:center;gap:12px;">
        <a href="<?= $playStoreUrl ?>" class="nav-download" target="_blank" rel="noopener noreferrer" aria-label="Download Pakistani Drama App on Google Play">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download App
        </a>
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
            <span></span><span></span><span></span>
        </button>
    </div>
</nav>
</header>

<!-- Mobile Menu Overlay -->
<div class="mobile-overlay" id="mobileMenu">
    <a href="#features" class="mobile-link">Features</a>
    <a href="#screenshots" class="mobile-link">Preview</a>
    <a href="#dramas" class="mobile-link">Dramas</a>
    <a href="#faq" class="mobile-link">FAQ</a>
    <a href="<?= $playStoreUrl ?>" class="mobile-cta" target="_blank" rel="noopener noreferrer">Download App</a>
</div>

<main>

<!-- Hero Section -->
<section class="hero" aria-labelledby="hero-heading">
    <div class="hero-bg" aria-hidden="true"><div class="hero-grid"></div></div>
    <div class="hero-content">
        <div class="hero-text">
            <div class="hero-badge" aria-hidden="true">
                <span class="badge-dot"></span>
                Now Streaming
            </div>
            <h1 id="hero-heading">Watch Free <span class="gold">Pakistani Dramas</span> & Serials in HD</h1>
            <p class="hero-desc">Stream 1000+ Pakistani dramas from ARY Digital, Geo TV, and Hum TV. HD quality, daily new episodes, and a beautiful interface — all in one free app.</p>
            <div class="hero-actions">
                <a href="<?= $playStoreUrl ?>" class="btn-primary" target="_blank" rel="noopener noreferrer" aria-label="Download Pakistani Drama App free on Google Play Store">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 0 1 0 1.38l-2.302 2.302L15.396 12l2.302-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/></svg>
                    Download Free
                </a>
                <a href="#features" class="btn-secondary">Learn More</a>
            </div>
            <div class="hero-stats">
                <div class="stat-item">
                    <span class="stat-number">1000+</span>
                    <span class="stat-label">Drama Episodes</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">HD</span>
                    <span class="stat-label">Video Quality</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">Free</span>
                    <span class="stat-label">To Download</span>
                </div>
            </div>
        </div>
        <div class="hero-visual" aria-hidden="true">
            <div class="phone-mockup">
                <div class="phone-notch"></div>
                <div class="phone-screen">
                    <div class="app-screen">
                        <div class="app-header">
                            <span class="app-logo-text">PAKISTANI DRAMAS</span>
                            <div class="app-search-icon"></div>
                        </div>
                        <div class="app-hero-card">
                            <div class="app-hero-shimmer"></div>
                            <div class="app-hero-title">Tere Bin</div>
                            <div class="app-hero-sub">Season 1 &bull; 48 Episodes</div>
                            <div class="app-hero-btn">&#9654; Watch Now</div>
                        </div>
                        <div class="app-section-title">Popular Dramas</div>
                        <div class="app-cards-row">
                            <div class="app-card"><div class="app-card-badge">NEW</div><div class="app-card-title">Khaani</div></div>
                            <div class="app-card"><div class="app-card-title">Humsafar</div></div>
                            <div class="app-card"><div class="app-card-badge">HIT</div><div class="app-card-title">Mere Paas</div></div>
                        </div>
                        <div class="app-bottom-nav">
                            <div class="app-nav-item"><div class="app-nav-dot active"></div><span class="app-nav-label active">Home</span></div>
                            <div class="app-nav-item"><div class="app-nav-dot"></div><span class="app-nav-label">Browse</span></div>
                            <div class="app-nav-item"><div class="app-nav-dot"></div><span class="app-nav-label">Favorites</span></div>
                            <div class="app-nav-item"><div class="app-nav-dot"></div><span class="app-nav-label">Settings</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Features -->
<section class="features section-divider" id="features" aria-labelledby="features-heading">
    <div class="section-center reveal">
        <div class="section-label">Features</div>
        <h2 id="features-heading" class="section-title">Why Choose Our Pakistani Drama App?</h2>
        <p class="section-desc">Everything a drama lover needs — built into one beautiful, fast app</p>
    </div>
    <div class="features-grid">
        <article class="feature-card reveal">
            <div class="feature-icon" aria-hidden="true">&#127916;</div>
            <h3 class="feature-title">HD Streaming</h3>
            <p class="feature-desc">Crystal clear video quality with adaptive streaming. Watch Pakistani dramas in HD even on slower connections.</p>
        </article>
        <article class="feature-card reveal">
            <div class="feature-icon" aria-hidden="true">&#9889;</div>
            <h3 class="feature-title">Fast Loading</h3>
            <p class="feature-desc">Optimized player that starts instantly. No buffering, no waiting — just press play and enjoy your favorite serials.</p>
        </article>
        <article class="feature-card reveal">
            <div class="feature-icon" aria-hidden="true">&#128276;</div>
            <h3 class="feature-title">New Episodes Daily</h3>
            <p class="feature-desc">Get push notifications when your favorite drama drops a new episode. Never miss an update from ARY, Geo, or Hum TV.</p>
        </article>
        <article class="feature-card reveal">
            <div class="feature-icon" aria-hidden="true">&#10084;</div>
            <h3 class="feature-title">Save Favorites</h3>
            <p class="feature-desc">Bookmark your favorite dramas and build a personal watchlist. Resume watching from where you left off anytime.</p>
        </article>
        <article class="feature-card reveal">
            <div class="feature-icon" aria-hidden="true">&#128218;</div>
            <h3 class="feature-title">1000+ Dramas</h3>
            <p class="feature-desc">Romantic, family, thriller, emotional — every genre of Pakistani drama from every major channel in one massive library.</p>
        </article>
        <article class="feature-card reveal">
            <div class="feature-icon" aria-hidden="true">&#127760;</div>
            <h3 class="feature-title">Watch Anywhere</h3>
            <p class="feature-desc">Stream Pakistani dramas on the go. Designed for mobile with a beautiful dark interface and smooth navigation.</p>
        </article>
    </div>
</section>

<!-- App Screenshots -->
<section class="screenshots section-divider" id="screenshots" aria-labelledby="screenshots-heading">
    <div class="section-center reveal">
        <div class="section-label">App Preview</div>
        <h2 id="screenshots-heading" class="section-title">Beautiful by Design</h2>
        <p class="section-desc">A sleek dark interface crafted for the ultimate drama viewing experience</p>
    </div>
    <div class="screenshots-track reveal">
        <div class="screenshot-phone" role="img" aria-label="Home screen showing trending Pakistani dramas with cover art">
            <div class="ss-notch"></div>
            <div class="ss-inner ss-home">
                <div class="ss-bar">Home</div>
                <div class="ss-hero-img"></div>
                <div class="ss-row-title">Continue Watching</div>
                <div class="ss-row"><div class="ss-thumb"></div><div class="ss-thumb"></div><div class="ss-thumb"></div></div>
                <div class="ss-row-title">Top Rated</div>
                <div class="ss-row"><div class="ss-thumb"></div><div class="ss-thumb"></div><div class="ss-thumb"></div></div>
            </div>
        </div>
        <div class="screenshot-phone" role="img" aria-label="Video player playing Tere Bin drama episode in HD quality">
            <div class="ss-notch"></div>
            <div class="ss-inner ss-player">
                <div class="ss-video"><div class="ss-play-btn"></div><div class="ss-progress"></div></div>
                <div class="ss-ep-info"><div class="ss-ep-title">Tere Bin - Episode 24</div><div class="ss-ep-meta">Season 1 &bull; 42 min &bull; HD</div></div>
                <div class="ss-ep-list">
                    <div class="ss-ep-item"><div class="ss-ep-thumb"></div><span class="ss-ep-name">Episode 25</span></div>
                    <div class="ss-ep-item"><div class="ss-ep-thumb"></div><span class="ss-ep-name">Episode 26</span></div>
                    <div class="ss-ep-item"><div class="ss-ep-thumb"></div><span class="ss-ep-name">Episode 27</span></div>
                </div>
            </div>
        </div>
        <div class="screenshot-phone" role="img" aria-label="Browse screen with genre filters for Pakistani dramas">
            <div class="ss-notch"></div>
            <div class="ss-inner ss-browse">
                <div class="ss-bar">Browse</div>
                <div class="ss-chips"><span class="ss-chip active">All</span><span class="ss-chip">Romantic</span><span class="ss-chip">Family</span><span class="ss-chip">Thriller</span></div>
                <div class="ss-grid">
                    <div class="ss-grid-item"><span class="ss-grid-label">Khaani</span></div>
                    <div class="ss-grid-item"><span class="ss-grid-label">Humsafar</span></div>
                    <div class="ss-grid-item"><span class="ss-grid-label">Zindagi Gulzar</span></div>
                    <div class="ss-grid-item"><span class="ss-grid-label">Mere Paas</span></div>
                </div>
            </div>
        </div>
        <div class="screenshot-phone" role="img" aria-label="Favorites watchlist showing saved Pakistani dramas">
            <div class="ss-notch"></div>
            <div class="ss-inner ss-favs">
                <div class="ss-bar">My Favorites</div>
                <?php
                $favs = [
                    ['Tere Bin', '48 Episodes'],
                    ['Khaani', '30 Episodes'],
                    ['Humsafar', '23 Episodes'],
                    ['Zindagi Gulzar Hai', '26 Episodes'],
                    ['Mere Paas Tum Ho', '24 Episodes'],
                ];
                foreach ($favs as $f): ?>
                <div class="ss-fav-item">
                    <div class="ss-fav-poster"></div>
                    <div class="ss-fav-info"><div class="ss-fav-name"><?= $f[0] ?></div><div class="ss-fav-eps"><?= $f[1] ?></div></div>
                    <span class="ss-fav-heart">&#9829;</span>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
</section>

<!-- How to Download -->
<section class="howto section-divider" id="howto" aria-labelledby="howto-heading">
    <div class="section-center reveal">
        <div class="section-label">Get Started</div>
        <h2 id="howto-heading" class="section-title">How to Download Pakistani Drama App</h2>
        <p class="section-desc">Start streaming your favorite dramas in under a minute</p>
    </div>
    <ol class="howto-steps reveal">
        <li class="howto-step">
            <span class="step-num" aria-hidden="true">1</span>
            <div class="step-content">
                <h3>Open Google Play Store</h3>
                <p>Open the Google Play Store app on your Android phone or tablet. The app works on Android 7.0 and above.</p>
            </div>
        </li>
        <li class="howto-step">
            <span class="step-num" aria-hidden="true">2</span>
            <div class="step-content">
                <h3>Search or Tap Download</h3>
                <p>Search for "Pakistani Drama & Serials" in the Play Store, or tap the download button on this page to go directly to the app listing.</p>
            </div>
        </li>
        <li class="howto-step">
            <span class="step-num" aria-hidden="true">3</span>
            <div class="step-content">
                <h3>Install and Start Watching</h3>
                <p>Tap Install, wait for the download to complete, then open the app. Browse the collection and start watching Pakistani dramas in HD — completely free!</p>
            </div>
        </li>
    </ol>
</section>

<!-- Popular Dramas -->
<section class="popular section-divider" id="dramas" aria-labelledby="popular-heading">
    <div class="section-center reveal">
        <div class="section-label">Now Available</div>
        <h2 id="popular-heading" class="section-title">Popular Pakistani Dramas</h2>
        <p class="section-desc">Watch all your favorite dramas from top Pakistani TV channels</p>
    </div>
    <div class="dramas-grid reveal">
        <?php
        $dramas = [
            ['Tere Bin', 'ARY Digital'],
            ['Khaie', 'Geo TV'],
            ['Kabhi Main Kabhi Tum', 'ARY Digital'],
            ['Humsafar', 'Hum TV'],
            ['Khaani', 'Geo TV'],
            ['Mere Paas Tum Ho', 'ARY Digital'],
            ['Zindagi Gulzar Hai', 'Hum TV'],
            ['Gentleman', 'Green TV'],
            ['Ishqiya', 'ARY Digital'],
            ['Parizaad', 'Hum TV'],
            ['Rang Mahal', 'Geo TV'],
            ['Dunk', 'ARY Digital'],
        ];
        foreach ($dramas as $d): ?>
        <div class="drama-chip">
            <span class="drama-dot" aria-hidden="true"></span>
            <div>
                <div class="drama-name"><?= $d[0] ?></div>
                <div class="drama-channel"><?= $d[1] ?></div>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
</section>

<!-- User Reviews -->
<section class="reviews section-divider" aria-labelledby="reviews-heading">
    <div class="section-center reveal">
        <div class="section-label">Reviews</div>
        <h2 id="reviews-heading" class="section-title">What Users Say</h2>
        <p class="section-desc">Trusted by drama lovers across the world</p>
    </div>
    <div class="reviews-grid reveal">
        <?php
        $reviews = [
            ['Best app for Pakistani dramas! I watch Tere Bin and Khaie every day. HD quality is amazing.', 'Ayesha K.', 'Google Play Review'],
            ['Finally an app that has all dramas in one place. No more searching on different websites. Love it!', 'Faizan A.', 'Google Play Review'],
            ['Very smooth and fast. New episodes are added quickly. The dark theme looks beautiful on my phone.', 'Sara M.', 'Google Play Review'],
        ];
        foreach ($reviews as $r): ?>
        <blockquote class="review-card">
            <div class="review-stars" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p class="review-text">"<?= $r[0] ?>"</p>
            <cite>
                <div class="review-author"><?= $r[1] ?></div>
                <div class="review-source"><?= $r[2] ?></div>
            </cite>
        </blockquote>
        <?php endforeach; ?>
    </div>
</section>

<!-- FAQ -->
<section class="faq section-divider" id="faq" aria-labelledby="faq-heading">
    <div class="section-center reveal">
        <div class="section-label">FAQ</div>
        <h2 id="faq-heading" class="section-title">Frequently Asked Questions</h2>
        <p class="section-desc">Everything you need to know about the Pakistani Drama app</p>
    </div>
    <div class="faq-list reveal">
        <?php
        $faqs = [
            ['Is the Pakistani Drama app free to download?', 'Yes, the Pakistani Drama & Serials app is completely free to download and use. Stream 1000+ Pakistani dramas from ARY Digital, Geo TV, Hum TV and more at no cost. There are no hidden charges or subscription fees.'],
            ['Which Pakistani TV channels are available in the app?', 'The app features dramas from all major Pakistani channels including ARY Digital, Geo TV, Hum TV, Express Entertainment, TV One, A-Plus Entertainment, and many more. We cover all popular channels so you never miss a show.'],
            ['How often are new drama episodes added?', 'New episodes are added daily, usually within hours of their original TV broadcast. You will receive push notifications when new episodes of dramas you follow are available, so you never miss an update.'],
            ['What devices does the Pakistani Drama app support?', 'The app supports all Android devices running Android 7.0 (Nougat) and above. It is optimized for both phones and tablets, providing the best viewing experience regardless of screen size.'],
            ['Is the app safe to install?', 'Absolutely. The app is published on the official Google Play Store and verified by Google Play Protect. It contains no malware, requests only necessary permissions, and your data is kept secure.'],
            ['Can I save my favorite dramas in the app?', 'Yes! You can bookmark any drama to your favorites list and build a personal watchlist. This makes it easy to keep track of what you are watching and resume from where you left off anytime.'],
        ];
        foreach ($faqs as $faq): ?>
        <details class="faq-item">
            <summary><?= $faq[0] ?></summary>
            <div class="faq-answer"><?= $faq[1] ?></div>
        </details>
        <?php endforeach; ?>
    </div>
</section>

<!-- CTA -->
<section class="cta" aria-labelledby="cta-heading">
    <div class="cta-box reveal">
        <h2 id="cta-heading" class="section-title">Start Watching Pakistani Dramas Today</h2>
        <p class="section-desc">Download the free app and dive into the world of Pakistani dramas. 1000+ episodes from ARY Digital, Geo TV, Hum TV and more — all in HD.</p>
        <div class="cta-buttons">
            <a href="<?= $playStoreUrl ?>" class="playstore-btn" target="_blank" rel="noopener noreferrer" aria-label="Get Pakistani Drama App on Google Play Store">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 0 1 0 1.38l-2.302 2.302L15.396 12l2.302-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/></svg>
                <span class="playstore-text">
                    <small>GET IT ON</small>
                    <strong>Google Play</strong>
                </span>
            </a>
        </div>
    </div>
</section>

</main>

<!-- Footer -->
<footer class="footer">
    <div class="footer-inner">
        <p>&copy; <?= $year ?> <?= $appName ?>. All rights reserved.</p>
        <nav class="footer-links" aria-label="Footer navigation">
            <a href="<?= $playStoreUrl ?>" target="_blank" rel="noopener noreferrer">Google Play</a>
            <a href="mailto:support@animekill.com">Contact</a>
        </nav>
    </div>
</footer>

<script>
    // Nav scroll effect
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });

    // Hamburger menu
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        mobileMenu.classList.toggle('open');
        document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });

    // Close mobile menu on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            mobileMenu.classList.remove('open');
            document.body.style.overflow = '';
        });
    });

    // Scroll reveal
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('visible'), i * 100);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    reveals.forEach(el => observer.observe(el));

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
</script>

</body>
</html>
