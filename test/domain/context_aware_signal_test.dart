import 'package:cross_tide/src/domain/context_aware_signal.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ContextAwareSignal', () {
    test('equality', () {
      final a = ContextAwareSignal(
        ticker: 'AAPL',
        baseSignalType: 'MichoMethodBuy',
        contextSources: const [SignalContextSource.priceAction],
        priceAtDetection: 155.0,
        volumeAtDetection: 50000000,
        detectedAt: DateTime(2025, 12, 1),
      );
      final b = ContextAwareSignal(
        ticker: 'AAPL',
        baseSignalType: 'MichoMethodBuy',
        contextSources: const [SignalContextSource.priceAction],
        priceAtDetection: 155.0,
        volumeAtDetection: 50000000,
        detectedAt: DateTime(2025, 12, 1),
      );
      expect(a, b);
    });

    test('copyWith changes priceAtDetection', () {
      final base = ContextAwareSignal(
        ticker: 'AAPL',
        baseSignalType: 'MichoMethodBuy',
        contextSources: const [SignalContextSource.priceAction],
        priceAtDetection: 155.0,
        volumeAtDetection: 50000000,
        detectedAt: DateTime(2025, 12, 1),
      );
      final updated = base.copyWith(priceAtDetection: 160.0);
      expect(updated.priceAtDetection, 160.0);
    });

    test('props length is 8', () {
      final obj = ContextAwareSignal(
        ticker: 'AAPL',
        baseSignalType: 'MichoMethodBuy',
        contextSources: const [SignalContextSource.priceAction],
        priceAtDetection: 155.0,
        volumeAtDetection: 50000000,
        detectedAt: DateTime(2025, 12, 1),
      );
      expect(obj.props.length, 8);
    });
  });
}
