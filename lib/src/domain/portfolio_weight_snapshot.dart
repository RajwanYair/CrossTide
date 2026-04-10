import 'package:equatable/equatable.dart';

/// A single ticker's weight entry in a portfolio weight snapshot.
class PortfolioWeightEntry extends Equatable {
  const PortfolioWeightEntry({
    required this.ticker,
    required this.weightPct,
    required this.marketValue,
  });

  final String ticker;

  /// Weight as a percentage of total portfolio (0.0–100.0).
  final double weightPct;

  /// Market value of the position in the portfolio's base currency.
  final double marketValue;

  bool get isDominant => weightPct >= 10.0;

  @override
  List<Object?> get props => [ticker, weightPct, marketValue];
}

/// Point-in-time snapshot of portfolio weight allocations.
class PortfolioWeightSnapshot extends Equatable {
  const PortfolioWeightSnapshot({
    required this.snapshotId,
    required this.capturedAt,
    required this.entries,
    required this.totalValue,
  });

  final String snapshotId;
  final DateTime capturedAt;
  final List<PortfolioWeightEntry> entries;

  /// Total portfolio market value.
  final double totalValue;

  /// Tickers with weight ≥ 10 % (dominant positions).
  List<String> get dominantTickers => entries
      .where((PortfolioWeightEntry e) => e.isDominant)
      .map((PortfolioWeightEntry e) => e.ticker)
      .toList();

  /// Largest weight entry.
  PortfolioWeightEntry? get topHolding => entries.isEmpty
      ? null
      : entries.reduce(
          (PortfolioWeightEntry a, PortfolioWeightEntry b) =>
              a.weightPct >= b.weightPct ? a : b,
        );

  bool get isEmpty => entries.isEmpty;

  @override
  List<Object?> get props => [snapshotId, capturedAt, entries, totalValue];
}
