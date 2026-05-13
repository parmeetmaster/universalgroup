# Changelog — Universal Apps

## 2026-05-12

### Pakistani Serials — Flutter App (`pakistani_serials/`)
- **API URL switched**: Default from `pak-ott.animekill.com/v1` → `global.animekill.com/api/pakistani-serials`
- **Firebase setup**: New project `pakistani-serials-app` — Analytics, Crashlytics, Performance integrated
- **Recent Releases rail**: New horizontal section on home screen showing dramas sorted by latest episode
- **Last episode date**: Detail page meta row shows when latest episode was added (Today/Yesterday/3d ago/May 10)
- **ContentModel**: Added `lastEpisodeAt` field
- **ApiService**: Fixed `listContent()` to use `unwrap()`, `getAppConfig()` reads raw JSON (no wrapper)

### Pakistani Serials — NestJS Backend (`nest/src/pak/`)
- **TransformInterceptor**: Added `{ success: true, data: ... }` wrapper on home, dramas, episodes, genres, search controllers (config excluded — splash reads raw)
- **Recent Releases rail**: `home.service.ts` — built-in rail querying dramas by latest episode `created_at`, excludes broken dramaxima placeholder images
- **Drama detail `lastEpisodeAt`**: `dramas.service.ts` — returns `MAX(COALESCE(air_date, created_at))` from episodes
- **Privacy/Terms pages**: `nest/src/pak/pages/` — HTML pages served at `/api/pakistani-serials/pages/privacy` and `/terms`
- **DB config updated**: `privacy_url` and `terms_url` now point to global API pages
- **Notification cron (30min)**: `nest/src/pak/notifications/` — checks for new episodes every 30 min, sends FCM topic notifications (`pak_new_episode` global + `pak_drama_{slug}` per-drama)
- **Firebase service account**: `pakistani-serials-app` deployed at `/www/wwwroot/global-api/firebase/pak-firebase.json`
- **Sent notifications table**: `pak_sent_notifications` — tracks notified episodes, primes 200 on first run

### Super Video Downloader (`super-video-downloader/`)
- **403 manifest refresh**: When HLS manifest URL returns 403 (expired token), attempts yt-dlp re-resolve from page URL to get fresh m3u8 URL before failing. Applies to both VOD and live downloads.
- **FFmpeg merge fix**: Changed `joinToString(" ")` → `executeWithArgumentsAsync(argsArray)` in `DownloaderUtils.executeMerge()` — fixes file paths with special chars breaking FFmpeg.
- **4th merge attempt**: Added full re-encode fallback (libx264+aac) when all copy attempts fail.
- **Subtitle sync for Dailymotion**: Detects pre-roll ad duration from `#EXT-X-DISCONTINUITY` markers in HLS segments. Writes `ad_preroll_offset.txt` → subtitle sync cascade reads it and shifts subtitles forward by ad duration. Fixes subtitle desync on Dailymotion and similar ad-embedded streams.

### Dashboard (`src/`)
- **ADMIN_TOKEN**: Set in server `.env.local` (was empty, causing 403 on devices page)

### Deploy (`deploy.sh`)
- **NVM fix**: Replaced slow `nvm.sh` source with direct PATH to node v20.20.2
- **Rsync fix**: Exclude `.next/cache/` from rsync, stop dashboard before upload to prevent file conflicts

### Ecosystem Config
- **PAK_FIREBASE_PATH**: Added to `ecosystem.config.js` for notification cron

### Memory
- Updated all project memory files — full monorepo structure, all 4 mobile apps, NestJS backend details
- Default emulator: `virgin_mobile_3` (emulator-5556) for all apps
- `pak-ott.animekill.com` deprecated, global API is the backend
