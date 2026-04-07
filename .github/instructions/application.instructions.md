---
description: "Use when editing RefreshService, NotificationService, WebhookService, or other application-layer orchestration. Covers method evaluation wiring, consensus engine integration, and notification dispatch."
applyTo: "lib/src/application/**"
---
# Application Layer Rules

## Responsibility
- Orchestrates domain logic with external services (DB, notifications, webhooks).
- `RefreshService` is the main entry: fetch candles → compute indicators → evaluate methods → fire consensus → notify.
- `NotificationFallbackService` wraps a chain of `INotificationService` delegates for resilient delivery.
- `WebhookService` fires fire-and-forget webhook POST payloads on every alert.

## Method evaluation pipeline (RefreshService)
1. Fetch & cache candles.
2. Compute SMA200 + SMA150 (always up-to-date for display).
3. SMA cross-up evaluations (SMA50 / SMA150 / SMA200).
4. Micho Method BUY / SELL (idempotent via candle-date dedup on `lastMichoBuyAt`/`lastMichoSellAt`).
5. RSI / MACD / Bollinger method evaluations — collect signals for consensus.
6. **Consensus Engine** — combine all `MethodSignal` results; fire consensus BUY (GREEN) or SELL (RED) when Micho + ≥1 other agree (idempotent via `lastConsensusBuyAt`/`lastConsensusSellAt`).
7. Golden Cross / Death Cross.
8. Price targets, pct-move, volume spike checks.

## Adding a new method
- Create the detector in `lib/src/domain/` returning `MethodSignal` objects.
- Add a `final _detector = const XyzMethodDetector();` field to `RefreshService`.
- Invoke `evaluateBoth()` → add results to `allMethodSignals` list.
- The consensus engine picks them up automatically.
- Add `AlertType` entries in `entities.dart` and extend `INotificationService` if method-specific notifications are needed.
- Add idempotency columns to the DB if the method's alerts should be candle-date deduped.

## Notification interface
- `INotificationService` is the abstract interface — all show methods return `Future<void>`.
- Every concrete implementation (Local, Fallback) must implement all methods.
- Test doubles in `test/` must also be updated when new methods are added.

## Code quality — zero tolerance
- `flutter analyze --fatal-infos` must report **zero issues** in application files.
- **No `// ignore:` or `// ignore_for_file:` pragmas.** Fix the root cause.
- **No `TODO` / `FIXME` / `HACK` comments.** Open a GitHub Issue instead.
- Explicit loop variable types: `for (final MethodSignal signal in signals)`.
- Use `unawaited()` for fire-and-forget async calls (webhooks).
