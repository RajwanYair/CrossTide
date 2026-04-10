import 'package:equatable/equatable.dart';

/// A projected income event (dividend or option premium) for a holding.
class IncomeProjectionEntry extends Equatable {
  const IncomeProjectionEntry({
    required this.symbol,
    required this.amount,
    required this.projectedDate,
    required this.incomeType,
  }) : assert(amount > 0, 'amount must be > 0');

  final String symbol;
  final double amount;
  final DateTime projectedDate;
  final String incomeType; // 'dividend' | 'option_premium' | 'interest'

  @override
  List<Object?> get props => [symbol, amount, projectedDate, incomeType];
}

/// Aggregated portfolio income projection over a time horizon.
class PortfolioIncomeProjection extends Equatable {
  const PortfolioIncomeProjection({
    required this.entries,
    required this.startDate,
    required this.endDate,
    required this.generatedAt,
  });

  final List<IncomeProjectionEntry> entries;
  final DateTime startDate;
  final DateTime endDate;
  final DateTime generatedAt;

  /// Total projected income across all entries.
  double get totalProjectedIncome => entries.fold(
    0.0,
    (final double sum, final IncomeProjectionEntry e) => sum + e.amount,
  );

  /// Projected income from dividends only.
  double get dividendIncome => entries
      .where((final IncomeProjectionEntry e) => e.incomeType == 'dividend')
      .fold(
        0.0,
        (final double sum, final IncomeProjectionEntry e) => sum + e.amount,
      );

  /// Projected income from option premiums only.
  double get optionPremiumIncome => entries
      .where(
        (final IncomeProjectionEntry e) => e.incomeType == 'option_premium',
      )
      .fold(
        0.0,
        (final double sum, final IncomeProjectionEntry e) => sum + e.amount,
      );

  int get entryCount => entries.length;
  bool get isEmpty => entries.isEmpty;

  /// Unique tickers with projected income.
  List<String> get symbols =>
      entries.map((final IncomeProjectionEntry e) => e.symbol).toSet().toList();

  @override
  List<Object?> get props => [entries, startDate, endDate, generatedAt];
}
