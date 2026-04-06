import 'package:cross_tide/src/domain/cross_up_anomaly_detector.dart';
import 'package:cross_tide/src/domain/entities.dart';
import 'package:flutter_test/flutter_test.dart';

AlertHistoryEntry _entry({
  required String symbol,
  required String alertType,
  required DateTime firedAt,
}) => AlertHistoryEntry(
  id: null,
  symbol: symbol,
  alertType: alertType,
  message: 'test',
  firedAt: firedAt,
  acknowledged: false,
);

void main() {
  final now = DateTime(2025, 1, 15, 12, 0);

  group('CrossUpAnomalyDetector', () {
    test('returns empty list when history is empty', () {
      const detector = CrossUpAnomalyDetector();
      expect(detector.detect([]), isEmpty);
    });

    test('returns empty list when no repeated alerts within window', () {
      const detector = CrossUpAnomalyDetector(windowHours: 24);
      final history = [
        _entry(symbol: 'AAPL', alertType: 'sma200CrossUp', firedAt: now),
        _entry(
          symbol: 'AAPL',
          alertType: 'sma200CrossUp',
          firedAt: now.add(const Duration(hours: 25)),
        ),
      ];
      expect(detector.detect(history), isEmpty);
    });

    test('detects two alerts within window', () {
      const detector = CrossUpAnomalyDetector(windowHours: 24);
      final history = [
        _entry(symbol: 'AAPL', alertType: 'sma200CrossUp', firedAt: now),
        _entry(
          symbol: 'AAPL',
          alertType: 'sma200CrossUp',
          firedAt: now.add(const Duration(hours: 12)),
        ),
      ];
      final anomalies = detector.detect(history);
      expect(anomalies, hasLength(1));
      expect(anomalies.first.symbol, 'AAPL');
      expect(anomalies.first.occurrences, 2);
      expect(anomalies.first.windowHours, 24);
    });

    test('reports correct firstFiredAt and lastFiredAt', () {
      const detector = CrossUpAnomalyDetector(windowHours: 24);
      final t1 = now;
      final t2 = now.add(const Duration(hours: 6));
      final history = [
        _entry(symbol: 'TSLA', alertType: 'sma150CrossUp', firedAt: t1),
        _entry(symbol: 'TSLA', alertType: 'sma150CrossUp', firedAt: t2),
      ];
      final anomalies = detector.detect(history);
      expect(anomalies.first.firstFiredAt, t1);
      expect(anomalies.first.lastFiredAt, t2);
    });

    test('ignores non-SMA alert types (priceTarget, pctMove, volumeSpike)', () {
      const detector = CrossUpAnomalyDetector(windowHours: 24);
      final history = [
        _entry(symbol: 'MSFT', alertType: 'priceTarget', firedAt: now),
        _entry(
          symbol: 'MSFT',
          alertType: 'priceTarget',
          firedAt: now.add(const Duration(hours: 1)),
        ),
        _entry(symbol: 'NVDA', alertType: 'volumeSpike', firedAt: now),
        _entry(
          symbol: 'NVDA',
          alertType: 'volumeSpike',
          firedAt: now.add(const Duration(hours: 2)),
        ),
      ];
      expect(detector.detect(history), isEmpty);
    });

    test('handles goldenCross and deathCross', () {
      const detector = CrossUpAnomalyDetector(windowHours: 24);
      final history = [
        _entry(symbol: 'SPY', alertType: 'goldenCross', firedAt: now),
        _entry(
          symbol: 'SPY',
          alertType: 'goldenCross',
          firedAt: now.add(const Duration(hours: 8)),
        ),
        _entry(symbol: 'SPY', alertType: 'deathCross', firedAt: now),
        _entry(
          symbol: 'SPY',
          alertType: 'deathCross',
          firedAt: now.add(const Duration(hours: 10)),
        ),
      ];
      final anomalies = detector.detect(history);
      // goldenCross group → 1 anomaly; deathCross group → 1 anomaly
      expect(anomalies, hasLength(2));
    });

    test('does not flag different symbols separately', () {
      const detector = CrossUpAnomalyDetector(windowHours: 24);
      final history = [
        _entry(symbol: 'AAPL', alertType: 'sma200CrossUp', firedAt: now),
        _entry(symbol: 'GOOG', alertType: 'sma200CrossUp', firedAt: now),
        // Each ticker fires only once — no anomaly
      ];
      expect(detector.detect(history), isEmpty);
    });

    test('3 events in window yields single anomaly with occurrences=3', () {
      const detector = CrossUpAnomalyDetector(windowHours: 24);
      final history = [
        _entry(symbol: 'AMZN', alertType: 'sma50CrossUp', firedAt: now),
        _entry(
          symbol: 'AMZN',
          alertType: 'sma50CrossUp',
          firedAt: now.add(const Duration(hours: 4)),
        ),
        _entry(
          symbol: 'AMZN',
          alertType: 'sma50CrossUp',
          firedAt: now.add(const Duration(hours: 8)),
        ),
      ];
      final anomalies = detector.detect(history);
      expect(anomalies, hasLength(1));
      expect(anomalies.first.occurrences, 3);
    });

    test('respects custom windowHours', () {
      const detector = CrossUpAnomalyDetector(windowHours: 1);
      final history = [
        _entry(symbol: 'AAPL', alertType: 'sma200CrossUp', firedAt: now),
        _entry(
          symbol: 'AAPL',
          alertType: 'sma200CrossUp',
          firedAt: now.add(const Duration(minutes: 30)),
        ),
        // Third event is outside the 1-hour window from the second
        _entry(
          symbol: 'AAPL',
          alertType: 'sma200CrossUp',
          firedAt: now.add(const Duration(hours: 2)),
        ),
      ];
      // Only the first window (t0..t1) is flagged; t2 is outside.
      final anomalies = detector.detect(history);
      expect(anomalies, hasLength(1));
      expect(anomalies.first.occurrences, 2);
    });

    test('toString is human-readable', () {
      final fixedDate = DateTime.utc(2025, 1, 15, 12);
      final a = CrossUpAnomaly(
        symbol: 'AAPL',
        occurrences: 3,
        windowHours: 24,
        firstFiredAt: fixedDate,
        lastFiredAt: fixedDate,
      );
      expect(a.toString(), contains('AAPL'));
      expect(a.toString(), contains('3'));
      expect(a.toString(), contains('24h'));
    });
  });
}
