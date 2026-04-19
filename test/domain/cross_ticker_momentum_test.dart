import 'package:cross_tide/src/domain/cross_ticker_momentum.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('CrossTickerMomentum', () {
    test('equality', () {
      const a = CrossTickerMomentum(
        ticker: 'AAPL',
        benchmarkTicker: 'QQQ',
        relativeReturn: 3.5,
        comparisonBasis: MomentumComparisonBasis.indexRelative,
        isOutperforming: true,
      );
      const b = CrossTickerMomentum(
        ticker: 'AAPL',
        benchmarkTicker: 'QQQ',
        relativeReturn: 3.5,
        comparisonBasis: MomentumComparisonBasis.indexRelative,
        isOutperforming: true,
      );
      expect(a, b);
    });

    test('copyWith changes relativeReturn', () {
      const base = CrossTickerMomentum(
        ticker: 'AAPL',
        benchmarkTicker: 'QQQ',
        relativeReturn: 3.5,
        comparisonBasis: MomentumComparisonBasis.indexRelative,
        isOutperforming: true,
      );
      final updated = base.copyWith(relativeReturn: 4.0);
      expect(updated.relativeReturn, 4.0);
    });

    test('props length is 5', () {
      const obj = CrossTickerMomentum(
        ticker: 'AAPL',
        benchmarkTicker: 'QQQ',
        relativeReturn: 3.5,
        comparisonBasis: MomentumComparisonBasis.indexRelative,
        isOutperforming: true,
      );
      expect(obj.props.length, 5);
    });
  });
}
