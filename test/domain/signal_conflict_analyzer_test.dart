import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('SignalConflictAnalyzer', () {
    const SignalConflictAnalyzer analyzer = SignalConflictAnalyzer();
    final DateTime now = DateTime(2025, 1, 10);

    test('no conflicts when all signals agree', () {
      final List<SignalConflict> conflicts = analyzer.analyze(
        symbol: 'AAPL',
        methodSignals: {'rsi': 'buy', 'macd': 'buy', 'bollinger': 'buy'},
        now: now,
      );
      expect(conflicts, isEmpty);
    });

    test('detects buyVsSell conflict', () {
      final List<SignalConflict> conflicts = analyzer.analyze(
        symbol: 'AAPL',
        methodSignals: {'rsi': 'buy', 'macd': 'sell'},
        now: now,
      );
      expect(conflicts.length, 1);
      expect(conflicts.first.conflictType, SignalConflictType.buyVsSell);
      expect(conflicts.first.symbol, 'AAPL');
    });

    test('detects multiple conflicts with 3 contradictory methods', () {
      final List<SignalConflict> conflicts = analyzer.analyze(
        symbol: 'MSFT',
        methodSignals: {'rsi': 'buy', 'macd': 'sell', 'bollinger': 'sell'},
        now: now,
      );
      // rsi vs macd and rsi vs bollinger = 2 conflicts
      expect(conflicts.length, 2);
    });

    test('conflict has description', () {
      final List<SignalConflict> conflicts = analyzer.analyze(
        symbol: 'TSLA',
        methodSignals: {'rsi': 'buy', 'sar': 'sell'},
        now: now,
      );
      expect(conflicts.first.hasDescription, isTrue);
    });

    test('isBuyVsSell true', () {
      final SignalConflict c = SignalConflict(
        symbol: 'AAPL',
        conflictType: SignalConflictType.buyVsSell,
        methodA: 'rsi',
        methodB: 'macd',
        detectedAt: now,
      );
      expect(c.isBuyVsSell, isTrue);
    });

    test('equality of analyzer', () {
      const SignalConflictAnalyzer same = SignalConflictAnalyzer();
      expect(analyzer, same);
    });
  });
}
