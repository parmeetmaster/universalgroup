# Architecture

## Overview

Pakistani Serials is a two-tier system:

```
┌──────────────────────────┐       HTTPS/HTTP       ┌──────────────────────────────┐
│  Flutter Android app     │ ◄─────────────────────► │  NestJS backend              │
│  (Clean Architecture +   │    JSON REST /v1/*      │  (Modular, TypeORM, MySQL)   │
│   BLoC)                  │                         │                              │
└──────────────────────────┘                         └──────────────────────────────┘
                                                                    │
                                                                    ▼
                                                            ┌───────────────┐
                                                            │  MySQL 8.x    │
                                                            │  pakistani_   │
                                                            │  serials DB   │
                                                            └───────────────┘
```

## Flutter — Clean Architecture + BLoC

**Layering** (per feature):

```
features/<name>/
├── data/
│   ├── datasources/     # Dio (remote) + drift (local)
│   ├── models/          # Freezed DTOs (.freezed.dart + .g.dart generated)
│   └── repositories/    # Implementations of domain contracts
├── domain/
│   ├── entities/        # Pure Dart business entities
│   ├── repositories/    # Abstract repo interfaces
│   └── usecases/        # Each is a single function (Invokable class)
└── presentation/
    ├── bloc/            # Events, States, Bloc itself
    ├── screens/         # Widget trees
    └── widgets/         # Feature-local widgets
```

**Dependency direction:** `presentation → domain ← data` (domain has no imports from the other two).

**State management:** `flutter_bloc` with `hydrated_bloc` for persisted blocs (Auth, Settings).

**DI:** `get_it` + `injectable`. Run `dart run build_runner build -d` after adding `@injectable` classes.

**Error handling:** Repositories return `Either<Failure, T>` (`dartz`). `Failure` subclasses: `ServerFailure`, `NetworkFailure`, `UnauthorizedFailure`, `ValidationFailure`, `UnknownFailure`.

**Routing:** `go_router` with a central `app_router.dart`. Auth guard redirects unauthenticated users to `/auth`.

## Backend — Modular NestJS

**Module skeleton:**

```
src/
├── main.ts                  # Bootstrap, global pipes/interceptors/filters, Swagger
├── app.module.ts            # Root module
├── common/                  # Shared: interceptors, filters, guards, decorators, pipes, DTOs
├── config/                  # Typed config factories (app, database, jwt, google)
├── entities/                # TypeORM entity classes (one per table)
├── migrations/              # TypeORM migrations
├── seed/                    # Idempotent seed runner
└── modules/
    ├── health/
    ├── auth/
    ├── users/
    ├── content/
    ├── episodes/
    ├── genres/
    ├── search/
    ├── home/
    ├── watchlist/
    ├── watch-history/
    ├── ratings/
    └── admin/
```

**Response envelope** (applied globally):

Success: `{ "success": true, "data": <payload>, "meta"?: { page, limit, total } }`
Error:   `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details"?: [...] } }`

**Auth:** Passport JWT bearer tokens. Access token 15min, refresh token 30d (stored hashed in `auth_refresh_tokens`). Google OAuth via ID-token exchange (`/v1/auth/google`).

**Rate limits** (`@nestjs/throttler`): auth 5/min/IP, watch-progress 60/min/user, public reads 120/min/IP.

**API versioning:** URI-based `/v1/*`. Future versions via `/v2/*`.

**Swagger:** `/v1/docs` — auto-generated from `@ApiProperty`/`@ApiTags`/`@ApiResponse` decorators.

## Data model

See `docs/SCHEMA.md` (generated in Phase 3).

Key design choices:
- **`content_type` enum** on `content` table — future expansion to movies, Turkish dubs, live TV without migration.
- **`home_rails` + `home_rail_items`** — admin-curated home feed, fully dynamic; no hard-coded sections.
- **`watch_history` denormalizes `content_id`** — fast "continue watching" query without joining episodes.

## Infrastructure

- **Server:** Hetzner / Contabo box at `194.163.133.119` (pre-existing).
- **Panel:** aaPanel (BT) at `/www/`.
- **Process manager:** PM2 (already managing animekill stack).
- **Web server:** Nginx (at `/www/server/panel/vhost/nginx/`) — currently not used for Pakistani Serials (IP+port only in MVP).
- **DB:** MySQL 8.x, shared instance. Dedicated DB `pakistani_serials` + dedicated user `pakistani_serials_user` scoped to that DB.
