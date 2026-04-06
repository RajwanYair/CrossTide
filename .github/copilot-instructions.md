# Stock200Alert — Copilot Workspace Instructions

## Project Overview
Cross-platform Flutter app (Android + Windows) that monitors stock tickers for **200-day Simple Moving Average (SMA) cross-up** events and fires local notifications.

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
- **HTTP**: Dio
- **Notifications**: flutter_local_notifications
- **Background**: WorkManager (Android), Timer.periodic (Windows)
- **Charts**: fl_chart
- **Secrets**: flutter_secure_storage (never hardcode API keys)

## Code Conventions
- Dart 3.11+, null-safe, prefer `const` constructors
- Single quotes for strings
- 80-char line length (`dart format`)
- Domain entities use `Equatable` — no mutable state in domain layer
- Generated files (`*.g.dart`, `*.freezed.dart`) are gitignored from search
- Use `library;` directive when file has doc comments above imports

## Key Business Rules
- **Cross-up rule**: `close[t-1] <= SMA200[t-1] AND close[t] > SMA200[t]`
- Alerts are **idempotent** — same cross-up event fires only once
- `AlertStateMachine` governs state transitions (below/above/alerted)
- Quiet hours suppress notifications but still update state

## Testing
- Domain logic must have unit tests (`test/domain/`)
- Use `AppDatabase.forTesting()` for in-memory DB tests
- `MockMarketDataProvider` provides deterministic synthetic data
- Run: `flutter test` or `flutter test --coverage`

## Build & Run
```bash
flutter pub get
dart run build_runner build --delete-conflicting-outputs  # Drift codegen
flutter run -d windows    # Desktop
flutter run -d <device>   # Android
flutter analyze           # Static analysis (must pass clean)
dart format .             # Formatting
```

## Important Files
- `lib/main.dart` — Entry point, service wiring
- `lib/src/domain/entities.dart` — Core types: DailyCandle, TickerAlertState, AppSettings
- `lib/src/data/database/database.dart` — Drift schema (regenerate after changes)
- `lib/src/presentation/providers.dart` — All Riverpod providers
- `docs/COPILOT_GUIDE.md` — Detailed coding guide and architecture decisions
