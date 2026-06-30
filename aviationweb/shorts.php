<?php
require_once __DIR__ . '/includes/api.php';

$page = max(1, (int)($_GET['page'] ?? 1));
$data = get_shorts($page, 20);

$shorts = $data['items'] ?? $data['data'] ?? $data['shorts'] ?? [];
$pagination = $data['pagination'] ?? $data['meta'] ?? null;

$page_meta = [
    'title' => 'Aviation Shorts',
    'description' => 'Watch the latest aviation short videos, clips, and highlights',
];

include __DIR__ . '/includes/header.php';
?>

<div class="container">
    <div style="display: flex; align-items: center; gap: var(--space-sm); font-size: var(--font-size-sm); color: var(--text-subtle); margin-bottom: var(--space-xl);">
        <a href="/" style="color: var(--accent);">Home</a>
        <i class="fa-solid fa-chevron-right" style="font-size: 0.625rem;"></i>
        <span>Shorts</span>
    </div>

    <div class="section-header">
        <h1 class="section-title" style="font-size: var(--font-size-3xl);">Aviation Shorts</h1>
    </div>

    <?php if (empty($shorts)): ?>
    <div style="text-align: center; padding: var(--space-3xl) 0;">
        <i class="fa-solid fa-video" style="font-size: 3rem; color: var(--text-subtle); margin-bottom: var(--space-lg);"></i>
        <h3 style="color: var(--text-primary); margin-bottom: var(--space-sm);">No Shorts Available</h3>
        <p class="text-muted">Check back soon for the latest aviation short videos.</p>
    </div>
    <?php else: ?>
    <div class="grid-4">
        <?php foreach ($shorts as $short):
            $url = $short['youtubeUrl'] ?? $short['url'] ?? '#';
            $thumb = $short['thumbnailUrl'] ?? $short['thumbnail'] ?? '';
            $title = $short['title'] ?? '';
            $dur_secs = $short['durationSeconds'] ?? 0;
            $duration = $dur_secs > 0 ? floor($dur_secs / 60) . ':' . str_pad($dur_secs % 60, 2, '0', STR_PAD_LEFT) : '';
        ?>
        <a href="<?php echo htmlspecialchars($url); ?>" target="_blank" rel="noopener noreferrer" class="shorts-card" style="width: auto; aspect-ratio: 9/16;">
            <img src="<?php echo htmlspecialchars($thumb); ?>" alt="<?php echo htmlspecialchars($title); ?>" loading="lazy">
            <div class="shorts-overlay">
                <div class="shorts-play">
                    <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <?php if ($duration): ?>
                <span class="shorts-duration"><?php echo htmlspecialchars($duration); ?></span>
                <?php endif; ?>
                <span class="shorts-title"><?php echo htmlspecialchars($title); ?></span>
            </div>
        </a>
        <?php endforeach; ?>
    </div>

    <?php render_pagination($pagination, 'shorts.php'); ?>
    <?php endif; ?>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
