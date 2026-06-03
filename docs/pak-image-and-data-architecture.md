# Pakistani Serials — Image Hosting + Data Architecture Plan

## Problem Statement

1. **Images re-fetched every time**: Drama posters, backdrops, episode thumbnails are external URLs (dramaxima.com). If source goes down or changes URL, images break.
2. **No image proxy**: Direct URLs exposed to app. Source can block, rate-limit, or geo-restrict.
3. **Episode details not cached**: App hits API every time for drama details and episodes. No local persistence.
4. **Cron mechanism unclear**: How new episodes are detected, stored, and when data is considered "stale" is not well documented.
5. **Frontend edge cases**: No clear strategy for missing data, wrong data, or stale data on the Flutter app.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CRON (NestJS)                                 │
│                                                                      │
│  ┌──────────┐   ┌──────────┐   ┌─────────────┐                     │
│  │ Discovery │   │ HOT tier │   │Notification │                     │
│  │  6h cycle │   │  hourly  │   │ on new ep   │                     │
│  └─────┬─────┘   └─────┬────┘   └──────┬──────┘                     │
│        │               │               │                             │
│        ▼               ▼               │                             │
│  ┌─────────────────────────────┐       │                             │
│  │   PakParseOrchestrator      │       │                             │
│  │   - Scrape dramaxima        │       │                             │
│  │   - Create/update drama     │       │                             │
│  │   - Create/update episodes  │       │                             │
│  │   - Upload images ──────────┼──► ImageBan API                    │
│  │   - Store ImageBan URLs     │   (POST /v1, url=source)           │
│  └──────────┬──────────────────┘       │                             │
│             │                          │                             │
│             ▼                          ▼                             │
│  ┌─────────────────────────────────────────┐                        │
│  │              MySQL Database              │                        │
│  │  dramas: title, synopsis,               │                        │
│  │          poster_url, backdrop_url        │                        │
│  │          (all ImageBan URLs)             │                        │
│  │  episodes: title, thumbnail_url,        │                        │
│  │           air_date, source_url          │                        │
│  └───────────────────┬─────────────────────┘                        │
└──────────────────────┼───────────────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────┐
         │       NestJS API        │
         │  /dramas/:slug          │  ← existing (keep as-is)
         │  /episodes              │  ← existing (keep as-is)
         │  /home                  │  ← existing (keep as-is)
         │                         │
         │  NEW ENDPOINTS:         │
         │  /img/:id               │  ← image proxy (serves ImageBan)
         │  /v2/dramas/:slug       │  ← v2 with proxy image URLs
         │  /v2/home               │  ← v2 with proxy image URLs
         │  /v2/dramas/:slug/...   │  ← v2 episodes with proxy URLs
         └────────────┬────────────┘
                      │
                      ▼
         ┌─────────────────────────┐
         │       Flutter App       │
         │  - DB = single truth    │
         │  - Images via /img/:id  │
         │  - Cache via CachedNI   │
         │  - Fallback chain       │
         └─────────────────────────┘
```

---

## API Strategy: No Breaking Changes

**Rule: Existing APIs NEVER change. Only add new ones.**

| Existing Endpoint | Status | Notes |
|-------------------|--------|-------|
| `GET /dramas` | KEEP | Still works, returns old URLs |
| `GET /dramas/:slug` | KEEP | Still works |
| `GET /dramas/:slug/seasons/:n/episodes` | KEEP | Still works |
| `GET /episodes/:id` | KEEP | Still works |
| `GET /episodes/:id/resolve` | KEEP | Still works |
| `GET /home` | KEEP | Still works |

| New Endpoint | Purpose |
|-------------|---------|
| `GET /img/:imageId` | Image proxy — fetches from ImageBan, serves to app |
| `GET /v2/home` | Home feed with proxy image URLs |
| `GET /v2/dramas/:slug` | Drama detail with proxy image URLs |
| `GET /v2/dramas/:slug/seasons/:n/episodes` | Episodes with proxy image URLs |

Old v1 endpoints stay forever. When app is fully migrated (zero calls to v1), remove them from code.

---

## Part 1: ImageBan Integration

### API Details

| Field | Value |
|-------|-------|
| Base URL | `https://api.imageban.ru/v1` |
| Auth | `Authorization: Bearer {SECRET_KEY}` |
| Upload | `POST /v1` with `url` (string — source image URL) |
| Album | `album` param (organize by drama/episode) |
| Limits | 1,000 uploads/day (auth), 10,000/day (GOLD) |
| Max size | 10MB per image |
| Formats | JPEG, JPG, GIF, PNG |

### Upload Response

