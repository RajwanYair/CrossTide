import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('TradingEventCategory', () {
    test('has 9 values', () {
      expect(TradingEventCategory.values.length, 9);
    });
  });

  group('TradingEventEntry', () {
    TradingEventEntry buildEvent({
      TradingEventImpact impact = TradingEventImpact.high,
      List<String> tickers = const [],
    }) {
      return TradingEventEntry(
        eventId: 'ev1',
        title: 'FOMC Meeting',
        category: TradingEventCategory.fomc,
        impact: impact,
        eventDate: DateTime(2024, 6, 12),
        affectedTickers: tickers,
      );
    }

    test('isHighImpact is true for high impact', () {
      expect(buildEvent(impact: TradingEventImpact.high).isHighImpact, isTrue);
    });

    test('isHighImpact is true for critical impact', () {
      expect(
        buildEvent(impact: TradingEventImpact.critical).isHighImpact,
        isTrue,
      );
    });

    test('isHighImpact is false for medium impact', () {
      expect(
        buildEvent(impact: TradingEventImpact.medium).isHighImpact,
        isFalse,
      );
    });

    test('affectsMarketWide is true when no tickers specified', () {
      expect(buildEvent().affectsMarketWide, isTrue);
    });

    test('affectsMarketWide is false when tickers are specified', () {
      expect(buildEvent(tickers: ['AAPL', 'MSFT']).affectsMarketWide, isFalse);
    });

    test('equality holds for same props', () {
      expect(buildEvent(), equals(buildEvent()));
    });
  });
}
