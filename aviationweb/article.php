<?php
require_once __DIR__ . '/includes/api.php';

$path = $_GET['path'] ?? '';

if (empty($path)) {
    header('Location: /');
    exit;
}

$data = get_article($path);
// API returns flat object with: title, url, category{name,url}, author{name,url,avatar,bio},
// date, readTime, featuredImage{url,caption}, content, tags[], relatedPosts[], source{name,url,logo}
$article = $data;
$related = $data['relatedPosts'] ?? $data['related'] ?? [];

if ($article === null) {
    $page_meta = ['title' => 'Article Not Found', 'description' => 'The requested article could not be found.'];
    include __DIR__ . '/includes/header.php';
    ?>
    <div class="container">
        <a href="/" class="back-link" style="display: inline-flex; align-items: center; gap: var(--space-sm); color: var(--text-muted); margin-bottom: var(--space-xl);">
            <i class="fa-solid fa-arrow-left"></i> Back to Home
        </a>
        <div style="text-align: center; padding: var(--space-3xl) 0;">
            <i class="fa-solid fa-newspaper" style="font-size: 3rem; color: var(--text-subtle); margin-bottom: var(--space-lg);"></i>
            <h2 style="color: var(--text-primary); margin-bottom: var(--space-sm);">Article Not Found</h2>
            <p class="text-muted">The article you are looking for does not exist or has been removed.</p>
        </div>
    </div>
    <?php
    include __DIR__ . '/includes/footer.php';
    exit;
}

$title = $article['title'] ?? '';
$excerpt = $article['excerpt'] ?? '';
// featuredImage is an object {url, caption}
$featured_image = $article['featuredImage'] ?? [];
$image = $featured_image['url'] ?? $article['image'] ?? '';
// category is an object {name, url}
$category_obj = $article['category'] ?? [];
$category = is_array($category_obj) ? ($category_obj['name'] ?? '') : (string)$category_obj;
$category_url = is_array($category_obj) ? ($category_obj['url'] ?? '') : '';
$category_slug = $category_url ? trim(parse_url($category_url, PHP_URL_PATH) ?? '', '/') : strtolower(str_replace(' ', '-', $category));
$content = $article['content'] ?? '';
// author is an object {name, url, avatar, bio}
$author_obj = $article['author'] ?? [];
$author_name = is_array($author_obj) ? ($author_obj['name'] ?? '') : (string)$author_obj;
$author_url = is_array($author_obj) ? ($author_obj['url'] ?? '') : '';
$author_slug = $author_url ? basename(trim(parse_url($author_url, PHP_URL_PATH) ?? '', '/')) : strtolower(str_replace(' ', '-', $author_name));
$author_avatar = is_array($author_obj) ? ($author_obj['avatar'] ?? '') : '';
$author_bio = is_array($author_obj) ? ($author_obj['bio'] ?? '') : '';
$date = $article['date'] ?? '';
$read_time = $article['readTime'] ?? '';
$tags = $article['tags'] ?? [];
// source info
$source = $article['source'] ?? [];

$page_meta = [
    'title' => $title,
    'description' => truncate($excerpt, 160),
    'image' => $image,
];

include __DIR__ . '/includes/header.php';
?>

