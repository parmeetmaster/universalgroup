<?php
require_once __DIR__ . '/includes/api.php';

$slug = $_GET['slug'] ?? '';
$page = max(1, (int)($_GET['page'] ?? 1));

if (empty($slug)) {
    header('Location: /');
    exit;
}

$data = get_tag($slug, $page);

$tag_name = $data['tag'] ?? $data['name'] ?? ucwords(str_replace('-', ' ', $slug));
$articles = $data['articles'] ?? $data['data'] ?? $data['items'] ?? [];
$pagination = $data['pagination'] ?? $data['meta'] ?? null;

$page_meta = [
    'title' => '#' . $tag_name,
    'description' => 'Articles tagged with "' . $tag_name . '" on ' . SITE_NAME,
];

include __DIR__ . '/includes/header.php';
?>

<div class="container">
    <div style="display: flex; align-items: center; gap: var(--space-sm); font-size: var(--font-size-sm); color: var(--text-subtle); margin-bottom: var(--space-xl);">
        <a href="/" style="color: var(--accent);">Home</a>
        <i class="fa-solid fa-chevron-right" style="font-size: 0.625rem;"></i>
        <span>Tags</span>
        <i class="fa-solid fa-chevron-right" style="font-size: 0.625rem;"></i>
        <span><?php echo htmlspecialchars($tag_name); ?></span>
    </div>

    <h1 style="font-size: var(--font-size-3xl); font-weight: 800; margin-bottom: var(--space-xl);">
        <span style="color: var(--accent);">#</span><?php echo htmlspecialchars($tag_name); ?>
    </h1>

    <?php if (empty($articles)): ?>
    <div style="text-align: center; padding: var(--space-3xl) 0;">
        <i class="fa-solid fa-hashtag" style="font-size: 3rem; color: var(--text-subtle); margin-bottom: var(--space-lg);"></i>
        <h3 style="color: var(--text-primary); margin-bottom: var(--space-sm);">No Articles Found</h3>
        <p class="text-muted">No articles found with this tag.</p>
    </div>
    <?php else: ?>
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

    <?php render_pagination($pagination, 'tag.php?slug=' . urlencode($slug)); ?>
    <?php endif; ?>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