```json
{
  "data": [{
    "id": "JTXBeN4",
    "link": "https://i5.imageban.ru/out/2022/07/13/filename.jpeg",
    "short_link": "https://ibn.im/i/JTXBeN4",
    "resolution": "2000x3234",
    "size": "355593"
  }],
  "success": true,
  "status": 200
}
```

### Implementation: `PakImageService`

**File**: `nest/src/pak/services/pak-image.service.ts`

```typescript
@Injectable()
export class PakImageService {
  private readonly API_URL = 'https://api.imageban.ru/v1';
  private readonly SECRET_KEY = process.env.IMAGEBAN_SECRET_KEY;
  private readonly ALBUM_ID = process.env.IMAGEBAN_ALBUM_ID; // optional

  // Upload by URL — ImageBan fetches the image directly
  async uploadByUrl(sourceUrl: string): Promise<{ imagebanUrl: string; imageId: string } | null> {
    // 1. POST to ImageBan: { url: sourceUrl, album: ALBUM_ID }
    // 2. Return { imagebanUrl: data[0].link, imageId: data[0].id }
    // 3. On failure, return null
    // 4. Retry once on timeout/5xx
  }

  isImageBanUrl(url: string): boolean {
    return url.includes('imageban.ru');
  }
}
```

### When to Upload

| Event | Action |
|-------|--------|
| New drama discovered | Upload poster + backdrop to ImageBan immediately |
| Drama updated (poster changed) | Re-upload, update DB |
| New episode created | Upload thumbnail if available |
| Upload fails | Keep original URL as fallback, mark `*_hosted = 0`, retry next cron |
| **Phase 0 migration** | One-time: upload ALL existing drama/episode images that aren't on ImageBan yet |

### Phase 0: Bulk Migration (Run Once)

Before anything else, migrate all existing images:

```
1. Query all dramas WHERE poster_url IS NOT NULL AND poster_hosted = 0
2. For each drama:
   a. Upload poster_url to ImageBan → get ImageBan link + id
   b. Store imageban_id in new column
   c. Update poster_url = ImageBan link
   d. Set poster_hosted = 1
   e. Same for backdrop_url
3. Query all episodes WHERE thumbnail_url IS NOT NULL AND thumbnail_hosted = 0
4. Same upload flow
5. Rate limit: max 50 uploads per batch, 1s delay between uploads
```

This ensures from day 1, ALL images come from ImageBan.

### DB Changes

```sql
-- Track image hosting status + ImageBan IDs
ALTER TABLE dramas ADD COLUMN poster_imageban_id VARCHAR(20) NULL;
ALTER TABLE dramas ADD COLUMN backdrop_imageban_id VARCHAR(20) NULL;
ALTER TABLE dramas ADD COLUMN poster_hosted TINYINT(1) DEFAULT 0;
ALTER TABLE dramas ADD COLUMN backdrop_hosted TINYINT(1) DEFAULT 0;

ALTER TABLE episodes ADD COLUMN thumbnail_imageban_id VARCHAR(20) NULL;
ALTER TABLE episodes ADD COLUMN thumbnail_hosted TINYINT(1) DEFAULT 0;
```

---

## Part 2: Image Proxy Endpoint

### Why Proxy?

- App never hits ImageBan directly — all images go through our server
- We control caching, CDN, rate limiting
- If ImageBan goes down, we can swap to another host without app update
- Same pattern as Chinese anime apps

### Endpoint: `GET /img/:imageId`

**File**: `nest/src/pak/controllers/pak-image-proxy.controller.ts`

```
GET /api/pakistani-serials/img/JTXBeN4
  │
  ├─ Lookup imageban_id "JTXBeN4" in dramas/episodes table → get full ImageBan URL
  │  OR construct URL: https://i5.imageban.ru/out/.../{id}
  │
  ├─ Fetch image from ImageBan (with in-memory cache, TTL 1h)
  │
  ├─ Set response headers:
  │  Cache-Control: public, max-age=86400 (1 day)
  │  Content-Type: image/jpeg
  │
  └─ Stream image bytes to client
```

### How App Uses It

```
Old way (v1):
  posterUrl: "https://dramaxima.com/wp-content/uploads/poster.jpg"
  → App loads directly from dramaxima (can break, slow, geo-blocked)

New way (v2):
  posterUrl: "https://global.animekill.com/api/pakistani-serials/img/JTXBeN4"
  → App loads from our proxy → proxy fetches from ImageBan → cached
```

### Proxy Caching Strategy

```
Request flow:
  App → Nginx (proxy_cache 24h) → NestJS → ImageBan

Nginx already has proxy_cache configured for global.animekill.com.
Image responses cached at Nginx level for 24h.
NestJS only hits ImageBan on cache miss.
```

