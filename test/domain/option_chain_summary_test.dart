import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  final expiry = DateTime(2026, 5, 16);

  group('OptionChainSummary', () {
    final chain = OptionChainSummary(
      ticker: 'AAPL',
      expiryDate: expiry,
      underlyingPrice: 175.0,
      callOpenInterest: 10000,
      putOpenInterest: 12000,
      atMoneyImpliedVolatility: 0.28,
      numberOfStrikes: 30,
    );

    test('putCallRatio is correct', () {
      // 12000 / 10000 = 1.2
      expect(chain.putCallRatio, closeTo(1.2, 0.001));
    });

    test('totalOpenInterest sums correctly', () {
      expect(chain.totalOpenInterest, equals(22000));
    });

    test('impliedVolatilityPct converts 0..1 to 0..100', () {
      expect(chain.impliedVolatilityPct, closeTo(28.0, 0.001));
    });

    test('isBearishPositioning is true when putCallRatio > 1.0', () {
      expect(chain.isBearishPositioning, isTrue);
    });

    test('isBearishPositioning is false when calls dominate', () {
      final bullish = OptionChainSummary(
        ticker: 'MSFT',
        expiryDate: expiry,
        underlyingPrice: 400.0,
        callOpenInterest: 15000,
        putOpenInterest: 8000,
        atMoneyImpliedVolatility: 0.20,
        numberOfStrikes: 25,
      );
      expect(bullish.isBearishPositioning, isFalse);
    });

    test('putCallRatio is 0 when no calls', () {
      final noCalls = OptionChainSummary(
        ticker: 'X',
        expiryDate: expiry,
        underlyingPrice: 50.0,
        callOpenInterest: 0,
        putOpenInterest: 5000,
        atMoneyImpliedVolatility: 0.40,
        numberOfStrikes: 10,
      );
      expect(noCalls.putCallRatio, equals(0));
    });

    test('equality holds for same props', () {
      final a = OptionChainSummary(
        ticker: 'AAPL',
        expiryDate: expiry,
        underlyingPrice: 175.0,
        callOpenInterest: 10000,
        putOpenInterest: 12000,
        atMoneyImpliedVolatility: 0.28,
        numberOfStrikes: 30,
      );
      final b = OptionChainSummary(
        ticker: 'AAPL',
        expiryDate: expiry,
        underlyingPrice: 175.0,
        callOpenInterest: 10000,
        putOpenInterest: 12000,
        atMoneyImpliedVolatility: 0.28,
        numberOfStrikes: 30,
      );
      expect(a, equals(b));
    });
  });
}
