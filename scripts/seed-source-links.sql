-- Seed drama_source_links from existing drama.source_url fields
-- Run this ONCE after deploying the DramaSourceLink entity (TypeORM synchronize creates the table)

-- 1. Ensure 'humtv' parse source exists
INSERT IGNORE INTO parse_sources (name, slug, base_url, driver, priority, is_active, created_at, updated_at)
VALUES ('HUM TV', 'humtv', 'https://hum.tv', 'humtv', 30, 1, NOW(), NOW());

-- 2. Ensure 'dramaspice' parse source exists
INSERT IGNORE INTO parse_sources (name, slug, base_url, driver, priority, is_active, created_at, updated_at)
VALUES ('DramaSpice', 'dramaspice', 'https://dramaspice.net', 'dramaspice', 50, 1, NOW(), NOW());

-- 3. Seed dramaxima links from existing drama.source_url
INSERT IGNORE INTO drama_source_links
  (drama_id, source_id, source_url, source_slug, match_method, match_confidence, is_primary, priority, status, last_scraped_at, parse_last_modified, created_at, updated_at)
SELECT
  d.id,
  ps.id,
  d.source_url,
  d.slug,
  'exact_slug',
  100,
  1,
  ps.priority,
  'active',
  d.parse_last_succeeded_at,
  d.parse_last_modified,
  NOW(),
  NOW()
FROM dramas d
CROSS JOIN parse_sources ps
WHERE ps.slug = 'dramaxima'
  AND d.source_url IS NOT NULL
  AND d.source_url LIKE 'https://dramaxima.com/%'
  AND d.deleted_at IS NULL;
