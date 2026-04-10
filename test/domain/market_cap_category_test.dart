import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('MarketCapCategory', () {
    test('classify nano for < 50M', () {
      expect(MarketCapCategory.classify(10_000_000), MarketCapCategory.nano);
    });

    test('classify micro for 50M–300M', () {
      expect(MarketCapCategory.classify(100_000_000), MarketCapCategory.micro);
    });

    test('classify small for 300M–2B', () {
      expect(
        MarketCapCategory.classify(1_000_000_000),
        MarketCapCategory.small,
      );
    });

    test('classify mid for 2B–10B', () {
      expect(MarketCapCategory.classify(5_000_000_000), MarketCapCategory.mid);
    });

    test('classify large for 10B–200B', () {
      expect(
        MarketCapCategory.classify(50_000_000_000),
        MarketCapCategory.large,
      );
    });

    test('classify mega for >= 200B', () {
      expect(
        MarketCapCategory.classify(300_000_000_000),
        MarketCapCategory.mega,
      );
    });

    test('mega has no maxUsd', () {
      expect(MarketCapCategory.mega.maxUsd, isNull);
    });

    test('nano minUsd is 0', () {
      expect(MarketCapCategory.nano.minUsd, 0.0);
    });
  });

  group('MarketCapSnapshot', () {
    final MarketCapSnapshot snap = MarketCapSnapshot(
      symbol: 'AAPL',
      marketCapUsd: 3_000_000_000_000,
      category: MarketCapCategory.mega,
      snapshotDate: DateTime(2025, 1, 1),
    );

    test('isMegaCap true', () {
      expect(snap.isMegaCap, isTrue);
    });

    test('isSmallOrSmaller false for mega', () {
      expect(snap.isSmallOrSmaller, isFalse);
    });

    test('equality', () {
      final MarketCapSnapshot same = MarketCapSnapshot(
        symbol: 'AAPL',
        marketCapUsd: 3_000_000_000_000,
        category: MarketCapCategory.mega,
        snapshotDate: DateTime(2025, 1, 1),
      );
      expect(snap, same);
    });
  });
}
