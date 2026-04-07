import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const builder = CorrelationMatrixBuilder();

  group('CorrelationMatrixBuilder', () {
    test('build computes pairwise correlations', () {
      final result = builder.build({
        'AAPL': [0.01, 0.02, -0.01, 0.03, 0.01],
        'MSFT': [0.01, 0.015, -0.005, 0.025, 0.01],
        'GOOG': [-0.01, -0.02, 0.01, -0.03, -0.01],
      });
      expect(result.tickers.length, 3);
      // 3 tickers → 3 pairs (3 choose 2)
      expect(result.pairs.length, 3);
    });

    test('perfectly correlated returns r ≈ 1', () {
      final result = builder.build({
        'A': [1.0, 2.0, 3.0, 4.0, 5.0],
        'B': [2.0, 4.0, 6.0, 8.0, 10.0],
      });
      expect(result.pairs.first.correlation, closeTo(1.0, 0.01));
    });

    test('inversely correlated returns r ≈ -1', () {
      final result = builder.build({
        'A': [1.0, 2.0, 3.0, 4.0, 5.0],
        'B': [-1.0, -2.0, -3.0, -4.0, -5.0],
      });
      expect(result.pairs.first.correlation, closeTo(-1.0, 0.01));
    });

    test('lookup finds specific pair', () {
      final result = builder.build({
        'A': [1.0, 2.0, 3.0],
        'B': [1.0, 2.0, 3.0],
        'C': [3.0, 2.0, 1.0],
      });
      expect(result.lookup('A', 'B'), closeTo(1.0, 0.01));
      expect(result.lookup('A', 'C'), closeTo(-1.0, 0.01));
    });

    test('highlyCorrelated filters correctly', () {
      final result = builder.build({
        'A': [1.0, 2.0, 3.0, 4.0, 5.0],
        'B': [1.1, 2.1, 3.1, 4.1, 5.1],
        'C': [5.0, 3.0, 1.0, 4.0, 2.0],
      });
      final high = result.highlyCorrelated();
      expect(high, isNotEmpty); // A-B should be highly correlated
    });

    test('empty input returns empty', () {
      final result = builder.build({});
      expect(result.pairs, isEmpty);
      expect(result.tickers, isEmpty);
    });
  });
}
