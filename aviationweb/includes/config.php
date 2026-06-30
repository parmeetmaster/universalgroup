<?php

define('API_BASE_URL', 'https://global.animekill.com/api/aviation-news');

define('SITE_NAME', 'Suno Aviation');
define('SITE_TAGLINE', 'Your Sky, Your News');
define('SITE_URL', 'https://sunoaviation.com');

define('CACHE_DIR', '/tmp/aviation_cache/');
define('CACHE_TTL', 300); // 5 minutes

// Error reporting
if (getenv('APP_ENV') === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
} else {
    error_reporting(0);
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');
}

date_default_timezone_set('UTC');
