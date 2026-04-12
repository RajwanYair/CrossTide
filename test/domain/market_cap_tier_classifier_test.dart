import 'package:cross_tide/src/domain/market_cap_tier_classifier.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('MarketCapTierClassifier', () {
    test('equality', () {
      final a = MarketCapTierClassifier(
        ticker: 'AAPL',
        tier: CapSizeTier.megaCapital,
        marketCapUsd: 3500000000000.0,
        classifiedAt: DateTime(2025, 9, 1),
      );
      final b = MarketCapTierClassifier(
        ticker: 'AAPL',
        tier: CapSizeTier.megaCapital,
        marketCapUsd: 3500000000000.0,
        classifiedAt: DateTime(2025, 9, 1),
      );
      expect(a, b);
    });

    test('copyWith changes tier', () {
      final base = MarketCapTierClassifier(
        ticker: 'AAPL',
        tier: CapSizeTier.megaCapital,
        marketCapUsd: 3500000000000.0,
        classifiedAt: DateTime(2025, 9, 1),
      );
      final updated = base.copyWith(tier: CapSizeTier.largeCapital);
      expect(updated.tier, CapSizeTier.largeCapital);
    });

    test('props length is 4', () {
      final obj = MarketCapTierClassifier(
        ticker: 'AAPL',
        tier: CapSizeTier.megaCapital,
        marketCapUsd: 3500000000000.0,
        classifiedAt: DateTime(2025, 9, 1),
      );
      expect(obj.props.length, 4);
    });
  });
}