<div class="container">
    <a href="/" style="display: inline-flex; align-items: center; gap: var(--space-sm); color: var(--text-muted); margin-bottom: var(--space-xl); font-size: var(--font-size-sm); font-weight: 500; transition: color 0.2s;" onmouseover="this.style.color='var(--accent-light)'" onmouseout="this.style.color='var(--text-muted)'">
        <i class="fa-solid fa-arrow-left"></i> Back to Home
    </a>

    <?php if ($image): ?>
    <div class="article-hero">
        <img src="<?php echo htmlspecialchars($image); ?>" alt="<?php echo htmlspecialchars($title); ?>">
        <div class="article-hero-overlay"></div>
    </div>
    <?php endif; ?>

    <div class="article-wrapper">
        <div class="article-header">
            <?php if ($category): ?>
            <a href="/category.php?slug=<?php echo urlencode($category_slug ?: strtolower(str_replace(' ', '-', $category))); ?>" class="article-category">
                <?php echo htmlspecialchars($category); ?>
            </a>
            <?php endif; ?>

            <h1 class="article-title"><?php echo htmlspecialchars($title); ?></h1>

            <div class="article-meta">
                <?php if ($author_avatar): ?>
                <img src="<?php echo htmlspecialchars($author_avatar); ?>" alt="<?php echo htmlspecialchars($author_name); ?>" class="author-avatar" style="width: 40px; height: 40px;">
                <?php endif; ?>
                <?php if ($author_name): ?>
                <a href="/author.php?slug=<?php echo urlencode($author_slug ?: strtolower(str_replace(' ', '-', $author_name))); ?>" style="font-weight: 600; color: var(--text-primary);">
                    <?php echo htmlspecialchars($author_name); ?>
                </a>
                <span class="dot"></span>
                <?php endif; ?>
                <?php if ($date): ?>
                <span><?php echo htmlspecialchars(time_ago($date)); ?></span>
                <?php endif; ?>
                <?php if ($read_time): ?>
                <span class="dot"></span>
                <span><?php echo htmlspecialchars($read_time); ?> min read</span>
                <?php endif; ?>
            </div>
        </div>

        <div class="article-content">
            <?php echo $content; ?>
        </div>

        <?php if (!empty($tags)): ?>
        <div class="article-tags">
            <?php foreach ($tags as $tag):
                $tag_name = is_array($tag) ? ($tag['name'] ?? $tag['title'] ?? '') : $tag;
                $tag_slug = is_array($tag) ? ($tag['slug'] ?? strtolower(str_replace(' ', '-', $tag_name))) : strtolower(str_replace(' ', '-', $tag));
                if (empty($tag_name)) continue;
            ?>
            <a href="/tag.php?slug=<?php echo urlencode($tag_slug); ?>" class="article-tag">#<?php echo htmlspecialchars($tag_name); ?></a>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>

        <?php if ($author_name): ?>
        <div class="author-card">
            <?php if ($author_avatar): ?>
            <img src="<?php echo htmlspecialchars($author_avatar); ?>" alt="<?php echo htmlspecialchars($author_name); ?>" class="author-avatar">
            <?php endif; ?>
            <div>
                <div class="author-name">
                    <a href="/author.php?slug=<?php echo urlencode($author_slug ?: strtolower(str_replace(' ', '-', $author_name))); ?>">
                        <?php echo htmlspecialchars($author_name); ?>
                    </a>
                </div>
                <?php if ($author_bio): ?>
                <p class="author-bio"><?php echo htmlspecialchars($author_bio); ?></p>
                <?php endif; ?>
            </div>
        </div>
        <?php endif; ?>
    </div>

    <?php if (!empty($related)): ?>
    <div class="section" style="margin-top: var(--space-3xl);">
        <div class="section-header">
            <h2 class="section-title">Related Articles</h2>
        </div>
        <div class="grid-3">
            <?php foreach (array_slice($related, 0, 3) as $rel): ?>
            <a href="/article.php?path=<?php echo urlencode($rel['url'] ?? ''); ?>" class="card">
                <div class="card-image-wrapper">
                    <img class="card-image" src="<?php echo htmlspecialchars($rel['image'] ?? ''); ?>" alt="<?php echo htmlspecialchars($rel['title'] ?? ''); ?>" loading="lazy">
                    <?php if (!empty($rel['category'])): ?>
                    <span class="card-badge"><?php echo htmlspecialchars($rel['category']); ?></span>
                    <?php endif; ?>
                </div>
                <div class="card-body">
                    <h3 class="card-title"><?php echo htmlspecialchars($rel['title'] ?? ''); ?></h3>
                    <div class="card-meta">
                        <?php if (!empty($rel['author'])): ?>
                        <span><?php echo htmlspecialchars($rel['author']); ?></span>
                        <span class="dot"></span>
                        <?php endif; ?>
                        <?php if (!empty($rel['date'] ?? $rel['publishedAt'] ?? $rel['published_at'] ?? null)): ?>
                        <span><?php echo htmlspecialchars(time_ago($rel['date'] ?? $rel['publishedAt'] ?? $rel['published_at'])); ?></span>
                        <?php endif; ?>
                    </div>
                </div>
            </a>
            <?php endforeach; ?>
        </div>
    </div>
    <?php endif; ?>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
