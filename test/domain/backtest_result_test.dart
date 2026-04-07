import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('BacktestTrade', () {
    test('returnPercent is positive for winning trade', () {
      final trade = BacktestTrade(
        entryDate: DateTime(2024, 1, 1),
        entryPrice: 100,
        exitDate: DateTime(2024, 2, 1),
        exitPrice: 110,
        methodName: 'Micho',
      );
      expect(trade.returnPercent, closeTo(10.0, 0.01));
      expect(trade.isWinner, isTrue);
      expect(trade.profitLoss, 10.0);
    });

    test('returnPercent is negative for losing trade', () {
      final trade = BacktestTrade(
        entryDate: DateTime(2024, 1, 1),
        entryPrice: 100,
        exitDate: DateTime(2024, 2, 1),
        exitPrice: 90,
        methodName: 'Micho',
      );
      expect(trade.returnPercent, closeTo(-10.0, 0.01));
      expect(trade.isWinner, isFalse);
    });

    test('equality', () {
      final t1 = BacktestTrade(
        entryDate: DateTime(2024, 1, 1),
        entryPrice: 100,
        exitDate: DateTime(2024, 2, 1),
        exitPrice: 110,
        methodName: 'Micho',
      );
      final t2 = BacktestTrade(
        entryDate: DateTime(2024, 1, 1),
        entryPrice: 100,
        exitDate: DateTime(2024, 2, 1),
        exitPrice: 110,
        methodName: 'Micho',
      );
      expect(t1, equals(t2));
    });
  });

  group('BacktestResult', () {
    final trades = [
      BacktestTrade(
        entryDate: DateTime(2024, 1, 1),
        entryPrice: 100,
        exitDate: DateTime(2024, 2, 1),
        exitPrice: 120,
        methodName: 'Micho',
      ),
      BacktestTrade(
        entryDate: DateTime(2024, 3, 1),
        entryPrice: 120,
        exitDate: DateTime(2024, 4, 1),
        exitPrice: 110,
        methodName: 'Micho',
      ),
      BacktestTrade(
        entryDate: DateTime(2024, 5, 1),
        entryPrice: 110,
        exitDate: DateTime(2024, 6, 1),
        exitPrice: 130,
        methodName: 'Micho',
      ),
    ];

    test('totalTrades', () {
      final result = BacktestResult(
        ticker: 'AAPL',
        methodName: 'Micho',
        startDate: DateTime(2024, 1, 1),
        endDate: DateTime(2024, 6, 30),
        trades: trades,
        startingEquity: 10000,
      );
      expect(result.totalTrades, 3);
    });

    test('winners and losers', () {
      final result = BacktestResult(
        ticker: 'AAPL',
        methodName: 'Micho',
        startDate: DateTime(2024, 1, 1),
        endDate: DateTime(2024, 6, 30),
        trades: trades,
        startingEquity: 10000,
      );
      expect(result.winners, 2);
      expect(result.losers, 1);
    });

    test('winRate', () {
      final result = BacktestResult(
        ticker: 'AAPL',
        methodName: 'Micho',
        startDate: DateTime(2024, 1, 1),
        endDate: DateTime(2024, 6, 30),
        trades: trades,
        startingEquity: 10000,
      );
      expect(result.winRate, closeTo(66.67, 0.01));
    });

    test('totalReturnPercent', () {
      // P/L: +20, -10, +20 = +30 on 10000 start = 0.3%
      final result = BacktestResult(
        ticker: 'AAPL',
        methodName: 'Micho',
        startDate: DateTime(2024, 1, 1),
        endDate: DateTime(2024, 6, 30),
        trades: trades,
        startingEquity: 10000,
      );
      expect(result.totalReturnPercent, closeTo(0.3, 0.01));
    });

    test('empty trades', () {
      final result = BacktestResult(
        ticker: 'AAPL',
        methodName: 'Micho',
        startDate: DateTime(2024, 1, 1),
        endDate: DateTime(2024, 6, 30),
        trades: const [],
        startingEquity: 10000,
      );
      expect(result.totalTrades, 0);
      expect(result.winRate, 0);
      expect(result.totalReturnPercent, 0);
      expect(result.avgReturnPerTrade, 0);
      expect(result.maxWin, 0);
      expect(result.maxLoss, 0);
    });

    test('maxWin and maxLoss', () {
      final result = BacktestResult(
        ticker: 'AAPL',
        methodName: 'Micho',
        startDate: DateTime(2024, 1, 1),
        endDate: DateTime(2024, 6, 30),
        trades: trades,
        startingEquity: 10000,
      );
      expect(result.maxWin, closeTo(20.0, 0.01));
      expect(result.maxLoss, closeTo(-8.33, 0.01));
    });

    test('equality', () {
      final r1 = BacktestResult(
        ticker: 'AAPL',
        methodName: 'Micho',
        startDate: DateTime(2024, 1, 1),
        endDate: DateTime(2024, 6, 30),
        trades: const [],
        startingEquity: 10000,
      );
      final r2 = BacktestResult(
        ticker: 'AAPL',
        methodName: 'Micho',
        startDate: DateTime(2024, 1, 1),
        endDate: DateTime(2024, 6, 30),
        trades: const [],
        startingEquity: 10000,
      );
      expect(r1, equals(r2));
    });
  });
}
