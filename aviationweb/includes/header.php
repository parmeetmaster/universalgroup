<?php require_once __DIR__ . '/config.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="<?php echo htmlspecialchars($page_meta['description'] ?? SITE_TAGLINE); ?>">

    <title><?php echo htmlspecialchars(($page_meta['title'] ?? SITE_NAME) . ' - ' . SITE_TAGLINE); ?></title>

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="<?php echo htmlspecialchars(SITE_NAME); ?>">
    <meta property="og:title" content="<?php echo htmlspecialchars($page_meta['title'] ?? SITE_NAME); ?>">
    <meta property="og:description" content="<?php echo htmlspecialchars($page_meta['description'] ?? SITE_TAGLINE); ?>">
    <?php if (!empty($page_meta['image'])): ?>
    <meta property="og:image" content="<?php echo htmlspecialchars($page_meta['image']); ?>">
    <?php endif; ?>
    <meta property="og:url" content="<?php echo htmlspecialchars($page_meta['url'] ?? SITE_URL); ?>">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?php echo htmlspecialchars($page_meta['title'] ?? SITE_NAME); ?>">
    <meta name="twitter:description" content="<?php echo htmlspecialchars($page_meta['description'] ?? SITE_TAGLINE); ?>">
    <?php if (!empty($page_meta['image'])): ?>
    <meta name="twitter:image" content="<?php echo htmlspecialchars($page_meta['image']); ?>">
    <?php endif; ?>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer">

    <!-- Stylesheet -->
    <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>

<?php
$current_page = basename($_SERVER['SCRIPT_NAME']);
$current_slug = $_GET['slug'] ?? '';

function is_active(string $page, string $slug = ''): string {
    global $current_page, $current_slug;
    if ($current_page === $page) {
        if ($slug === '' || $current_slug === $slug) {
            return ' active';
        }
    }
    return '';
}
?>

<nav class="navbar">
    <div class="container navbar-inner">
        <a href="/" class="navbar-brand">
            <i class="fa-solid fa-plane"></i>
            <span><?php echo htmlspecialchars(SITE_NAME); ?></span>
        </a>

        <ul class="navbar-links">
            <li><a href="/" class="nav-link<?php echo is_active('index.php'); ?>">Home</a></li>
            <li><a href="/category.php?slug=airline-news" class="nav-link<?php echo is_active('category.php', 'airline-news'); ?>">Airlines</a></li>
            <li><a href="/category.php?slug=airport-news" class="nav-link<?php echo is_active('category.php', 'airport-news'); ?>">Airports</a></li>
            <li><a href="/category.php?slug=aerospace" class="nav-link<?php echo is_active('category.php', 'aerospace'); ?>">Aerospace</a></li>
            <li><a href="/shorts.php" class="nav-link<?php echo is_active('shorts.php'); ?>">Shorts</a></li>
            <li><a href="/flight.php" class="nav-link<?php echo is_active('flight.php'); ?>">Flight Tracker</a></li>
        </ul>

        <div class="navbar-actions">
            <a href="/search.php" class="nav-icon-btn" aria-label="Search">
                <i class="fa-solid fa-magnifying-glass"></i>
            </a>
            <button class="nav-icon-btn hamburger-btn" aria-label="Open menu" onclick="toggleMobileMenu()">
                <i class="fa-solid fa-bars"></i>
            </button>
        </div>
    </div>
</nav>

<!-- Mobile slide-in menu -->
<div class="mobile-menu-overlay" id="mobileMenuOverlay" onclick="toggleMobileMenu()"></div>
<div class="mobile-menu" id="mobileMenu">
    <div class="mobile-menu-header">
        <a href="/" class="navbar-brand">
            <i class="fa-solid fa-plane"></i>
            <span><?php echo htmlspecialchars(SITE_NAME); ?></span>
        </a>
        <button class="nav-icon-btn" aria-label="Close menu" onclick="toggleMobileMenu()">
            <i class="fa-solid fa-xmark"></i>
        </button>
    </div>
    <ul class="mobile-menu-links">
        <li><a href="/" class="nav-link<?php echo is_active('index.php'); ?>">Home</a></li>
        <li><a href="/category.php?slug=airline-news" class="nav-link<?php echo is_active('category.php', 'airline-news'); ?>">Airlines</a></li>
        <li><a href="/category.php?slug=airport-news" class="nav-link<?php echo is_active('category.php', 'airport-news'); ?>">Airports</a></li>
        <li><a href="/category.php?slug=aerospace" class="nav-link<?php echo is_active('category.php', 'aerospace'); ?>">Aerospace</a></li>
        <li><a href="/shorts.php" class="nav-link<?php echo is_active('shorts.php'); ?>">Shorts</a></li>
        <li><a href="/flight.php" class="nav-link<?php echo is_active('flight.php'); ?>">Flight Tracker</a></li>
        <li><a href="/search.php" class="nav-link<?php echo is_active('search.php'); ?>">Search</a></li>
    </ul>
</div>

<main class="main-content">
