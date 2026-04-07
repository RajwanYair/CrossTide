---
description: "Verify that the ConsensusEngine covers all trading methods — checks wiring, AlertType mapping, and test coverage."
agent: "reviewer"
---
# Consensus Engine Health Check

Audit the consensus engine to ensure all trading methods are properly wired and tested.

## Checks

### 1. AlertType completeness
Read `lib/src/domain/entities.dart` and list all method-specific AlertType values (pattern: `*MethodBuy`, `*MethodSell`).
Verify each has `displayName` and `description` entries.

### 2. ConsensusEngine wiring
Read `lib/src/domain/consensus_engine.dart`.
- **`_isBuyType()`** must include every `*MethodBuy` AlertType.
- **`_isSellType()`** must include every `*MethodSell` AlertType.
- Report any method-specific AlertType that is missing from these methods.

### 3. RefreshService integration
Read `lib/src/application/refresh_service.dart`.
- Every detector class must have a field instance.
- Every detector must be invoked via `evaluateBoth()`.
- Results must be spread into the `allMethodSignals` list.
- Report any detector that is defined in domain but not called in RefreshService.

### 4. Notification interface
Read `lib/src/application/i_notification_service.dart`.
- Every method-specific alert should have a corresponding show method.
- Report any gap.

### 5. Test coverage
Check that `test/domain/` contains a `*_method_detector_test.dart` for each detector.
Check that `test/domain/consensus_engine_test.dart` tests signals from all methods.

### 6. Report
Output a table:

| Method | AlertType BUY | AlertType SELL | ConsensusEngine | RefreshService | Tests |
|--------|--------------|---------------|-----------------|----------------|-------|
| ...    | ✅/❌        | ✅/❌         | ✅/❌           | ✅/❌          | ✅/❌ |

Flag any ❌ items for immediate action.
