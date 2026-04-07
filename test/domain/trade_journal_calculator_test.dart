import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const calc = TradeJournalCalculator();

  group('TradeJournalCalculator', () {
    test('empty entries returns zeroed summary', () {
      final result = calc.summarize([]);
      expect(result.totalTrades, 0);
      expect(result.winRate, 0);
      expect(result.totalPnl, 0);
    });

    test('summarizes winning and losing trades', () {
      final entries = [
        JournalEntry(
          ticker: 'AAPL',
          entryDate: DateTime(2024, 1, 1),
          exitDate: DateTime(2024, 1, 10),
          entryPrice: 100,
          exitPrice: 110,
          shares: 10,
          method: 'Micho',
        ),
        JournalEntry(
          ticker: 'TSLA',
          entryDate: DateTime(2024, 2, 1),
          exitDate: DateTime(2024, 2, 5),
          entryPrice: 200,
          exitPrice: 190,
          shares: 5,
          method: 'RSI',
        ),
      ];

      final result = calc.summarize(entries);
      expect(result.totalTrades, 2);
      expect(result.wins, 1);
      expect(result.losses, 1);
      expect(result.winRate, 0.5);
      expect(result.totalPnl, closeTo(50, 0.01));
      expect(result.bestTrade!.ticker, 'AAPL');
      expect(result.worstTrade!.ticker, 'TSLA');
      expect(result.methodBreakdown['Micho'], 1.0);
      expect(result.methodBreakdown['RSI'], 0.0);
    });

    test('journal entry computes PnL and return correctly', () {
      final entry = JournalEntry(
        ticker: 'GOOG',
        entryDate: DateTime(2024, 1, 1),
        exitDate: DateTime(2024, 1, 15),
        entryPrice: 150,
        exitPrice: 165,
        shares: 20,
        method: 'MACD',
      );

      expect(entry.pnl, 300);
      expect(entry.returnPct, 10);
      expect(entry.holdingDays, 14);
      expect(entry.isWin, isTrue);
    });

    test('profit factor computed correctly', () {
      final entries = [
        JournalEntry(
          ticker: 'A',
          entryDate: DateTime(2024),
          exitDate: DateTime(2024, 1, 2),
          entryPrice: 100,
          exitPrice: 112,
          shares: 10,
          method: 'M',
        ),
        JournalEntry(
          ticker: 'B',
          entryDate: DateTime(2024),
          exitDate: DateTime(2024, 1, 2),
          entryPrice: 100,
          exitPrice: 94,
          shares: 10,
          method: 'M',
        ),
      ];

      final result = calc.summarize(entries);
      // grossProfit = 120, grossLoss = 60
      expect(result.profitFactor, closeTo(2.0, 0.01));
    });
  });
}
