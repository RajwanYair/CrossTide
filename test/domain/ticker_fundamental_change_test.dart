import 'package:cross_tide/src/domain/ticker_fundamental_change.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('TickerFundamentalChange', () {
    test('equality', () {
      const a = TickerFundamentalChange(
        ticker: 'AAPL',
        changeType: FundamentalChangeType.earningsRevision,
        previousValue: '1.80',
        newValue: '1.92',
        source: 'analyst',
      );
      const b = TickerFundamentalChange(
        ticker: 'AAPL',
        changeType: FundamentalChangeType.earningsRevision,
        previousValue: '1.80',
        newValue: '1.92',
        source: 'analyst',
      );
      expect(a, b);
    });

    test('copyWith changes source', () {
      const base = TickerFundamentalChange(
        ticker: 'AAPL',
        changeType: FundamentalChangeType.earningsRevision,
        previousValue: '1.80',
        newValue: '1.92',
        source: 'analyst',
      );
      final updated = base.copyWith(source: 'consensus');
      expect(updated.source, 'consensus');
    });

    test('props length is 5', () {
      const obj = TickerFundamentalChange(
        ticker: 'AAPL',
        changeType: FundamentalChangeType.earningsRevision,
        previousValue: '1.80',
        newValue: '1.92',
        source: 'analyst',
      );
      expect(obj.props.length, 5);
    });
  });
}
