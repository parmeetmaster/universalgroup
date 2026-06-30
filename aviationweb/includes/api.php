<?php

require_once __DIR__ . '/config.php';

/**
 * Make a GET request to the NestJS API.
 * Returns decoded JSON or null on failure.
 */
function api_get(string $endpoint, array $params = []): ?array {
    $url = API_BASE_URL . $endpoint;
    if (!empty($params)) {
        $url .= '?' . http_build_query($params);
    }

    $cache_key = md5($url);
    $cached = cache_get($cache_key);
    if ($cached !== null) {
        return $cached;
    }

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTPHEADER     => ['Accept: application/json'],
        CURLOPT_USERAGENT      => 'SunoAviation/1.0',
    ]);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error || $http_code >= 400 || $response === false) {
        return null;
    }

    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return null;
    }

    cache_set($cache_key, $data);
    return $data;
}

// ── Endpoint helpers ──

function get_home_data(): ?array {
    return api_get('/home');
}

function get_category(string $slug, int $page = 1): ?array {
    return api_get('/category/' . urlencode($slug), ['page' => $page]);
}

function get_article(string $path): ?array {
    return api_get('/article', ['path' => $path]);
}

function search_articles(string $query, int $page = 1): ?array {
    return api_get('/search', ['q' => $query, 'page' => $page]);
}

function get_author(string $slug, int $page = 1): ?array {
    return api_get('/author/' . urlencode($slug), ['page' => $page]);
}

function get_tag(string $slug, int $page = 1): ?array {
    return api_get('/tag/' . urlencode($slug), ['page' => $page]);
}

function get_latest(int $page = 1): ?array {
    return api_get('/latest', ['page' => $page]);
}

function get_shorts(int $page = 1, int $limit = 20): ?array {
    return api_get('/shorts', ['page' => $page, 'limit' => $limit]);
}

function get_flight(string $number, ?string $date = null): ?array {
    $params = ['number' => $number];
    if ($date !== null) {
        $params['date'] = $date;
    }
    return api_get('/flight', $params);
}

function get_aqi(float $lat, float $lng): ?array {
    return api_get('/aqi', ['lat' => $lat, 'lng' => $lng]);
}

// ── File-based cache ──

function cache_get(string $key): ?array {
    $file = CACHE_DIR . $key . '.json';
    if (!file_exists($file)) {
        return null;
    }
    $mtime = filemtime($file);
    if (time() - $mtime > CACHE_TTL) {
        @unlink($file);
        return null;
    }
    $contents = @file_get_contents($file);
    if ($contents === false) {
        return null;
    }
    $data = json_decode($contents, true);
    return (json_last_error() === JSON_ERROR_NONE) ? $data : null;
}

function cache_set(string $key, array $data): void {
    if (!is_dir(CACHE_DIR)) {
        @mkdir(CACHE_DIR, 0755, true);
    }
    $file = CACHE_DIR . $key . '.json';
    @file_put_contents($file, json_encode($data), LOCK_EX);
}

// ── Utility helpers ──

function time_ago(string $date_string): string {
    $timestamp = strtotime($date_string);
    if ($timestamp === false) {
        return $date_string;
    }

    $diff = time() - $timestamp;
    if ($diff < 0) {
        return 'just now';
    }

    $intervals = [
        ['label' => 'year',   'seconds' => 31536000],
        ['label' => 'month',  'seconds' => 2592000],
        ['label' => 'week',   'seconds' => 604800],
        ['label' => 'day',    'seconds' => 86400],
        ['label' => 'hour',   'seconds' => 3600],
        ['label' => 'minute', 'seconds' => 60],
    ];

    foreach ($intervals as $interval) {
        $count = floor($diff / $interval['seconds']);
        if ($count >= 1) {
            $label = $interval['label'];
            return $count . ' ' . $label . ($count > 1 ? 's' : '') . ' ago';
        }
    }

    return 'just now';
}

function truncate(string $text, int $length = 150): string {
    $text = trim(strip_tags($text));
    if (mb_strlen($text) <= $length) {
        return $text;
    }
    return mb_substr($text, 0, $length) . '...';
}

/**
 * Render pagination controls.
 * Expects $pagination = ['page' => int, 'totalPages' => int, 'total' => int].
 * $base_url should be like "category.php?slug=airline-news" (page param is appended).
 */
function render_pagination(?array $pagination, string $base_url): void {
    if ($pagination === null) {
        return;
    }

    $current = (int)($pagination['page'] ?? 1);
    $total_pages = (int)($pagination['totalPages'] ?? $pagination['total_pages'] ?? 1);

    if ($total_pages <= 1) {
        return;
    }

    $separator = (strpos($base_url, '?') !== false) ? '&' : '?';

    echo '<div class="pagination">';

    // Previous button
    if ($current > 1) {
        echo '<a href="' . htmlspecialchars($base_url . $separator . 'page=' . ($current - 1)) . '" class="pagination-btn"><i class="fa-solid fa-chevron-left"></i></a>';
    } else {
        echo '<button class="pagination-btn" disabled><i class="fa-solid fa-chevron-left"></i></button>';
    }

    // Page numbers
    $range = 2;
    $start = max(1, $current - $range);
    $end = min($total_pages, $current + $range);

    if ($start > 1) {
        echo '<a href="' . htmlspecialchars($base_url . $separator . 'page=1') . '" class="pagination-btn">1</a>';
        if ($start > 2) {
            echo '<span class="pagination-ellipsis">...</span>';
        }
    }

    for ($i = $start; $i <= $end; $i++) {
        if ($i === $current) {
            echo '<span class="pagination-btn active">' . $i . '</span>';
        } else {
            echo '<a href="' . htmlspecialchars($base_url . $separator . 'page=' . $i) . '" class="pagination-btn">' . $i . '</a>';
        }
    }

    if ($end < $total_pages) {
        if ($end < $total_pages - 1) {
            echo '<span class="pagination-ellipsis">...</span>';
        }
        echo '<a href="' . htmlspecialchars($base_url . $separator . 'page=' . $total_pages) . '" class="pagination-btn">' . $total_pages . '</a>';
    }

    // Next button
    if ($current < $total_pages) {
        echo '<a href="' . htmlspecialchars($base_url . $separator . 'page=' . ($current + 1)) . '" class="pagination-btn"><i class="fa-solid fa-chevron-right"></i></a>';
    } else {
        echo '<button class="pagination-btn" disabled><i class="fa-solid fa-chevron-right"></i></button>';
    }

    echo '</div>';
}
