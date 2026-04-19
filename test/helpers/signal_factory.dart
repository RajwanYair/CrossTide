import 'package:cross_tide/src/domain/domain.dart';

/// Default evaluation timestamp for test signals.
final kTestSignalDate = DateTime(2024, 6, 15);

/// Default close price for test signals.
const kTestClosePrice = 150.0;

/// Default test ticker for signal tests.
const kTestTicker = 'AAPL';

/// Unified MethodSignal factory for tests.
///
/// Replaces the `makeSignal` / `_signal` helpers duplicated across
/// consensus_engine_test, signal_aggregator_test,
/// weighted_consensus_engine_test, and signal_replay_simulator_test.
MethodSignal makeSignal({
  required AlertType alertType,
  required String methodName,
  bool isTriggered = true,
  String ticker = kTestTicker,
  DateTime? evaluatedAt,
  double currentClose = kTestClosePrice,
}) => MethodSignal(
  ticker: ticker,
  methodName: methodName,
  alertType: alertType,
  isTriggered: isTriggered,
  evaluatedAt: evaluatedAt ?? kTestSignalDate,
  currentClose: currentClose,
);

/// Unified AlertHistoryEntry factory for tests.
///
/// Replaces the `_entry` helpers duplicated across
/// alert_metrics_calculator_test, cross_up_anomaly_detector_test,
/// and digest_builder_test.
AlertHistoryEntry makeAlertEntry(
  String symbol, {
  required DateTime firedAt,
  String alertType = 'sma200CrossUp',
  String message = 'Test alert',
}) => AlertHistoryEntry(
  symbol: symbol,
  alertType: alertType,
  message: message.isEmpty ? 'Test alert for $symbol' : message,
  firedAt: firedAt,
);
