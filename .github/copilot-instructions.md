# CrossTide — Copilot Workspace Instructions

## Project Snapshot
CrossTide is a cross-platform Flutter application for Windows and Android that monitors watchlists, evaluates multiple technical methods, and emits local notifications when alert rules and consensus conditions are met.

The repository is large and domain-heavy. Treat it as a Clean Architecture codebase first and a Flutter app second.

## Layer Boundaries

| Layer | Path | May depend on | Must never depend on |
|------|------|----------------|----------------------|
| Domain | `lib/src/domain/` | `equatable` only | Data, Application, Presentation, Flutter, Drift, Dio, Riverpod |
| Data | `lib/src/data/` | Domain | Application, Presentation |
| Application | `lib/src/application/` | Domain, Data | Presentation |
| Presentation | `lib/src/presentation/` | Domain, Data, Application | direct infrastructure shortcuts |

Dependencies flow inward only. Fix violations at the source, not by suppressing lints.

## Current Technical Stack
- Flutter stable with Dart 3.11+
- Riverpod for state and DI
- GoRouter for navigation
- Drift for SQLite persistence
- Dio with `package:dio/io.dart` and `IOHttpClientAdapter` for HTTP
- `flutter_local_notifications` for local delivery
- WorkManager on Android and timer-based scheduling on Windows
- `flutter_secure_storage` for secrets and provider credentials
- Java 21 in Gradle and CI

## Trading Methods and Signal Engines
Current method detectors:
- Micho Method
- RSI Method
- MACD Crossover
- Bollinger Bands
- Stochastic Method
- OBV Divergence
- ADX Trend
- CCI Method
- Parabolic SAR
- Williams %R
- MFI Method
- SuperTrend

Current signal engines:
- `ConsensusEngine` for Micho-plus-one consensus BUY/SELL
- `WeightedConsensusEngine` for weighted consensus scenarios and calibration workflows

All methods must produce `MethodSignal` objects and follow the `evaluateBuy` / `evaluateSell` / `evaluateBoth` contract from the detector pattern established in `micho_method_detector.dart`.

## Data Provider Surface
The provider layer already includes multiple live and fallback-capable integrations. Before adding a provider, inspect the existing implementations and keep the stack internally consistent.

Known provider and repository building blocks include:
- `YahooFinanceProvider`
- `NasdaqProvider`
- `TiingoProvider`
- `MarketWatchProvider`
- `CoinpaprikaProvider`
- `StooqProvider`
- `FallbackMarketDataProvider`
- `ThrottledMarketDataProvider`
- `StockRepository`
- delta-sync and cache logic in the data layer

## Workspace Tooling Model
Common VS Code tooling now lives at the parent `MyScripts` level. This workspace should keep only CrossTide-specific overrides.

Important implications:
- Shared task execution is routed through the parent tool runner in `../.vscode/scripts/invoke-flutter-workspace-tool.ps1`
- Local `.vscode/tasks.json` should stay thin and project-specific
- Generic editor defaults belong at the parent `MyScripts/.vscode/` level, not here

## MCP and GitHub Automation
Configured MCP servers currently live in `.vscode/mcp.json` and are intentionally conservative:
- `github`
- `github-pull-request`

Use them for GitHub context, pull request review, and release/repo automation. Do not invent additional MCP server configuration unless the schema and runtime support are verified.

## Quality Gates — Zero Tolerance
- `flutter analyze --fatal-infos` must report zero issues
- `dart format --set-exit-if-changed lib test` must exit 0
- `flutter test --coverage --timeout 30s` must pass
- Domain coverage must remain 100%
- Overall coverage target is at least 90%
- No `// ignore:` or `// ignore_for_file:` pragmas in `lib/` or `test/`
- No `TODO`, `FIXME`, or `HACK` comments in production code
- No skipped tests or waived checks

Never run `dart format .` in this repository.

## Key Business Rules
- Cross-up rule: `close[t-1] <= SMA200[t-1] AND close[t] > SMA200[t]`
- Alerts are idempotent and deduplicated by candle date / state history
- `AlertStateMachine` is authoritative for state transitions
- Quiet hours suppress delivery but do not prevent state advancement
- Consensus BUY/SELL requires Micho and at least one agreeing secondary signal

## Testing Expectations
- Domain tests live in `test/domain/`
- Data tests live in `test/data/`
- Application tests live in `test/application/`
- Reuse helpers in `test/helpers/candle_factory.dart` and `test/helpers/signal_factory.dart` when they fit
- Prefer table-driven tests over repeated boilerplate when cases only differ by inputs and expected outputs

## Workflow Expectations
- CI generates code once, uploads generated artifacts, then reuses them in build jobs
- Release builds must produce Windows ZIP, Windows MSIX, and Android APK assets from tag pushes
- Manual version bumps happen through `bump-version.yml`
- Auto-release uses commit-count gating and must not fight with manual release workflows

## Preferred Files to Read First
- `docs/COPILOT_GUIDE.md`
- `.github/instructions/*.instructions.md`
- `lib/src/domain/entities.dart`
- `lib/src/domain/consensus_engine.dart`
- `lib/src/domain/weighted_consensus_engine.dart`
- `lib/src/application/refresh_service.dart`
- `lib/src/application/notification_service.dart`
- `lib/src/presentation/providers.dart`

## Known Repo Gotchas
- PowerShell string interpolation can corrupt replacement strings containing `$1`, `$2`, etc.; use single-quoted here-strings when needed
- Barrel ordering in `lib/src/domain/domain.dart` is strict and easy to break
- `DateTime` makes fixtures non-const
- Boundary tests must respect strict vs inclusive comparators
- Domain and Drift `DailyCandle` types can collide; use `domain.` prefixes when necessary

## GitHub Copilot Assets in This Repo
Agents:
- `data-integration`
- `domain-feature`
- `reviewer`

Prompts:
- `/add-data-provider`
- `/add-domain-feature`
- `/add-trading-method`
- `/generate-tests`
- `/health-check`
- `/consensus-check`

Skills:
- `add-trading-method`

Keep these files in sync with the actual codebase and workflow behavior. If code, docs, prompts, or workflows drift, update the source-of-truth asset rather than working around stale guidance.