### URL Construction in v2 API Responses

All v2 endpoints transform image URLs before returning:

```typescript
function toProxyUrl(imagebanId: string | null): string | null {
  if (!imagebanId) return null;
  return `/api/pakistani-serials/img/${imagebanId}`;
}

// In v2 drama response:
{
  posterUrl: toProxyUrl(drama.posterImagebanId),    // "/api/pakistani-serials/img/JTXBeN4"
  backdropUrl: toProxyUrl(drama.backdropImagebanId), // "/api/pakistani-serials/img/K8mPqR2"
  ...
}
```

App prepends the base URL: `https://global.animekill.com/api/pakistani-serials/img/JTXBeN4`

---

## Part 3: Database as Single Source of Truth

### New Rule: DB = Truth

**Drama details** always come from `dramas` table:
- `title`, `synopsis`, `poster_url`, `backdrop_url` → always from DB
- If `poster_url` is NULL → API returns `null`, app shows placeholder
- If `synopsis` is NULL → API returns `null`, app shows "No description available"
- **No runtime scraping** for detail pages — everything stored at cron time

**Episodes** always come from `episodes` table:
- `number`, `title`, `synopsis`, `thumbnail_url`, `air_date` → from DB
- `source_url` → internal only, never exposed to app
- Videos → from `episode_videos` table

### What Cron Stores (Enriched Data)

| Field | Source | When |
|-------|--------|------|
| `title` | Scraped from drama page or "Episode N" | On creation |
| `synopsis` | Scraped from episode page (if available) | On creation |
| `thumbnail_url` | Scraped → uploaded to ImageBan → stored as ImageBan URL | On creation |
| `air_date` | From sitemap `lastmod` or scraped date | On creation |
| `poster_url` | Scraped → uploaded to ImageBan | On drama discovery |
| `backdrop_url` | Scraped → uploaded to ImageBan | On drama discovery |

### Drama Detail Enrichment (One-Time Per Drama)

When a new drama is discovered:

```
1. Create minimal record: title + slug + sourceUrl
2. Immediately fetch drama landing page
3. Extract: full synopsis, poster image, backdrop image
4. Upload poster + backdrop to ImageBan
5. Save all to DB: synopsis, poster_url, backdrop_url, imageban IDs
6. Mark poster_hosted = 1, backdrop_hosted = 1
7. Done — future API calls just read from DB
```

---

## Part 4: Cron Mechanism — Simplified

### Tier System

```
┌──────────┬───────────┬────────────────────────────────────────┐
│   Tier   │ Schedule  │ Criteria                               │
├──────────┼───────────┼────────────────────────────────────────┤
│ HOT      │ Hourly    │ ONGOING + last episode ≤ 9 days ago   │
│ WARM     │ Daily 3AM │ Last episode 9-30 days ago             │
│ COLD     │ Sun 3:45AM│ Dormant/Upcoming shows                 │
│ DISCOVERY│ Every 6h  │ Scan sitemap for NEW dramas            │
│ FROZEN   │ Never     │ COMPLETED, no sourceUrl, or banned     │
└──────────┴───────────┴────────────────────────────────────────┘
```

### Episode Detection Flow

```
1. Cron fires (e.g. HOT tier, hourly)
2. Acquire MySQL distributed lock (pak_parse_hot)
3. Query dramas matching tier criteria
4. For each drama (parallel max 3):
   a. Load local sitemap cache (stored in DB or file, refreshed every 1h)
   b. Parse sitemap for episode URLs matching drama's slug
   c. Compare with existing episodes in DB
   d. If new episodes found:
      i.   Create Episode records (number, title, sourceUrl, air_date)
      ii.  Scrape episode page for thumbnail (if available)
      iii. Upload thumbnail to ImageBan
      iv.  Save to DB with ImageBan URL
      v.   fillGaps() → create placeholders for missing numbers
      vi.  Update drama.totalEpisodes
      vii. Update drama.parse_last_modified
   e. Save ParseRun log with stats
5. Release lock
```

### Notification Flow (Per-Episode, No Duplicates)

```
Every 30 minutes:
1. Query episodes WHERE notification_sent = 0 AND is_published = 1
2. For EACH episode (not grouped by drama):
   a. Send FCM notification:
      - Title: "{Drama Title}"
      - Body: "Episode {N} is now available"
      - Topic: "pak_new_episode" (global)
      - Topic: "pak_drama_{slug}" (per-drama followers)
      - Data: { dramaSlug, episodeId, episodeNumber }
   b. UPDATE episode SET notification_sent = 1
3. Done — episode can NEVER trigger another notification

DB column needed:
  ALTER TABLE episodes ADD COLUMN notification_sent TINYINT(1) DEFAULT 0;
```

