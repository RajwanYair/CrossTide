# CrossTide — Copilot Workspace Instructions

## Project Overview
CrossTide is a cross-platform Flutter app (Android + Windows) that monitors stock tickers for **SMA crossover events** and **multi-method trading signals** (Micho Method, RSI, MACD, Bollinger Bands, Golden Cross) with a **Consensus Engine** that fires local notifications when methods agree. Uses Yahoo Finance — no API key required.

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

## Trading Methods & Consensus Engine
- **Micho Method** (primary): BUY when price crosses above MA150 while MA150 is flat/rising within ~5%; SELL when price crosses below MA150.
- **RSI Method**: BUY when RSI exits oversold (<30→≥30); SELL when exits overbought (>70→≤70).
- **MACD Crossover**: BUY when MACD crosses above signal; SELL when below.
- **Bollinger Bands**: BUY when price crosses above lower band; SELL when below upper band.
- **Stochastic Method**: BUY when %K crosses above %D from oversold; SELL from overbought.
- **OBV Method**: BUY on positive OBV divergence; SELL on negative divergence.
- **ADX Method**: BUY on strong trend with +DI > −DI; SELL with −DI > +DI.
- **CCI Method**: BUY when CCI exits oversold (crosses above −100); SELL when exits overbought.
- **SAR Method**: BUY/SELL on Parabolic SAR flip direction.
- **Williams %R Method**: BUY when %R exits oversold (crosses above −80); SELL when exits overbought.
- **MFI Method**: BUY when MFI exits oversold (<20→≥20); SELL when exits overbought (>80→≤80).
- **SuperTrend Method**: BUY/SELL on SuperTrend direction flip.
- **Consensus Engine**: GREEN (consensus BUY) = Micho BUY + ≥1 other BUY; RED (consensus SELL) = Micho SELL + ≥1 other SELL. Micho is always the primary method.
- All methods produce `MethodSignal` objects (extensible pattern in `micho_method_detector.dart`).
- New methods: implement a detector class → return `MethodSignal` → wire into `RefreshService` → add to `ConsensusEngine`.

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
- Alerts are **idempotent** — same cross-up event fires only once (candle-date dedup)
- `AlertStateMachine` governs state transitions (below/above/alerted)
- Quiet hours suppress notifications but still update state
- Consensus alerts require Micho + at least one other method to agree

## Testing & Coverage
- Domain logic must have unit tests (`test/domain/`)
- **Domain coverage: 100%** — enforced in CI
- **Overall coverage target: ≥ 90%** — do not merge below this
- Use `AppDatabase.forTesting()` for in-memory DB tests
- `MockMarketDataProvider` provides deterministic synthetic data
- Run: `flutter test --coverage --timeout 30s`\n\nCurrently: **1473 passing tests**, 0 analyze issues.

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
- `lib/src/domain/entities.dart` — Core types: DailyCandle, TickerAlertState, AlertType (28 values), AppSettings
- `lib/src/domain/micho_method_detector.dart` — Micho Method + MethodSignal base class
- `lib/src/domain/consensus_engine.dart` — Multi-method consensus BUY/SELL engine (9 methods)
- `lib/src/domain/rsi_method_detector.dart` — RSI oversold/overbought exit signals
- `lib/src/domain/macd_method_detector.dart` — MACD/Signal crossover signals
- `lib/src/domain/bollinger_method_detector.dart` — Bollinger Band breakout signals
- `lib/src/domain/stochastic_method_detector.dart` — Stochastic %K/%D crossover signals
- `lib/src/domain/obv_method_detector.dart` — OBV divergence signals
- `lib/src/domain/adx_method_detector.dart` — ADX trend strength + DI crossover signals
- `lib/src/domain/cci_method_detector.dart` — CCI oversold/overbought exit signals
- `lib/src/domain/sar_method_detector.dart` — Parabolic SAR flip signals
- `lib/src/domain/domain.dart` — Barrel export (110+ domain classes)
- `lib/src/domain/alert_rule_evaluator.dart` — Declarative alert rule DSL (S139–S141)
- `lib/src/domain/dividend_calculator.dart` — Dividend tracking + income projection (S142–S144)
- `lib/src/domain/earnings_calendar_calculator.dart` — Earnings proximity detection (S145–S147)
- `lib/src/domain/multi_timeframe_analyzer.dart` — Daily/weekly/monthly candle aggregation (S148–S150)
- `lib/src/domain/forex_calculator.dart` — Forex pip/spread/range analysis (S163–S165)
- `lib/src/domain/watchlist_share_codec.dart` — Deep-link share URL encode/decode (S169–S171)
- `lib/src/domain/locale_resolver.dart` — i18n locale resolution (S172–S174)
- `lib/src/data/database/database.dart` — Drift schema v15 (regenerate after changes)
- `lib/src/application/refresh_service.dart` — Orchestrates all 9 method evaluations + consensus
- `lib/src/presentation/providers.dart` — All Riverpod providers
- `docs/COPILOT_GUIDE.md` — Detailed coding guide and architecture decisions

## Agents, Prompts & Skills
- **`data-integration`** agent — add/modify market data providers
- **`domain-feature`** agent — add/modify domain entities, SMA calc, alert state machine
- **`reviewer`** agent — architecture + quality audit (read-only)
- `/add-data-provider` prompt — step-by-step guide for new providers
- `/add-domain-feature` prompt — step-by-step guide for new domain rules
- `/add-trading-method` prompt — step-by-step guide for new MethodSignal-based methods
- `/generate-tests` prompt — generate domain unit tests
- `/health-check` prompt — full project quality gate run
- `/consensus-check` prompt — verify consensus engine coverage and wiring
- `add-trading-method` skill — full workflow for creating a new method detector
