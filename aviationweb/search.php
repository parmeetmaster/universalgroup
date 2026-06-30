<?php
require_once __DIR__ . '/includes/api.php';

$query = trim($_GET['q'] ?? '');
$page = max(1, (int)($_GET['page'] ?? 1));

$data = null;
$articles = [];
$pagination = null;

if ($query !== '') {
    $data = search_articles($query, $page);
    $articles = $data['articles'] ?? $data['data'] ?? $data['items'] ?? [];
    $pagination = $data['pagination'] ?? $data['meta'] ?? null;
}

$page_meta = [
    'title' => $query ? 'Search: ' . $query : 'Search',
    'description' => $query ? 'Search results for "' . $query . '" on ' . SITE_NAME : 'Search aviation news articles',
];

include __DIR__ . '/includes/header.php';
?>

<div class="container">
    <div class="search-hero">
        <h1>Search Aviation News</h1>
        <form action="/search.php" method="get" class="search-input-wrapper">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input
                type="text"
                name="q"
                class="search-input"
                placeholder="Search articles, topics, airlines..."
                value="<?php echo htmlspecialchars($query); ?>"
                <?php echo $query === '' ? 'autofocus' : ''; ?>
            >
        </form>
    </div>

    <?php if ($query !== ''): ?>
        <?php if (!empty($articles)):
            $total = $pagination['total'] ?? $pagination['totalItems'] ?? $pagination['total_items'] ?? count($articles);
        ?>
        <p class="search-results-count"><?php echo htmlspecialchars((string)$total); ?> results found for "<?php echo htmlspecialchars($query); ?>"</p>

        <div class="grid-3">
            <?php foreach ($articles as $article):
                $path = $article['url'] ?? $article['path'] ?? '';
                $image = $article['image'] ?? $article['thumbnail'] ?? '';
                $title = $article['title'] ?? '';
                $excerpt = $article['excerpt'] ?? $article['description'] ?? '';
                $category = $article['category'] ?? '';
                $author = $article['author'] ?? '';
                $date = $article['date'] ?? $article['publishedAt'] ?? $article['published_at'] ?? '';
            ?>
            <a href="/article.php?path=<?php echo urlencode($path); ?>" class="card">
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
            <?php endforeach; ?>
        </div>

        <?php render_pagination($pagination, 'search.php?q=' . urlencode($query)); ?>

        <?php else: ?>
        <div style="text-align: center; padding: var(--space-3xl) 0;">
            <i class="fa-solid fa-magnifying-glass" style="font-size: 3rem; color: var(--text-subtle); margin-bottom: var(--space-lg);"></i>
            <h3 style="color: var(--text-primary); margin-bottom: var(--space-sm);">No Articles Found</h3>
            <p class="text-muted">No articles found for "<?php echo htmlspecialchars($query); ?>". Try a different search term.</p>
        </div>
        <?php endif; ?>
    <?php endif; ?>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
