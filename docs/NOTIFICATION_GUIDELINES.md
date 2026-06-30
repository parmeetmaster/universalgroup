# Notification Guidelines (Universal Apps)

Mandatory rules for **every app** in this monorepo. All notifications — FCM topic-based, FCM token-based, or local — must follow these guidelines without exception.

---

## 1. Notification Priority System

Every notification carries a `notification_priority` enum value from the backend payload. The app must map this value to the correct Android channel and behavior.

### Priority Enum

| Value | Channel ID | Sound | Vibration | Heads-Up | Status Bar |
|-------|-----------|-------|-----------|----------|------------|
| `silent_medium` | `{app}_silent_medium` | None | None | No | Yes (icon only) |
| `silent_high` | `{app}_silent_high` | None | None | Yes | Yes (icon only) |
| `invisible` | `{app}_invisible` | None | None | No | No (data-only, no UI) |
| `sound_medium` | `{app}_sound_medium` | Custom | Default | No | Yes |
| `sound_high` | `{app}_sound_high` | Custom | Default | Yes | Yes |

### Rules

- **Default (no priority in payload):** `silent_medium` — no sound, no vibration, medium importance
- **Custom sound:** All `sound_*` channels must use a custom `.mp3`/`.ogg` file bundled in the app (`res/raw/` on Android, asset on iOS). Never use the system default sound.
- **Silent channels must NEVER play sound.** This is the #1 testing requirement. Configure `playSound: false`, `sound: null`, `enableVibration: false` explicitly. Do not rely on defaults.
- Each channel must be created at app startup with the exact settings above. Android channels are immutable after creation — if settings change, create a new channel ID (e.g., `{app}_silent_medium_v2`).

### Backend Payload Format

```json
{
  "data": {
    "notification_priority": "sound_high",
    "title": "New Episode Available",
    "body": "Drama XYZ Episode 10 is now streaming",
    "action": "open_screen",
    "target": "/drama/xyz",
    "image_url": "https://..."
  }
}
```

**Important:** All notifications must be sent as **data-only messages** (no `notification` block). The app constructs the local notification using the custom notification handler. This is required for DND and priority control to work.

---

## 2. Notification Actions

Every notification payload **must** include an `action` field. The app must support these 3 actions — no notification is valid without one of them.

### Required Actions

| Action | Field | Behavior |
|--------|-------|----------|
| `open_screen` | `target` (route path) | Navigate to the specified in-app screen. If the app is killed, store the target and navigate after cold start. |
| `process_data` | `payload` (JSON string) | Process data silently in background — sync, update cache, mark as read, etc. No UI navigation. |
| `open_url` | `url` (full URL) | Open the URL in the system browser via `url_launcher` / `Intent.ACTION_VIEW`. |
| `update_app` | `store_url` (optional) | Navigate user to the app's Play Store / App Store listing for update. If `store_url` is provided, use it; otherwise auto-resolve from package name. |

### Rules

- If `action` is missing or unrecognized, treat as `open_screen` with `target` = home screen.
- `open_screen` must work in all 3 app states: foreground, background, and terminated (cold start).
- `process_data` must never show any UI or navigation — purely background processing.
- `open_url` must validate the URL before launching. Invalid URLs = no-op + log error.

### Tap Handling Priority

```
1. Check `action` field
2. If `update_app`               -> open Play Store / App Store listing
3. If `open_url` and valid URL   -> launch external browser
4. If `open_screen` and `target` -> navigate in-app
5. If `process_data`             -> process silently, no navigation
6. Fallback                      -> navigate to home screen
```

---

## 3. DND (Do Not Disturb) — Daylight-Only Notifications

Notifications must **only be shown during daylight hours** in the user's local timezone. This is non-negotiable for every app.

### Allowed Window

