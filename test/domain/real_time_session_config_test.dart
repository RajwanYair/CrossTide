import 'package:cross_tide/src/domain/real_time_session_config.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('RealTimeSessionConfig', () {
    test('equality', () {
      const a = RealTimeSessionConfig(
        sessionId: 'sess1',
        transport: RealTimeTransport.websocket,
        endpointUrl: 'wss://data.example.com/stream',
        subscriptionTickers: ['AAPL', 'MSFT'],
        heartbeatIntervalSeconds: 30,
        reconnectMaxAttempts: 5,
      );
      const b = RealTimeSessionConfig(
        sessionId: 'sess1',
        transport: RealTimeTransport.websocket,
        endpointUrl: 'wss://data.example.com/stream',
        subscriptionTickers: ['AAPL', 'MSFT'],
        heartbeatIntervalSeconds: 30,
        reconnectMaxAttempts: 5,
      );
      expect(a, b);
    });

    test('copyWith changes heartbeatIntervalSeconds', () {
      const base = RealTimeSessionConfig(
        sessionId: 'sess1',
        transport: RealTimeTransport.websocket,
        endpointUrl: 'wss://data.example.com/stream',
        subscriptionTickers: ['AAPL', 'MSFT'],
        heartbeatIntervalSeconds: 30,
        reconnectMaxAttempts: 5,
      );
      final updated = base.copyWith(heartbeatIntervalSeconds: 60);
      expect(updated.heartbeatIntervalSeconds, 60);
    });

    test('props length is 7', () {
      const obj = RealTimeSessionConfig(
        sessionId: 'sess1',
        transport: RealTimeTransport.websocket,
        endpointUrl: 'wss://data.example.com/stream',
        subscriptionTickers: ['AAPL', 'MSFT'],
        heartbeatIntervalSeconds: 30,
        reconnectMaxAttempts: 5,
      );
      expect(obj.props.length, 7);
    });
  });
}
