<?php
require_once __DIR__ . '/includes/api.php';

$data = get_home_data();
$page_meta = [
    'title' => SITE_NAME,
    'description' => SITE_TAGLINE,
];

include __DIR__ . '/includes/header.php';

if ($data === null): ?>
    <div class="container">
        <div class="section" style="text-align: center; padding: var(--space-3xl) 0;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: var(--text-subtle); margin-bottom: var(--space-lg);"></i>
            <h2 style="color: var(--text-primary); margin-bottom: var(--space-sm);">Unable to Load Content</h2>
            <p class="text-muted">We are having trouble fetching the latest news. Please try again later.</p>
        </div>
    </div>
<?php else:

// Map API response fields to local variables
// API returns: hero, trendingArticles, latestNews, featured, editorsChoice,
// aerospace, airlines, airport, editorsPicks, latestArticles, etc.
$hero = $data['hero'] ?? null;
$trending = $data['trendingArticles'] ?? [];
$latest = $data['latestNews'] ?? $data['latestArticles'] ?? [];
$featured = $data['featured'] ?? [];
$editors_picks = $data['editorsPicks'] ?? $data['editorsChoice'] ?? [];
$airlines = $data['airlines'] ?? [];
$airport = $data['airport'] ?? [];
$aerospace = $data['aerospace'] ?? [];
?>

<div class="container">

    <?php if ($hero): ?>
    <!-- Hero Section -->
    <a href="/article.php?path=<?php echo urlencode($hero['url'] ?? ''); ?>" class="hero">
        <img class="hero-image" src="<?php echo htmlspecialchars($hero['image'] ?? ''); ?>" alt="<?php echo htmlspecialchars($hero['title'] ?? ''); ?>">
        <div class="hero-overlay"></div>
        <div class="hero-content">
            <?php if (!empty($hero['category'])): ?>
            <span class="hero-badge"><?php echo htmlspecialchars($hero['category']); ?></span>
            <?php endif; ?>
            <h1 class="hero-title"><?php echo htmlspecialchars($hero['title'] ?? ''); ?></h1>
            <?php if (!empty($hero['excerpt'])): ?>
            <p class="hero-excerpt"><?php echo htmlspecialchars(truncate($hero['excerpt'], 200)); ?></p>
            <?php endif; ?>
            <div class="hero-meta">
                <?php if (!empty($hero['author'])): ?>
                <span><?php echo htmlspecialchars($hero['author']); ?></span>
                <span class="dot"></span>
                <?php endif; ?>
                <?php if (!empty($hero['date'])): ?>
                <span><?php echo htmlspecialchars(time_ago($hero['date'])); ?></span>
                <?php endif; ?>
            </div>
        </div>
    </a>
    <?php endif; ?>

    <?php if (!empty($trending)): ?>
    <!-- Trending Section -->
    <div class="section reveal">
        <div class="section-header">
            <h2 class="section-title">Trending Now</h2>
        </div>
        <div class="grid-4">
            <?php foreach (array_slice($trending, 0, 8) as $article): ?>
            <?php render_article_card($article); ?>
            <?php endforeach; ?>
        </div>
    </div>
    <?php endif; ?>

    <?php if (!empty($latest)): ?>
    <!-- Latest News Section -->
    <div class="section reveal">
        <div class="section-header">
            <h2 class="section-title">Latest News</h2>
        </div>
        <div class="grid-3">
            <?php foreach (array_slice($latest, 0, 6) as $article): ?>
            <?php render_article_card($article); ?>
            <?php endforeach; ?>
        </div>
    </div>
    <?php endif; ?>

    <?php
    // Category sections from direct API fields
    $category_sections = [
        ['data' => $airlines, 'slug' => 'airline-news', 'label' => 'Airlines'],
        ['data' => $airport, 'slug' => 'airport-news', 'label' => 'Airports'],
        ['data' => $aerospace, 'slug' => 'aerospace', 'label' => 'Aerospace'],
    ];
    foreach ($category_sections as $section):
        if (empty($section['data'])) continue;
    ?>
    <div class="section reveal">
        <div class="section-header">
            <h2 class="section-title"><?php echo htmlspecialchars($section['label']); ?></h2>
            <a href="/category.php?slug=<?php echo htmlspecialchars($section['slug']); ?>" class="section-link">See All <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div class="grid-3">
            <?php foreach (array_slice($section['data'], 0, 3) as $article): ?>
            <?php render_article_card($article); ?>
            <?php endforeach; ?>
        </div>
    </div>
    <?php endforeach; ?>

    <?php if (!empty($featured)): ?>
    <!-- Featured Section -->
    <div class="section reveal">
        <div class="section-header">
            <h2 class="section-title">Featured</h2>
        </div>
        <div class="grid-3">
            <?php foreach (array_slice($featured, 0, 6) as $article): ?>
            <?php render_article_card($article); ?>
            <?php endforeach; ?>
        </div>
    </div>
    <?php endif; ?>

    <?php if (!empty($editors_picks)): ?>
    <!-- Editor's Picks Section -->
    <div class="section reveal">
        <div class="section-header">
            <h2 class="section-title">Editor's Picks</h2>
        </div>
        <div class="grid-3">
            <?php foreach (array_slice($editors_picks, 0, 3) as $article): ?>
            <?php render_article_card($article); ?>
            <?php endforeach; ?>
        </div>
    </div>
    <?php endif; ?>

</div>

<?php endif; ?>

<?php include __DIR__ . '/includes/footer.php'; ?>

<?php
// Helper: render a standard article card
// API article fields: title, url, image, category, date, author, excerpt
function render_article_card(array $article): void {
    $url = $article['url'] ?? $article['path'] ?? '';
    $image = $article['image'] ?? '';
    $title = $article['title'] ?? '';
    $excerpt = $article['excerpt'] ?? '';
    $category = $article['category'] ?? '';
    $author = $article['author'] ?? '';
    $date = $article['date'] ?? '';
    ?>
    <a href="/article.php?path=<?php echo urlencode($url); ?>" class="card">
        <div class="card-image-wrapper">
            <img class="card-image" src="<?php echo htmlspecialchars($image); ?>" alt="<?php echo htmlspecialchars($title); ?>" loading="lazy">
            <?php if ($category): ?>
            <span class="card-badge"><?php echo htmlspecialchars($category); ?></span>
            <?php endif; ?>
        </div>
        <div class="card-body">
            <h3 class="card-title"><?php echo htmlspecialchars($title); ?></h3>
            <?php if ($excerpt): ?>
            <p class="card-excerpt"><?php echo htmlspecialchars(truncate($excerpt, 120)); ?></p>
            <?php endif; ?>
            <div class="card-meta">
                <?php if ($author): ?>
                <span><?php echo htmlspecialchars($author); ?></span>
                <span class="dot"></span>
                <?php endif; ?>
                <?php if ($date): ?>
                <span><?php echo htmlspecialchars(time_ago($date)); ?></span>
                <?php endif; ?>
            </div>
        </div>
    </a>
    <?php
}
?>