**Default:** `08:00 — 23:00` (local time of user's country)

**Server override:** The app's init/home API (`app_config` or first API call) may return `notification_start_time` and `notification_end_time` fields. If present, these override the defaults.

#### App Config Response

```json
{
  "data": {
    "notification_start_time": "09:00",
    "notification_end_time": "22:00",
    "...": "..."
  }
}
```

| Field | Format | Default | Example |
|-------|--------|---------|---------|
| `notification_start_time` | `HH:mm` (24h) | `08:00` | `09:00` |
| `notification_end_time` | `HH:mm` (24h) | `23:00` | `22:00` |

#### Rules

- Both fields are optional. If only one is provided, use the default for the other.
- Values must be valid 24h time strings. If malformed, ignore and use defaults.
- `start` must be before `end` (no overnight windows like 23:00-06:00). If `start >= end`, ignore both and use defaults.
- Cache the values locally (SharedPreferences / DataStore). Use cached values if the API hasn't been called yet (e.g., app killed, notification arrives before init).
- Re-fetch on every app launch. If the server changes the window, the new values take effect from the next app start.
- The queued notification delivery time = `notification_start_time` (not hardcoded 8 AM).

Outside this window, notifications are **queued** and shown at `notification_start_time` the next morning.

### Implementation

#### Step 1: Detect User Country (App Start)

On every app launch, detect the user's country:
1. Primary: device locale (`Localizations.localeOf(context).countryCode` / `Locale.getDefault().country`)
2. Fallback: timezone-to-country mapping (`DateTime.now().timeZoneOffset`)
3. Cache the country code in local storage. Re-detect on each app start.

#### Step 2: Custom Notification Handler

**Do NOT use Firebase's built-in notification display.** All notifications must be **data-only messages** handled by the app's custom notification code.

```
On FCM data message received:
  1. Read `notification_priority` from payload
  2. If priority == `invisible` -> process data, skip display
  3. Get current local time
  4. If time is between 08:00 and 23:00:
     -> Show notification immediately via local notification API
  5. If time is outside 08:00-23:00 (DND hours):
     -> Store in local DB/SharedPreferences queue
     -> Schedule display at 08:00 next morning
  6. On app start, check queue and display any pending notifications
```

#### Step 3: Scheduled Queue Processing

- Use `AlarmManager` (Android) / `workmanager` (Flutter) to trigger at 08:00 AM daily.
- Process all queued notifications, show them with their original priority.
- If multiple notifications are queued, show the most recent one only (see Rule 4 — one notification only).
- Clear the queue after processing.

### Rules

- DND applies to ALL notification priorities including `sound_high`.
- `invisible` (data-only) notifications are exempt from DND — they process immediately since they have no UI.
- The 08:00-23:00 window is in the **user's local time**, not UTC or server time.
- Never wake the user with a notification. If in doubt, queue it.

---

## 4. One Notification Only (Topic-Based)

For **topic-based** FCM notifications, only the latest notification should be visible. When a new topic notification arrives, remove all previous topic notifications.

### Rules

| Notification Source | Behavior |
|-------------------|----------|
| **Topic-based** (subscribed topics) | Replace previous — only 1 visible at a time. Use a fixed notification ID per topic group. |
| **Token-based** (targeted to device) | Stack normally — each gets a unique ID. Do not remove previous. |

### Implementation

- **Topic notifications:** Use a single fixed notification ID (e.g., `1` or hash of topic name). Showing a new notification with the same ID automatically replaces the old one.
- **Token notifications:** Use unique/incremented notification IDs so they stack.
- The backend payload must include `source: "topic"` or `source: "token"` so the app can distinguish them.
- On notification tap, cancel **all** notifications (both topic and token) to keep the shade clean.

### Backend Payload Addition

```json
{
  "data": {
    "source": "topic",
    "...": "..."
  }
}
```

---

## 5. Default Notification Behavior

When the user has not configured any notification preferences:

| Setting | Default Value |
|---------|--------------|
| Priority | `silent_medium` |
| Sound | **OFF** (no sound plays) |
| Vibration | **OFF** |
| Heads-up | **No** |
| DND | **ON** (08:00-23:00 window active) |

**The default experience is completely silent.** The notification appears in the status bar and notification shade without any sound or vibration. The user must explicitly opt-in to sound notifications through in-app settings.

### User Preferences Storage

```
Key: notification_sound_enabled  (bool, default: false)
Key: notification_priority_pref  (string, default: "silent_medium")
```

If `notification_sound_enabled == false`, force all notifications to `silent_medium` regardless of the backend payload priority. The backend priority is only respected when the user has enabled sound.

---

## 6. Testing Checklist (Mandatory for AI & Developers)

Before shipping any notification-related code, **every single scenario below must be verified.** Do not skip any.

### Sound vs Soundless Verification

| # | Test Case | Expected Result | Pass? |
|---|-----------|-----------------|-------|
| 1 | Send `silent_medium` notification | Notification appears. **NO sound. NO vibration.** | |
| 2 | Send `silent_high` notification | Notification appears as heads-up. **NO sound. NO vibration.** | |
| 3 | Send `invisible` notification | **Nothing visible** to user. Data processed in background. | |
| 4 | Send `sound_medium` with user sound OFF | **NO sound.** Treated as `silent_medium`. | |
| 5 | Send `sound_medium` with user sound ON | Custom sound plays. Notification in shade. | |
| 6 | Send `sound_high` with user sound ON | Custom sound plays. Heads-up notification. | |
| 7 | Send notification with no `notification_priority` | Defaults to `silent_medium`. **NO sound.** | |

### DND Verification

| # | Test Case | Expected Result | Pass? |
|---|-----------|-----------------|-------|
| 8 | Send notification at 2:00 AM local time | Notification **NOT shown**. Queued for 8:00 AM. | |
| 9 | Send notification at 10:00 AM local time | Notification shown immediately. | |
| 10 | Send notification at 11:30 PM local time | Notification **NOT shown**. Queued for 8:00 AM. | |
| 11 | Open app at 8:00 AM with queued notifications | Queued notification displayed. | |

### Action Verification

| # | Test Case | Expected Result | Pass? |
|---|-----------|-----------------|-------|
| 12 | Tap notification with `action: open_screen` | App opens, navigates to `target` screen. | |
| 13 | Tap notification with `action: open_url` | System browser opens with the URL. | |
| 14 | Receive notification with `action: process_data` | Data processed silently. No UI. | |
| 15 | Tap notification with `action: update_app` | Play Store / App Store opens to app listing. | |
| 16 | Tap notification with missing `action` | App opens to home screen. | |

### One-Notification-Only Verification

| # | Test Case | Expected Result | Pass? |
|---|-----------|-----------------|-------|
| 17 | Send 3 topic notifications in sequence | Only the **last one** visible in shade. | |
| 18 | Send 3 token notifications in sequence | All 3 visible (stacked). | |
| 19 | Tap any notification | **All** notifications cleared from shade. | |

### Edge Cases

| # | Test Case | Expected Result | Pass? |
|---|-----------|-----------------|-------|
| 20 | App killed + notification received | Notification displayed (if in daylight window). | |
| 21 | App killed + tap notification | App cold starts, navigates to correct screen. | |
| 22 | No internet + queued notifications at 8 AM | Queued notifications shown from local storage. | |
| 23 | Phone rebooted with pending queue | 8 AM alarm re-scheduled, queue processed. | |

---

## Sample API Responses

### App Config API (Init / Home)

**Endpoint:** `GET /api/{app}/app-config`

```json
{
  "success": true,
  "data": {
    "app_name": "Pakistani Serials",
    "version": "1.2.0",
    "force_update": false,
    "ads_enabled": true,
    "notification_start_time": "08:00",
    "notification_end_time": "23:00"
  }
}
```

Custom window example (Ramadan schedule — start late, end early):

```json
{
  "success": true,
  "data": {
    "notification_start_time": "10:00",
    "notification_end_time": "01:00"
  }
}
```

Fields omitted = use defaults (`08:00` / `23:00`):

```json
{
  "success": true,
  "data": {
    "app_name": "Pakistani Serials",
    "version": "1.2.0"
  }
}
```

---

### FCM Data Payloads (Backend → Device)

#### 1. New Episode — Silent (Default)

```json
{
  "data": {
    "notification_priority": "silent_medium",
    "source": "topic",
    "action": "open_screen",
    "target": "/drama/deewar/episode/6",
    "title": "Deewar",
    "body": "Episode 6 is now streaming",
    "image_url": "https://cdn.example.com/posters/deewar.jpg"
  }
}
```

#### 2. New Episode — With Sound (High Priority)

```json
{
  "data": {
    "notification_priority": "sound_high",
    "source": "topic",
    "action": "open_screen",
    "target": "/drama/marg-e-wafa/episode/8",
    "title": "Marg E Wafa",
    "body": "Episode 8 is now streaming",
    "image_url": "https://cdn.example.com/posters/marg-e-wafa.jpg"
  }
}
```

#### 3. Force Update — Update App Action

```json
{
  "data": {
    "notification_priority": "sound_high",
    "source": "token",
    "action": "update_app",
    "store_url": "https://play.google.com/store/apps/details?id=com.pakistanidrama.serial",
    "title": "Update Available",
    "body": "A new version is available with exciting features. Update now!"
  }
}
```

#### 4. Promotional Link — Open URL Action

```json
{
  "data": {
    "notification_priority": "sound_medium",
    "source": "token",
    "action": "open_url",
    "url": "https://example.com/ramadan-special",
    "title": "Ramadan Special",
    "body": "Check out our curated Ramadan drama collection"
  }
}
```

#### 5. Silent Data Sync — Process Data Action

```json
{
  "data": {
    "notification_priority": "invisible",
    "source": "token",
    "action": "process_data",
    "payload": "{\"clear_cache\": true, \"refresh_home\": true}"
  }
}
```

#### 6. No Priority (Falls Back to Silent Medium)

```json
{
  "data": {
    "source": "topic",
    "action": "open_screen",
    "target": "/drama/zabt/episode/25",
    "title": "Zabt",
    "body": "Episode 25 is now streaming"
  }
}
```

#### 7. Silent High — Heads-Up Without Sound

```json
{
  "data": {
    "notification_priority": "silent_high",
    "source": "topic",
    "action": "open_screen",
    "target": "/drama/khuda-gawah/episode/46",
    "title": "Khuda Gawah",
    "body": "Episode 46 is now streaming",
    "image_url": "https://cdn.example.com/posters/khuda-gawah.jpg"
  }
}
```

---

## Quick Reference: Backend Payload Template

```json
{
  "data": {
    "notification_priority": "silent_medium | silent_high | invisible | sound_medium | sound_high",
    "source": "topic | token",
    "action": "open_screen | process_data | open_url | update_app",
    "target": "/screen/path",
    "url": "https://example.com",
    "payload": "{\"key\": \"value\"}",
    "store_url": "https://play.google.com/store/apps/details?id=com.example.app",
    "title": "Notification Title",
    "body": "Notification body text",
    "image_url": "https://..."
  }
}
```

### Field Requirements

| Field | Required | Default |
|-------|----------|---------|
| `notification_priority` | No | `silent_medium` |
| `source` | Yes | — |
| `action` | Yes | `open_screen` (fallback) |
| `target` | If action=open_screen | Home screen |
| `url` | If action=open_url | — |
| `payload` | If action=process_data | — |
| `store_url` | If action=update_app | Auto-resolve from package name |
| `title` | Yes (except invisible) | — |
| `body` | Yes (except invisible) | — |
| `image_url` | No | — |