**Key rule:** One episode = one notification. Forever. The `notification_sent` flag is
permanent — no time-window checks, no "last 35 minutes" queries, no grouping by drama.
If 3 new episodes are found for a drama, user gets 3 separate notifications.

No extra notification mechanism needed — just the 30-min cron checking `notification_sent = 0`.

### Fingerprinting (Skip Unchanged Dramas)

```
Dramaxima sitemap has <lastmod> for each URL.
We store max(lastmod) as drama.parse_last_modified.
If sitemap lastmod == stored value → no new episodes → skip.
This avoids unnecessary HTTP requests for 95% of dramas.

Sitemap itself is cached locally (file/DB) and refreshed every 1h.
Parsing is local and fast — no HTTP request per drama.
```

### Failure Handling

```
1st failure  → retry in 15 min
2nd failure  → retry in 30 min
3rd failure  → retry in 1 hour
4th failure  → retry in 2 hours
5th failure  → FROZEN (manual review needed)

Error types:
- transient (network timeout)  → short backoff
- rate_limited (429)           → longer backoff
- permanent (404, parse error) → freeze for 7 days
```

---

## Part 5: Flutter App — Data & Edge Cases

### Data Flow

```
App opens → GET /v2/home → Show rails with DB data
  │
  ├─ Images: proxy URLs (/img/:id) → cached by CachedNetworkImage
  ├─ Titles: From DB (always present)
  ├─ Synopsis: From DB (may be null → show placeholder)
  └─ Episode count: From DB (drama.totalEpisodes)

User taps drama → GET /v2/dramas/:slug → Detail from DB
  │
  ├─ posterUrl: proxy URL or null → placeholder
  ├─ backdropUrl: proxy URL or null → use poster fallback
  ├─ synopsis: text or null → "No description available"
  ├─ genres: list or empty → hide section
  └─ cast: list or empty → hide section

User opens episodes → GET /v2/dramas/:slug/seasons/1/episodes
  │
  ├─ Episodes: From DB
  ├─ thumbnailUrl: proxy URL or null → use drama poster
  ├─ title: "Episode N" (always present)
  ├─ airDate: date or null → hide
  └─ playUrl: video URL or null → "Coming soon"
```

### Edge Cases — Frontend Handling

| Scenario | API Response | App Behavior |
|----------|-------------|--------------|
| Drama has no poster | `posterUrl: null` | Gradient placeholder with first letter of title |
| Drama has no synopsis | `synopsis: null` | "No description available" text |
| Drama has no episodes | `episodes: []` | "Episodes coming soon" state |
| Episode has no thumbnail | `thumbnailUrl: null` | Use drama's `posterUrl` as fallback |
| Episode has no video | `playUrl: null` | "Coming soon" badge, play button disabled |
| Episode has no air_date | `airDate: null` | Hide date chip |
| Proxy image fails to load | HTTP error on /img/:id | CachedNetworkImage error widget → placeholder |
| API returns 500 | Error response | Error screen with retry button |
| API returns empty data | `{ data: [] }` | "No content available" empty state |
| Drama was soft-deleted | 404 on /v2/dramas/:slug | "Content not available", pop back |
| Stale episode data | Old data in DB | Cron updates hourly for HOT dramas |
| ImageBan goes down | Proxy returns 502 | App shows placeholder, retries on next open |

### Image Fallback Chain

```
Episode thumbnail:
  1. /img/{thumbnailImagebanId} → try load
  2. If null → /img/{drama.posterImagebanId} → try load
  3. If null → gradient placeholder with episode number

Drama poster:
  1. /img/{posterImagebanId} → try load
  2. If null → gradient placeholder with first letter of title

Drama backdrop:
  1. /img/{backdropImagebanId} → try load
  2. If null → /img/{posterImagebanId}
  3. If null → dark gradient background
```

---

## Part 6: Implementation Phases

### Phase 0: Bulk Image Migration (One-Time)

1. Add `IMAGEBAN_SECRET_KEY` to `.env` and `.env.local`
2. Create `PakImageService` in `nest/src/pak/services/`
3. Add DB columns: `poster_imageban_id`, `backdrop_imageban_id`, `poster_hosted`, `backdrop_hosted` on dramas
4. Add DB columns: `thumbnail_imageban_id`, `thumbnail_hosted` on episodes
5. Write migration script: upload ALL existing images to ImageBan, store IDs
6. Run migration (rate-limited: 50/batch, 1s delay)

### Phase 1: Image Proxy Endpoint (Backend)

