/// Tax Lot Calculator — FIFO and average-cost tax lot tracking for equities.
library;

import 'package:equatable/equatable.dart';

/// Tax lot accounting method.
enum TaxLotMethod {
  /// First-In First-Out: oldest shares sold first.
  fifo,

  /// Last-In First-Out: newest shares sold first.
  lifo,

  /// Specific identification: seller chooses which lots to close.
  specificId,

  /// Average cost: blended cost across all open lots.
  averageCost,
}

/// A single purchase lot (one buy transaction).
class TaxLot extends Equatable {
  const TaxLot({
    required this.lotId,
    required this.ticker,
    required this.acquiredAt,
    required this.shares,
    required this.costBasisPerShare,
  }) : assert(shares > 0, 'shares must be positive'),
       assert(costBasisPerShare >= 0, 'cost basis must be non-negative');

  final String lotId;
  final String ticker;
  final DateTime acquiredAt;
  final double shares;
  final double costBasisPerShare;

  double get totalCostBasis => shares * costBasisPerShare;

  @override
  List<Object?> get props =>
      [lotId, ticker, acquiredAt, shares, costBasisPerShare];
}

/// Result of closing (selling) shares using a specified accounting method.
class TaxLotSaleResult extends Equatable {
  const TaxLotSaleResult({
    required this.ticker,
    required this.method,
    required this.sharesSold,
    required this.proceeds,
    required this.costBasis,
    required this.realizedGain,
    required this.lotsConsumed,
    required this.isLongTerm,
  });

  final String ticker;
  final TaxLotMethod method;
  final double sharesSold;

  /// Total proceeds from the sale.
  final double proceeds;

  /// Blended cost basis of the shares sold.
  final double costBasis;

  /// Realized gain (positive = profit, negative = loss).
  final double realizedGain;

  /// How many open lots were consumed (fully or partially).
  final int lotsConsumed;

  /// True when the average holding period of consumed lots was > 365 days.
  final bool isLongTerm;

  @override
  List<Object?> get props => [
        ticker,
        method,
        sharesSold,
        proceeds,
        costBasis,
        realizedGain,
        lotsConsumed,
        isLongTerm,
      ];
}

/// Computes tax lot results for sale transactions.
class TaxLotCalculator {
  const TaxLotCalculator();

  /// Compute the result of selling [sharesSold] shares of [ticker] at [pricePerShare]
  /// from [openLots] using the given [method] on [soldAt].
  TaxLotSaleResult? compute({
    required String ticker,
    required List<TaxLot> openLots,
    required double sharesSold,
    required double pricePerShare,
    required DateTime soldAt,
    TaxLotMethod method = TaxLotMethod.fifo,
  }) {
    final lots = openLots.where((l) => l.ticker == ticker).toList();
    if (lots.isEmpty || sharesSold <= 0) return null;

    final totalAvailable =
        lots.fold<double>(0, (a, l) => a + l.shares);
    if (sharesSold > totalAvailable) return null;

    final sorted = _sortedLots(lots, method);
    final proceeds = sharesSold * pricePerShare;

    var remaining = sharesSold;
    var totalCost = 0.0;
    var lotsConsumed = 0;
    var weightedDays = 0.0;

    for (final lot in sorted) {
      if (remaining <= 0) break;
      final used = remaining < lot.shares ? remaining : lot.shares;
      totalCost += used * lot.costBasisPerShare;
      weightedDays +=
          used * soldAt.difference(lot.acquiredAt).inDays.toDouble();
      remaining -= used;
      lotsConsumed++;
    }

    final avgHoldDays = weightedDays / sharesSold;

    return TaxLotSaleResult(
      ticker: ticker,
      method: method,
      sharesSold: sharesSold,
      proceeds: proceeds,
      costBasis: totalCost,
      realizedGain: proceeds - totalCost,
      lotsConsumed: lotsConsumed,
      isLongTerm: avgHoldDays > 365,
    );
  }

  List<TaxLot> _sortedLots(List<TaxLot> lots, TaxLotMethod method) {
    final copy = [...lots];
    switch (method) {
      case TaxLotMethod.fifo:
        copy.sort((a, b) => a.acquiredAt.compareTo(b.acquiredAt));
      case TaxLotMethod.lifo:
        copy.sort((a, b) => b.acquiredAt.compareTo(a.acquiredAt));
      case TaxLotMethod.averageCost:
      case TaxLotMethod.specificId:
        // For average cost and specific ID, return original order.
        break;
    }
    return copy;
  }
}
