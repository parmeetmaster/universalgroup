<?php
require_once __DIR__ . '/includes/api.php';

$slug = $_GET['slug'] ?? '';
$page = max(1, (int)($_GET['page'] ?? 1));

if (empty($slug)) {
    header('Location: /');
    exit;
}

$data = get_author($slug, $page);

if ($data === null) {
    $page_meta = ['title' => 'Author Not Found', 'description' => 'The requested author could not be found.'];
    include __DIR__ . '/includes/header.php';
    ?>
    <div class="container">
        <a href="/" style="display: inline-flex; align-items: center; gap: var(--space-sm); color: var(--text-muted); margin-bottom: var(--space-xl); font-size: var(--font-size-sm); font-weight: 500;">
            <i class="fa-solid fa-arrow-left"></i> Back to Home
        </a>
        <div style="text-align: center; padding: var(--space-3xl) 0;">
            <i class="fa-solid fa-user" style="font-size: 3rem; color: var(--text-subtle); margin-bottom: var(--space-lg);"></i>
            <h2 style="color: var(--text-primary); margin-bottom: var(--space-sm);">Author Not Found</h2>
            <p class="text-muted">The author you are looking for does not exist.</p>
        </div>
    </div>
    <?php
    include __DIR__ . '/includes/footer.php';
    exit;
}

$author = $data['author'] ?? $data;
$author_name = $author['name'] ?? $author['authorName'] ?? ucwords(str_replace('-', ' ', $slug));
$author_avatar = $author['avatar'] ?? $author['image'] ?? '';
$author_bio = $author['bio'] ?? $author['description'] ?? '';
$articles = $data['articles'] ?? $data['data'] ?? $data['items'] ?? [];
$pagination = $data['pagination'] ?? $data['meta'] ?? null;

$page_meta = [
    'title' => $author_name,
    'description' => $author_bio ? truncate($author_bio, 160) : 'Articles by ' . $author_name . ' on ' . SITE_NAME,
    'image' => $author_avatar,
];

include __DIR__ . '/includes/header.php';
?>

<div class="container">
    <a href="/" style="display: inline-flex; align-items: center; gap: var(--space-sm); color: var(--text-muted); margin-bottom: var(--space-xl); font-size: var(--font-size-sm); font-weight: 500; transition: color 0.2s;" onmouseover="this.style.color='var(--accent-light)'" onmouseout="this.style.color='var(--text-muted)'">
        <i class="fa-solid fa-arrow-left"></i> Back to Home
    </a>

    <!-- Author Header -->
    <div class="author-card" style="margin-top: 0; margin-bottom: var(--space-2xl);">
        <?php if ($author_avatar): ?>
        <img src="<?php echo htmlspecialchars($author_avatar); ?>" alt="<?php echo htmlspecialchars($author_name); ?>" class="author-avatar" style="width: 96px; height: 96px;">
        <?php else: ?>
        <div style="width: 96px; height: 96px; border-radius: 50%; background: var(--bg-elevated); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <i class="fa-solid fa-user" style="font-size: 2rem; color: var(--text-subtle);"></i>
        </div>
        <?php endif; ?>
        <div>
            <h1 class="author-name" style="font-size: var(--font-size-2xl); margin-bottom: var(--space-sm);"><?php echo htmlspecialchars($author_name); ?></h1>
            <?php if ($author_bio): ?>
            <p class="author-bio"><?php echo htmlspecialchars($author_bio); ?></p>
            <?php endif; ?>
        </div>
    </div>

    <?php if (empty($articles)): ?>
    <div style="text-align: center; padding: var(--space-3xl) 0;">
        <i class="fa-solid fa-newspaper" style="font-size: 3rem; color: var(--text-subtle); margin-bottom: var(--space-lg);"></i>
        <h3 style="color: var(--text-primary); margin-bottom: var(--space-sm);">No Articles Yet</h3>
        <p class="text-muted">This author has not published any articles yet.</p>
    </div>
    <?php else: ?>
    <div class="section-header">
        <h2 class="section-title">Articles by <?php echo htmlspecialchars($author_name); ?></h2>
    </div>
    <div class="grid-3">
        <?php foreach ($articles as $article):
            $path = $article['url'] ?? $article['path'] ?? '';
            $image = $article['image'] ?? $article['thumbnail'] ?? '';
            $title = $article['title'] ?? '';
            $excerpt = $article['excerpt'] ?? $article['description'] ?? '';
            $category = $article['category'] ?? '';
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
                    <?php if ($date): ?>
                    <span><?php echo htmlspecialchars(time_ago($date)); ?></span>
                    <?php endif; ?>
                </div>
            </div>
        </a>
        <?php endforeach; ?>
    </div>

    <?php render_pagination($pagination, 'author.php?slug=' . urlencode($slug)); ?>
    <?php endif; ?>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
