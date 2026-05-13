# API Conventions

## Versioning

All endpoints live under `/v1/*`. Future breaking changes ship as `/v2/*`.

## Base URLs

| Env | URL |
|---|---|
| Local | `http://localhost:3008/v1` |
| Prod | `http://pak-ott.animekill.com/v1` (nginx → 127.0.0.1:786) |

## Response envelope

**Success (200/201):**
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 150 }
}
```
`meta` is optional, used only on paginated list endpoints.

**Error (4xx/5xx):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [ { "field": "email", "constraint": "isEmail" } ]
  }
}
```

### Error codes

| HTTP | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | DTO validation failed — `details` lists per-field issues |
| 401 | `UNAUTHORIZED` | Missing/invalid/expired token |
| 403 | `FORBIDDEN` | Authenticated but insufficient role |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Duplicate (e.g. email already registered) |
| 422 | `BUSINESS_RULE` | Request valid but blocked by business rule (e.g. banned user) |
| 429 | `RATE_LIMITED` | Throttler triggered |
| 500 | `INTERNAL_ERROR` | Server error |

## Auth

Bearer token in `Authorization` header:
```
Authorization: Bearer <access-token>
```

- **Access token**: JWT, 15-minute TTL, claims `{ sub, role, iat, exp }`
- **Refresh token**: opaque, 30-day TTL, stored hashed server-side, rotated on every refresh

### Flows

- **Signup** `POST /v1/auth/signup` → returns `{ user, accessToken, refreshToken }`
- **Login** `POST /v1/auth/login` → returns `{ user, accessToken, refreshToken }`
- **Refresh** `POST /v1/auth/refresh` with `{ refreshToken }` → returns new pair
- **Logout** `POST /v1/auth/logout` (authed) → revokes current refresh token
- **Google** `POST /v1/auth/google` with `{ idToken }` → same envelope as signup/login
- **Me** `GET /v1/auth/me` (authed) → returns `{ user }`

## Pagination

Query params: `?page=1&limit=20` (max 50). Response `meta` includes `page`, `limit`, `total`.

## Filtering & search

Common query params on list endpoints:
- `q` — free-text search
- `content_type` — `drama` | `movie` | `turkish_dub` | `live_tv`
- `genre_slug` — genre slug
- `status` — `ongoing` | `completed` | `upcoming`
- `year` — release year
- `sort` — `newest` | `popular` | `rating` (default `newest`)

## Rate limits

| Scope | Limit |
|---|---|
| Auth endpoints | 5 req/min per IP |
| `POST /watch-history` | 60 req/min per user |
| Public reads | 120 req/min per IP |
| Admin writes | 60 req/min per user |

When hit: 429 with `error.code = RATE_LIMITED`.

## Swagger

`GET /v1/docs` — interactive OpenAPI spec, covers all modules.
`GET /v1/docs-json` — raw OpenAPI JSON.

## Timestamps

All timestamps are ISO 8601 UTC: `2026-04-19T10:15:30.123Z`.

## IDs

All IDs are positive integers (BIGINT in DB, `number` in JSON).
