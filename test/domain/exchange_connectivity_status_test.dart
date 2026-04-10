import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ConnectivityStatus', () {
    test('has 5 values', () {
      expect(ConnectivityStatus.values.length, 5);
    });
  });

  group('ExchangeConnectivityStatus', () {
    ExchangeConnectivityStatus buildStatus({
      ConnectivityStatus status = ConnectivityStatus.connected,
      int latencyMs = 120,
    }) {
      return ExchangeConnectivityStatus(
        exchangeId: 'nyse',
        displayName: 'NYSE',
        status: status,
        latencyMs: latencyMs,
        checkedAt: DateTime(2024, 6, 1),
      );
    }

    test('isConnected is true when status is connected', () {
      expect(buildStatus().isConnected, isTrue);
    });

    test('isConnected is false when status is disconnected', () {
      expect(
        buildStatus(status: ConnectivityStatus.disconnected).isConnected,
        isFalse,
      );
    });

    test('isOperational is true when degraded', () {
      expect(
        buildStatus(status: ConnectivityStatus.degraded).isOperational,
        isTrue,
      );
    });

    test('isOperational is false when disconnected', () {
      expect(
        buildStatus(status: ConnectivityStatus.disconnected).isOperational,
        isFalse,
      );
    });

    test('isLowLatency is true when latencyMs <= 500', () {
      expect(buildStatus(latencyMs: 500).isLowLatency, isTrue);
    });

    test('isLowLatency is false when latencyMs > 500', () {
      expect(buildStatus(latencyMs: 501).isLowLatency, isFalse);
    });

    test('isLowLatency is false when latencyMs is -1 (unavailable)', () {
      expect(buildStatus(latencyMs: -1).isLowLatency, isFalse);
    });

    test('equality holds for same props', () {
      expect(buildStatus(), equals(buildStatus()));
    });
  });
}
