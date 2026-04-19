---
description: "Verify consensus, weighted consensus, orchestration, notification, and test wiring for all trading methods."
agent: "reviewer"
---
# Consensus Engine Health Check

Audit the signal ecosystem to ensure every trading method is correctly represented across engines, orchestration, and tests.

## Checks

### 1. AlertType completeness
Read `lib/src/domain/entities.dart` and list all method-specific AlertType values (pattern: `*MethodBuy`, `*MethodSell`).
Verify each has `displayName` and `description` entries.

### 2. ConsensusEngine wiring
Read `lib/src/domain/consensus_engine.dart`.
- **`_isBuyType()`** must include every `*MethodBuy` AlertType.
- **`_isSellType()`** must include every `*MethodSell` AlertType.
- Report any method-specific AlertType that is missing from these methods.

### 3. WeightedConsensusEngine wiring
Read `lib/src/domain/weighted_consensus_engine.dart`.
- Verify weighted BUY/SELL classification covers the same method alert types.
- Report any mismatch between the weighted engine and the standard engine.

### 4. RefreshService integration
Read `lib/src/application/refresh_service.dart`.
- Every detector class must have a field instance.
- Every detector must be invoked via `evaluateBoth()`.
- Results must be spread into the `allMethodSignals` list.
- Report any detector that is defined in domain but not called in RefreshService.

### 5. Notification interface
Read `lib/src/application/notification_service.dart`.
- Every method-specific alert should have a corresponding show method.
- Report any gap.

### 6. Test coverage
Check that `test/domain/` contains a `*_method_detector_test.dart` for each detector.
Check that `test/domain/consensus_engine_test.dart` tests signals from all methods.
Check that `test/domain/weighted_consensus_engine_test.dart` stays aligned when the weighted engine supports the method.

### 7. Report
Output a table:

| Method | AlertType BUY | AlertType SELL | ConsensusEngine | WeightedConsensus | RefreshService | Notifications | Tests |
|--------|--------------|---------------|-----------------|------------------|----------------|---------------|-------|
| ...    | ✅/❌        | ✅/❌         | ✅/❌           | ✅/❌            | ✅/❌          | ✅/❌         | ✅/❌ |

Flag any ❌ items for immediate action.
