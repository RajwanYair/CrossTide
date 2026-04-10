import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('TechnicalScanResult', () {
    final DateTime scannedAt = DateTime(2025, 3, 1);

    final TechnicalScanResult fullMatch = TechnicalScanResult(
      symbol: 'AAPL',
      scanName: 'SMA Breakout',
      matchedConditions: const [
        ScanConditionMatch(
          conditionName: 'price > sma200',
          actualValue: 210.0,
          thresholdValue: 200.0,
          isSatisfied: true,
        ),
        ScanConditionMatch(
          conditionName: 'rsi < 70',
          actualValue: 65.0,
          thresholdValue: 70.0,
          isSatisfied: true,
        ),
      ],
      totalConditions: 2,
      scannedAt: scannedAt,
      closingPrice: 210.0,
    );

    final TechnicalScanResult partialMatch = TechnicalScanResult(
      symbol: 'MSFT',
      scanName: 'SMA Breakout',
      matchedConditions: const [
        ScanConditionMatch(
          conditionName: 'price > sma200',
          actualValue: 310.0,
          thresholdValue: 300.0,
          isSatisfied: true,
        ),
        ScanConditionMatch(
          conditionName: 'rsi < 70',
          actualValue: 75.0,
          thresholdValue: 70.0,
          isSatisfied: false,
        ),
      ],
      totalConditions: 2,
      scannedAt: scannedAt,
    );

    test('isFullMatch true when all conditions met', () {
      expect(fullMatch.isFullMatch, isTrue);
    });

    test('isFullMatch false for partial', () {
      expect(partialMatch.isFullMatch, isFalse);
    });

    test('hasPartialMatch true', () {
      expect(partialMatch.hasPartialMatch, isTrue);
    });

    test('matchScore 1.0 for full match', () {
      expect(fullMatch.matchScore, 1.0);
    });

    test('matchScore 0.5 for partial', () {
      expect(partialMatch.matchScore, 0.5);
    });

    test('failedConditions returns unsatisfied', () {
      expect(partialMatch.failedConditions.length, 1);
      expect(partialMatch.failedConditions.first.conditionName, 'rsi < 70');
    });

    test('equality', () {
      final TechnicalScanResult same = TechnicalScanResult(
        symbol: 'AAPL',
        scanName: 'SMA Breakout',
        matchedConditions: const [
          ScanConditionMatch(
            conditionName: 'price > sma200',
            actualValue: 210.0,
            thresholdValue: 200.0,
            isSatisfied: true,
          ),
          ScanConditionMatch(
            conditionName: 'rsi < 70',
            actualValue: 65.0,
            thresholdValue: 70.0,
            isSatisfied: true,
          ),
        ],
        totalConditions: 2,
        scannedAt: scannedAt,
        closingPrice: 210.0,
      );
      expect(fullMatch, same);
    });
  });
}
