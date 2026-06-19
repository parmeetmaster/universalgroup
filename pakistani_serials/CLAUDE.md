# CLAUDE.md — pakistani_serials (Flutter app)

Netflix-style Android app for Pakistani dramas. Flutter 3.41.5 (via fvm).

## Rules

### End-to-end verification (MANDATORY)
After any UI or screen change, launch the app on an Android emulator/device and verify:
1. Screen renders without red screen
2. Data loads from the backend (`https://global.animekill.com/api/pakistani-serials`; for a local backend run with `--dart-define=ENV=dev`)
3. Loading, error, and empty states all behave correctly
4. Back-navigation works

Do NOT mark a UI task done without visual verification. `flutter analyze` / `flutter test` verify code correctness, not feature correctness.

## Commands

```bash
fvm flutter pub get
fvm flutter run                       # prod backend → https://global.animekill.com/api/pakistani-serials
fvm flutter run --dart-define=ENV=dev # local backend → http://10.0.2.2:3090/api/pakistani-serials
dart run build_runner build --delete-conflicting-outputs
fvm flutter gen-l10n
fvm flutter test
fvm flutter analyze
fvm flutter build apk --release       # prod backend → global.animekill.com
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

State: `flutter_bloc` + `hydrated_bloc` (for Auth / Settings). **NEVER use `setState` or `ValueNotifier` anywhere in the entire app** — not in feature screens, not in small widgets, nowhere. Use BLoC for feature state, `Cubit` for local UI state (toggles, animation flags, drag state, loading booleans). Create small private Cubits in the same file, use `BlocBuilder(bloc: myCubit)` pattern. No exceptions.
DI: `get_it` + `injectable`. Run `dart run build_runner build --delete-conflicting-outputs` after adding `@injectable` classes or `freezed`/`json_serializable` models.
Routing: `go_router`. Central `app_router.dart`.

**Strict Clean Architecture:** Business logic and routing/navigation MUST NOT live in the presentation layer (screens/widgets). Screens only render UI and dispatch events to BLoC. All business logic (API calls, data transforms, validation, service calls) goes in usecases/repositories/BLoC event handlers. `getIt<>` in presentation files is ONLY allowed for BLoC/Cubit creation (`getIt<MyBloc>()`). NEVER use `getIt<>` for services, repositories, or utilities in screens/widgets — inject those through BLoC constructors instead.

## Design System

- **Accent**: emerald `#10B981`
- **Theme**: dark-first only (MVP)
- **Typography**: Plus Jakarta Sans (Latin) via `google_fonts`; Noto Nastaliq Urdu for ur
- **Radii**: 16 (card), 20 (sheet), 28 (hero)
- **Transitions**: 200ms `Curves.easeOutCubic`, ripple→scale-press 0.97× 120ms
- **Glassmorphism**: bottom nav, modal sheets (BackdropFilter σ=20)
- See `lib/core/theme/` for all design tokens.

## API

Base URL is selected by the `ENV` dart-define in `core/config/env.dart`: default `prod` → `https://global.animekill.com/api/pakistani-serials`; `ENV=dev` → `http://10.0.2.2:3090/api/pakistani-serials`. There is no `API_BASE_URL` define — in prod the app talks to global.animekill.com only.

Response envelope (backend):
- Success: `{ success: true, data, meta? }`
- Error: `{ success: false, error: { code, message, details? } }`

`DioClient` unwraps `data` for you; `ErrorInterceptor` converts `{error}` into typed `Failure`.

## Deployment

Production: build release APK (defaults to `https://global.animekill.com/api/pakistani-serials`). Install via `adb install -r build/app/outputs/flutter-apk/app-release.apk`.
