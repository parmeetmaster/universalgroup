# CLAUDE.md — pakistani_serials (Flutter app)

Netflix-style Android app for Pakistani dramas. Flutter 3.41.5 (via fvm).

## Rules

### End-to-end verification (MANDATORY)
After any UI or screen change, launch the app on an Android emulator/device and verify:
1. Screen renders without red screen
2. Data loads from the backend (point at local `http://localhost:3008/v1` or prod `http://pak-ott.animekill.com/v1`)
3. Loading, error, and empty states all behave correctly
4. Back-navigation works

Do NOT mark a UI task done without visual verification. `flutter analyze` / `flutter test` verify code correctness, not feature correctness.

## Commands

```bash
fvm flutter pub get
fvm flutter run --dart-define=API_BASE_URL=http://localhost:3008/v1
fvm flutter run --release --dart-define=API_BASE_URL=http://pak-ott.animekill.com/v1
dart run build_runner build --delete-conflicting-outputs
fvm flutter gen-l10n
fvm flutter test
fvm flutter analyze
fvm flutter build apk --release --dart-define=API_BASE_URL=http://pak-ott.animekill.com/v1
```

## Architecture — Clean + BLoC

```
lib/
├── main.dart, app.dart, bootstrap.dart
├── core/
│   ├── config/env.dart              (String.fromEnvironment)
│   ├── theme/                       (app_theme, colors, typography, spacing, gradients, radii + components/)
│   ├── router/                      (app_router, routes, guards)
│   ├── network/                     (dio_client, auth_interceptor, error_interceptor, api_result)
│   ├── error/                       (failure, exceptions)
│   ├── usecase/usecase.dart         (abstract UseCase<T, Params>)
│   ├── util/                        (date_formatter, haptics, image_precache)
│   └── widgets/                     (gradient_button, shimmer_placeholder, glass_card, error_view, empty_view)
├── di/                              (injection.dart + injection.config.dart [generated] + modules.dart)
├── l10n/arb/{app_en,app_ur}.arb     (generated into lib/l10n/generated/)
└── features/<feature>/
    ├── data/{datasources,models,repositories}/
    ├── domain/{entities,repositories,usecases}/
    └── presentation/{bloc,screens,widgets}/
```

State: `flutter_bloc` + `hydrated_bloc` (for Auth / Settings). NEVER `setState` in feature screens — always Bloc.
DI: `get_it` + `injectable`. Run `dart run build_runner build --delete-conflicting-outputs` after adding `@injectable` classes or `freezed`/`json_serializable` models.
Routing: `go_router`. Central `app_router.dart`.

## Design System

- **Accent**: emerald `#10B981`
- **Theme**: dark-first only (MVP)
- **Typography**: Plus Jakarta Sans (Latin) via `google_fonts`; Noto Nastaliq Urdu for ur
- **Radii**: 16 (card), 20 (sheet), 28 (hero)
- **Transitions**: 200ms `Curves.easeOutCubic`, ripple→scale-press 0.97× 120ms
- **Glassmorphism**: bottom nav, modal sheets (BackdropFilter σ=20)
- See `lib/core/theme/` for all design tokens.

## API

Base URL is injected via `--dart-define=API_BASE_URL=...`. Default in `core/config/env.dart` is the local dev URL.

Response envelope (backend):
- Success: `{ success: true, data, meta? }`
- Error: `{ success: false, error: { code, message, details? } }`

`DioClient` unwraps `data` for you; `ErrorInterceptor` converts `{error}` into typed `Failure`.

## Deployment

Production: build release APK pointed at `http://pak-ott.animekill.com/v1`. Install via `adb install -r build/app/outputs/flutter-apk/app-release.apk`.
