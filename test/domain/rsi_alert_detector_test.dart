import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

// ---------------------------------------------------------------------------
// Stub: injects a predetermined RSI series into the detector.
// ---------------------------------------------------------------------------

class _StubRsiCalculator extends RsiCalculator {
  _StubRsiCalculator(this._values);

  final List<double?> _values;

  @override
  List<(DateTime, double?)> computeSeries(
    List<DailyCandle> candles, {
    int period = 14,
  }) => _values.asMap().entries.map((e) {
    return (DateTime(2024, 1, 1).add(Duration(days: e.key)), e.value);
  }).toList();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

RsiAlertDetector _detectorWith(List<double?> rsiValues) =>
    RsiAlertDetector(rsiCalculator: _StubRsiCalculator(rsiValues));

List<DailyCandle> _candles(int count) => List.generate(count, (i) {
  final close = 100.0 + i;
  return DailyCandle(
    date: DateTime(2024, 1, 1).add(Duration(days: i)),
    open: close,
    high: close + 1,
    low: close - 1,
    close: close,
    volume: 1000000,
  );
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

void main() {
  group('RsiAlertDetector — null / empty', () {
    test('returns null when candles are empty', () {
      expect(const RsiAlertDetector().detect('X', []), isNull);
    });

    test('detectAll returns empty list when no RSI crossings exist', () {
      final det = _detectorWith([null, 50.0, 50.0, 50.0, 50.0]);
      expect(det.detectAll('X', _candles(5)), isEmpty);
    });

    test('detectAll skips null RSI values without throwing', () {
      final det = _detectorWith([null, null, 50.0]);
      expect(det.detectAll('X', _candles(3)), isEmpty);
    });
  });

  group('RsiAlertDetector — oversoldExit', () {
    test('detects oversoldExit when RSI crosses from 29 to 31', () {
      final det = _detectorWith([null, 50.0, 29.0, 31.0]);
      final alerts = det.detectAll('X', _candles(4));
      expect(alerts.length, 1);
      expect(alerts.first.alertType, RsiAlertType.oversoldExit);
    });

    test('oversoldExit rsiValue equals the RSI at the crossing candle', () {
      final det = _detectorWith([null, 28.0, 35.0]);
      final alert = det.detect('AAPL', _candles(3))!;
      expect(alert.rsiValue, closeTo(35.0, 0.001));
    });

    test('oversoldExit not fired when RSI stays below 30', () {
      final det = _detectorWith([null, 25.0, 27.0, 20.0]);
      expect(det.detectAll('X', _candles(4)), isEmpty);
    });

    test(
      'oversoldExit not fired when RSI drops from above 30 into oversold',
      () {
        // 35 → 25 moves INTO oversold — not an exit
        final det = _detectorWith([null, 35.0, 25.0]);
        expect(det.detectAll('X', _candles(3)), isEmpty);
      },
    );

    test(
      'detect returns the most recent alert when multiple crossings exist',
      () {
        final det = _detectorWith([
          null, 28.0, 31.0, // oversoldExit at index 2
          50.0, 25.0, 33.0, // oversoldExit again at index 5
        ]);
        final alert = det.detect('X', _candles(6))!;
        expect(alert.date, DateTime(2024, 1, 1).add(const Duration(days: 5)));
      },
    );
  });

  group('RsiAlertDetector — overboughtExit', () {
    test('detects overboughtExit when RSI crosses from 72 to 68', () {
      final det = _detectorWith([null, 50.0, 72.0, 68.0]);
      final alerts = det.detectAll('X', _candles(4));
      expect(alerts.length, 1);
      expect(alerts.first.alertType, RsiAlertType.overboughtExit);
    });

    test('overboughtExit rsiValue equals the RSI at the crossing candle', () {
      final det = _detectorWith([null, 75.0, 65.0]);
      final alert = det.detect('MSFT', _candles(3))!;
      expect(alert.rsiValue, closeTo(65.0, 0.001));
    });

    test('overboughtExit not fired when RSI stays above 70', () {
      final det = _detectorWith([null, 75.0, 80.0, 85.0]);
      expect(det.detectAll('X', _candles(4)), isEmpty);
    });

    test(
      'overboughtExit not fired when RSI rises from below 70 into overbought',
      () {
        // 65 → 72 moves INTO overbought — not an exit
        final det = _detectorWith([null, 65.0, 72.0]);
        expect(det.detectAll('X', _candles(3)), isEmpty);
      },
    );
  });

  group('RsiAlertDetector — custom thresholds', () {
    test('fires at custom oversoldThreshold of 40', () {
      final det = RsiAlertDetector(
        rsiCalculator: _StubRsiCalculator([null, 38.0, 42.0]),
        oversoldThreshold: 40.0,
        overboughtThreshold: 60.0,
      );
      final alerts = det.detectAll('X', _candles(3));
      expect(alerts.length, 1);
      expect(alerts.first.alertType, RsiAlertType.oversoldExit);
    });

    test('fires at custom overboughtThreshold of 60', () {
      final det = RsiAlertDetector(
        rsiCalculator: _StubRsiCalculator([null, 62.0, 58.0]),
        oversoldThreshold: 40.0,
        overboughtThreshold: 60.0,
      );
      final alerts = det.detectAll('X', _candles(3));
      expect(alerts.length, 1);
      expect(alerts.first.alertType, RsiAlertType.overboughtExit);
    });
  });

  group('RsiAlertDetector — RsiAlert entity', () {
    test('RsiAlert equality holds for equal values', () {
      final date = DateTime.utc(2024, 6, 1);
      final a = RsiAlert(
        symbol: 'TSLA',
        date: date,
        alertType: RsiAlertType.oversoldExit,
        rsiValue: 31.0,
      );
      final b = RsiAlert(
        symbol: 'TSLA',
        date: date,
        alertType: RsiAlertType.oversoldExit,
        rsiValue: 31.0,
      );
      expect(a, equals(b));
    });

    test('RsiAlert inequality when alertType differs', () {
      final date = DateTime.utc(2024, 6, 1);
      final a = RsiAlert(
        symbol: 'NVDA',
        date: date,
        alertType: RsiAlertType.oversoldExit,
        rsiValue: 31.0,
      );
      final b = RsiAlert(
        symbol: 'NVDA',
        date: date,
        alertType: RsiAlertType.overboughtExit,
        rsiValue: 31.0,
      );
      expect(a, isNot(equals(b)));
    });
  });

  group('RsiAlertDetector — detectAll ordering', () {
    test('multiple alerts returned in chronological date order', () {
      final det = _detectorWith([
        null, 29.0, 31.0, // oversoldExit at index 2
        50.0, 72.0, 68.0, // overboughtExit at index 5
      ]);
      final alerts = det.detectAll('X', _candles(6));
      expect(alerts.length, 2);
      expect(alerts[0].alertType, RsiAlertType.oversoldExit);
      expect(alerts[1].alertType, RsiAlertType.overboughtExit);
      expect(alerts[1].date.isAfter(alerts[0].date), isTrue);
    });
  });
}
