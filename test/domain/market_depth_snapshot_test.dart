import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('MarketDepthLevel', () {
    test('computes notional', () {
      const level = MarketDepthLevel(price: 150.0, size: 200.0, orderCount: 5);
      expect(level.notional, closeTo(30_000.0, 0.001));
    });
  });

  group('MarketDepthSnapshot', () {
    late DateTime ts;

    setUp(() => ts = DateTime(2025, 6, 1, 9, 30));

    test('empty snapshot', () {
      final snap = MarketDepthSnapshot(
        symbol: 'AAPL',
        bids: const [],
        asks: const [],
        capturedAt: ts,
      );
      expect(snap.isEmpty, isTrue);
      expect(snap.bestBid, isNull);
      expect(snap.bestAsk, isNull);
      expect(snap.spread, isNull);
    });

    test('bestBid and bestAsk from sorted lists', () {
      final snap = MarketDepthSnapshot(
        symbol: 'MSFT',
        bids: const [
          MarketDepthLevel(price: 310.0, size: 100, orderCount: 3),
          MarketDepthLevel(price: 309.5, size: 200, orderCount: 2),
        ],
        asks: const [
          MarketDepthLevel(price: 310.5, size: 150, orderCount: 4),
          MarketDepthLevel(price: 311.0, size: 100, orderCount: 1),
        ],
        capturedAt: ts,
      );
      expect(snap.bestBid, 310.0);
      expect(snap.bestAsk, 310.5);
      expect(snap.spread, closeTo(0.5, 0.001));
      expect(snap.bidLevels, 2);
      expect(snap.askLevels, 2);
    });

    test('totalBidNotional and totalAskNotional', () {
      final snap = MarketDepthSnapshot(
        symbol: 'NVDA',
        bids: const [
          MarketDepthLevel(price: 100.0, size: 10, orderCount: 1),
          MarketDepthLevel(price: 99.0, size: 20, orderCount: 1),
        ],
        asks: const [MarketDepthLevel(price: 101.0, size: 15, orderCount: 1)],
        capturedAt: ts,
      );
      expect(snap.totalBidNotional, closeTo(2980.0, 0.001));
      expect(snap.totalAskNotional, closeTo(1515.0, 0.001));
    });

    test('equality holds for identical snapshots', () {
      final a = MarketDepthSnapshot(
        symbol: 'X',
        bids: const [],
        asks: const [],
        capturedAt: ts,
      );
      final b = MarketDepthSnapshot(
        symbol: 'X',
        bids: const [],
        asks: const [],
        capturedAt: ts,
      );
      expect(a, equals(b));
    });
  });
}
