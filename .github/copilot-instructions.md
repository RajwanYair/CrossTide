# CrossTide — Copilot Workspace Instructions

## Project Overview
CrossTide is a cross-platform Flutter app (Android + Windows) that monitors stock tickers for **SMA crossover events** (SMA50 / SMA150 / SMA200, Golden Cross) and fires local notifications. Uses Yahoo Finance — no API key required.

## Architecture
Clean Architecture with strict layer boundaries. Dependencies flow inward only.

| Layer | Path | Depends On | Never Depends On |
|-------|------|------------|------------------|
| **Domain** | `lib/src/domain/` | Nothing (pure Dart) | Data, Application, Presentation |
| **Data** | `lib/src/data/` | Domain | Application, Presentation |
| **Application** | `lib/src/application/` | Domain, Data | Presentation |
| **Presentation** | `lib/src/presentation/` | All layers | — |

## Tech Stack
- **State Management**: Riverpod (not Bloc, not Provider)
- **Navigation**: GoRouter
- **Database**: Drift (SQLite) — generated code in `*.g.dart`
- **HTTP**: Dio with `IOHttpClientAdapter` (not deprecated `onHttpClientCreate`)
- **Notifications**: flutter_local_notifications
- **Background**: WorkManager (Android), Timer.periodic (Windows)
- **Charts**: fl_chart
- **Secrets**: flutter_secure_storage (never hardcode API keys)
- **Java SDK**: 21 (Temurin LTS) — in both Gradle and CI

## Code Conventions
- Dart 3.11+, null-safe, prefer `const` constructors
- Single quotes for strings
- 80-char line length (`dart format`)
- Domain entities use `Equatable` — no mutable state in domain layer
- Generated files (`*.g.dart`, `*.freezed.dart`) are gitignored from search
- Use `library;` directive when file has doc comments above imports
- Explicit loop variable types required: `for (final MyType x in list)` — not `for (final x in list)`
- Notifier mutation methods must use a descriptive verb, not `set` (e.g. `applyFilter`, `update`)

## Quality Gates — Zero Tolerance
- **`flutter analyze --fatal-infos` must report zero issues** — zero errors, zero warnings, zero infos.
- **`dart format --set-exit-if-changed lib test` must exit 0** — always format `lib test`, never `.`.
- **No `// ignore:` or `// ignore_for_file:` pragmas anywhere in `lib/` or `test/`.** Resolve the lint with a real code change.
- **No `TODO` / `FIXME` / `HACK` comments in production code.** Track work in GitHub Issues.
- **No suppressed lints, no waivers, no skipped tests.**

## Key Business Rules
- **Cross-up rule**: `close[t-1] <= SMA200[t-1] AND close[t] > SMA200[t]`
- Alerts are **idempotent** — same cross-up event fires only once
- `AlertStateMachine` governs state transitions (below/above/alerted)
- Quiet hours suppress notifications but still update state

## Testing & Coverage
- Domain logic must have unit tests (`test/domain/`)
- **Domain coverage: 100%** — enforced in CI
- **Overall coverage target: ≥ 90%** — do not merge below this
- Use `AppDatabase.forTesting()` for in-memory DB tests
- `MockMarketDataProvider` provides deterministic synthetic data
- Run: `flutter test --coverage --timeout 30s`

## Build & Run
```bash
flutter pub get
dart run build_runner build --delete-conflicting-outputs  # Drift codegen
flutter run -d windows    # Desktop
flutter run -d <device>   # Android
flutter analyze --fatal-infos   # Static analysis (must be zero issues)
dart format lib test            # Formatting (scope to lib/test only)
```

## Important Files
- `lib/main.dart` — Entry point, service wiring
- `lib/src/domain/entities.dart` — Core types: DailyCandle, TickerAlertState, AppSettings
- `lib/src/data/database/database.dart` — Drift schema (regenerate after changes)
- `lib/src/presentation/providers.dart` — All Riverpod providers
- `docs/COPILOT_GUIDE.md` — Detailed coding guide and architecture decisions

## Agents & Prompts
- **`data-integration`** agent — add/modify market data providers
- **`domain-feature`** agent — add/modify domain entities, SMA calc, alert state machine
- **`reviewer`** agent — architecture + quality audit (read-only)
- `/add-data-provider` prompt — step-by-step guide for new providers
- `/add-domain-feature` prompt — step-by-step guide for new domain rules
- `/generate-tests` prompt — generate domain unit tests
- `/health-check` prompt — full project quality gate run