7. Create `GET /api/pakistani-serials/img/:imageId` proxy controller
   - Fetch from ImageBan by ID/URL
   - Set cache headers (Cache-Control: public, max-age=86400)
   - Stream image bytes
8. Add Nginx proxy_cache rule for `/api/pakistani-serials/img/` path (24h cache)
9. Add Swagger docs for the new endpoint

### Phase 2: Cron Enhancement (Backend)

10. Update `PakDramaximaDriver.importDrama()`:
    - On drama discovery: scrape synopsis, poster, backdrop from landing page
    - Upload images via `PakImageService` immediately
    - Store ImageBan URLs + IDs in DB
11. Update episode creation:
    - Scrape episode thumbnail (if available)
    - Upload to ImageBan
    - Store in DB
12. Ensure sitemap is cached locally (file/DB) and parsed locally — no HTTP per drama

### Phase 3: v2 API Endpoints (Backend)

13. Create `GET /v2/home` — same as `/home` but image URLs replaced with `/img/:id` proxy URLs
14. Create `GET /v2/dramas/:slug` — same but with proxy image URLs
15. Create `GET /v2/dramas/:slug/seasons/:n/episodes` — same but with proxy image URLs
16. **Existing v1 endpoints untouched** — zero breaking changes
17. Add Swagger docs for all v2 endpoints

### Phase 4: Flutter App Updates

18. Switch API base path from v1 to v2 endpoints
19. Add image fallback chain (placeholder widgets for null images)
20. Add empty states for all list screens
21. Add "Coming soon" state for episodes without video
22. Ensure CachedNetworkImage handles all error cases gracefully
23. Test all edge cases listed above

### Phase 5: Deprecation (Future — When v1 Has Zero Traffic)

24. Monitor v1 endpoint traffic via logs
25. When zero calls for 30 days, remove v1 code
26. Clean up unused fields/columns

---

## Edge Cases — Must Handle

### Notification Guard Rules

| Rule | Implementation |
|------|----------------|
| No notification for empty episodes | Only send when `episode_videos` has ≥1 active entry |
| No flood on first import | On drama discovery, set `notification_sent = 1` for all bulk-imported episodes |
| Flag AFTER FCM success | Set `notification_sent = 1` only after FCM returns success |
| fillGaps() episodes are silent | Placeholder episodes created by fillGaps() get `notification_sent = 1` (no video = no notification) |
| Title truncation | Truncate drama title to 50 chars in FCM body |

### ImageBan Guard Rules

| Rule | Implementation |
|------|----------------|
| Store full URL + ID | Keep both `poster_url` (full ImageBan URL) and `poster_imageban_id` in DB |
| Original URL backup | Add `poster_original_url` column — never overwritten, permanent fallback |
| Verify after upload | HEAD request on ImageBan URL before marking `hosted = 1` |
| Dead source image | If source URL 404s, mark `hosted = -1` (permanent fail), don't retry |
| Rate limit (429) | Exponential backoff, queue remaining for next cron cycle |
| Duplicate upload prevention | Check `poster_hosted = 1` before uploading |
| ImageBan health check | Weekly cron: HEAD request on random 10 stored URLs, alert if >50% fail |

### Proxy Guard Rules

| Rule | Implementation |
|------|----------------|
| Invalid imageId | Return 404 with empty body, not 500 |
| Store full URL in DB | Don't reconstruct URL from ID — use stored `poster_url` directly |
| Never redirect | Proxy streams bytes, never 302 |
| Timeout | 10s timeout on ImageBan fetch, return 504 if exceeded |

### Data Guard Rules

| Rule | Implementation |
|------|----------------|
| No video = "Coming soon" | API returns `playUrl: null` when no active videos |
| Placeholder episodes | Mark with `is_placeholder = 1`, app shows differently |
| Soft-delete cascade | Episode queries always filter `drama.deleted_at IS NULL` |
| COMPLETED drama re-check | DISCOVERY tier re-checks COMPLETED dramas monthly |

---

## Env Variables Required

```env
IMAGEBAN_SECRET_KEY=your_secret_key_here
IMAGEBAN_ALBUM_ID=optional_album_id
```

Get the key from: https://imageban.ru → Profile → API Settings

---

## Rate Limit Strategy

- 1,000 uploads/day on authenticated plan
- Phase 0 migration: ~200-300 existing images (one-time, spread across 1-2 days)
- Ongoing: ~5-10 new dramas/week × 2 images = 10-20/week
- New episodes: ~50-100/week × 0-1 thumbnail = 0-100/week
- Daily estimate after migration: ~20-30 images max
- Well within 1,000/day limit
