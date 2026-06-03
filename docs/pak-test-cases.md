# Pakistani Serials — Test Cases

## API Tests (NestJS Backend)

### 1. Image Proxy Endpoint (`GET /api/pakistani-serials/img/:imageId`)

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 1.1 | Valid imageId (drama poster) | Upload a drama with posterImagebanId, call `/img/{id}` | 200, image/jpeg content, Cache-Control: public max-age=86400 |
| 1.2 | Valid imageId (episode thumb) | Upload episode with thumbnailImagebanId, call `/img/{id}` | 200, image streamed correctly |
| 1.3 | Invalid imageId | Call `/img/NONEXISTENT123` | 404, empty body |
| 1.4 | ImageBan down / timeout | Mock ImageBan returning 500 or timeout | 502 or 504 respectively |
| 1.5 | Cache headers present | Any valid image request | `Cache-Control: public, max-age=86400, immutable` header present |
| 1.6 | No redirect | Proxy should stream bytes | Response must NOT be 302/301 |
| 1.7 | Large image | Upload 5MB image, proxy it | Streams without memory issues |
| 1.8 | Concurrent requests same ID | 10 parallel requests for same imageId | All return 200, in-memory cache kicks in after first |

### 2. v2 Home Feed (`GET /api/pakistani-serials/v2/home`)

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 2.1 | Returns proxy URLs | Call `/v2/home` | All posterUrl/backdropUrl start with `/api/pakistani-serials/img/` |
| 2.2 | Fallback to original | Drama with no imagebanId but has posterUrl | posterUrl returns original URL |
| 2.3 | Null image | Drama with no poster at all | posterUrl: null |
| 2.4 | Internal fields hidden | Check response body | No posterImagebanId, posterHosted, sourceUrl, parse* fields |
| 2.5 | v1 still works | Call `/home` (old) | Returns same data as before, no proxy URLs |

### 3. v2 Drama Detail (`GET /api/pakistani-serials/v2/dramas/:slug`)

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 3.1 | Proxy URLs in response | Call `/v2/dramas/meray-paas-tum-ho` | posterUrl and backdropUrl are proxy URLs |
| 3.2 | Drama not found | Call `/v2/dramas/nonexistent-slug` | 404 |
| 3.3 | Soft-deleted drama | Call slug of deleted drama | 404 |
| 3.4 | Genres + cast included | Valid slug | genres and cast arrays present |

### 4. v2 Episodes (`GET /api/pakistani-serials/v2/dramas/:slug/seasons/:n/episodes`)

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 4.1 | Proxy thumbnail URLs | Call episodes endpoint | thumbnailUrl is proxy URL or drama poster fallback |
| 4.2 | Episode with no thumbnail | Episode where thumbnailImagebanId is null | Falls back to drama posterUrl proxy |
| 4.3 | Episode with no video | Episode with 0 active videos | playUrl: null |
| 4.4 | Placeholder episode | Episode with isPlaceholder=1 | Still returned but marked appropriately |
| 4.5 | Internal fields hidden | Check response | No notificationSent, isPlaceholder, sourceUrl |

### 5. PakImageService (Unit)

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 5.1 | Upload success | Call uploadByUrl with valid URL | Returns { imagebanUrl, imagebanId } |
| 5.2 | Already ImageBan URL | Call uploadByUrl("https://i5.imageban.ru/...") | Returns null (skip) |
| 5.3 | No API key | IMAGEBAN_SECRET_KEY not set | Returns null, logs warning |
| 5.4 | Rate limited (429) | Mock 429 response | Retries once with 5s delay, then returns null |
| 5.5 | Timeout | Mock slow response | Retries once, then returns null |
| 5.6 | Invalid response | Mock success but empty data[] | Returns null |
| 5.7 | Verify fails | Upload succeeds but HEAD returns 404 | Returns null |

### 6. Notification Cron

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 6.1 | New episode with video | Create episode with notificationSent=0, add active video | FCM sent, notificationSent set to 1 |
| 6.2 | New episode NO video | Create episode with notificationSent=0, no videos | NOT notified (skipped) |
| 6.3 | Placeholder episode | Episode with isPlaceholder=1, notificationSent=0 | NOT notified |
| 6.4 | Already sent | Episode with notificationSent=1 | NOT notified again |
| 6.5 | FCM fails | Mock FCM failure | notificationSent stays 0, retries next cycle |
| 6.6 | Batch limit | Create 30 unsent episodes | Only 20 processed per run |
| 6.7 | Per-episode (no grouping) | 3 new episodes for same drama | 3 separate notifications sent |
| 6.8 | Long title | Drama title > 50 chars | Truncated to 47 + "..." in notification |
| 6.9 | First deploy priming | Empty sentNotifications table | 200 recent episodes marked as sent, no notifications |
| 6.10 | Unpublished drama | Episode for unpublished drama | NOT notified |

---

## Flutter App Tests

### 7. Image Loading

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 7.1 | Proxy URL loads | Drama with proxy posterUrl | Image loads from proxy endpoint |
| 7.2 | Relative URL resolved | posterUrl = "/api/pakistani-serials/img/ABC" | Prepends base domain, loads correctly |
| 7.3 | Absolute URL passthrough | posterUrl = "https://..." (legacy) | Loads directly without modification |
| 7.4 | Null posterUrl | Drama with posterUrl: null | Shows gradient placeholder with first letter |
| 7.5 | Image load error | Proxy returns 502 | Shows placeholder, no crash |
| 7.6 | Episode no thumbnail | thumbnailUrl: null | Uses drama poster as fallback |
| 7.7 | No poster, no thumbnail | Both null | Shows gradient placeholder with episode number |
| 7.8 | Backdrop fallback | backdropUrl: null | Uses posterUrl, then gradient |

### 8. Empty States

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 8.1 | No episodes | Drama with 0 episodes | Shows "Episodes coming soon" |
| 8.2 | Episode no video | Episode with playUrl: null | Shows "Coming soon" badge, play disabled |
| 8.3 | No dramas in genre | Genre with 0 dramas | Shows "No content available" |
| 8.4 | API error | Server returns 500 | Error screen with retry button |
| 8.5 | No search results | Search returns empty | "No results found" state |

### 9. Data Integrity

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 9.1 | v2 endpoints used | Monitor network calls | All calls go to /v2/ paths |
| 9.2 | No v1 calls | Check network log | Zero calls to old /dramas, /home etc. |
| 9.3 | Genres displayed | Drama detail page | Genres shown if available, hidden if empty |
| 9.4 | Cast displayed | Drama detail page | Cast shown if available, hidden if empty |
| 9.5 | Episode air_date null | Episode without air_date | Date chip hidden, no crash |

### 10. Offline / Error

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 10.1 | Offline mode | Turn off network | Cached images visible, error screen for data |
| 10.2 | Slow network | Throttle to 2G | Loading shimmer shown, eventually loads |
| 10.3 | Notification deep link | Tap FCM notification | Opens correct drama/episode page |

---

## Manual Test Checklist (Before Release)

- [ ] Open app → home feed loads with images
- [ ] Tap drama → detail page shows poster, backdrop, synopsis
- [ ] Open episodes → list shows with thumbnails or fallbacks
- [ ] Tap episode → video plays
- [ ] Episode with no video → shows "Coming soon"
- [ ] Drama with no poster → gradient placeholder visible
- [ ] Kill app, wait for new episode cron → notification received
- [ ] Tap notification → opens correct drama
- [ ] Turn off internet → cached images still show
- [ ] Turn on internet → data refreshes
- [ ] Check v1 endpoints still work (backward compatibility)
