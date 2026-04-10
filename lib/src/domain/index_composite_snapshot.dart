import 'package:equatable/equatable.dart';

/// A single constituent holding within an index or ETF.
class IndexConstituentEntry extends Equatable {
  const IndexConstituentEntry({
    required this.symbol,
    required this.companyName,
    required this.weightPct,
    required this.sector,
    this.sharesHeld = 0,
  }) : assert(weightPct >= 0, 'weightPct must be non-negative');

  final String symbol;
  final String companyName;

  /// Portfolio weight as a percentage (0–100).
  final double weightPct;
  final String sector;

  /// Number of shares held in the index/ETF (0 when unavailable).
  final int sharesHeld;

  bool get isDominant => weightPct >= 5.0;

  @override
  List<Object?> get props => [
    symbol,
    companyName,
    weightPct,
    sector,
    sharesHeld,
  ];
}

/// A point-in-time snapshot of all constituents for an index or ETF.
class IndexCompositeSnapshot extends Equatable {
  const IndexCompositeSnapshot({
    required this.indexSymbol,
    required this.indexName,
    required this.constituents,
    required this.capturedAt,
    this.totalHoldings = 0,
  });

  final String indexSymbol;
  final String indexName;
  final List<IndexConstituentEntry> constituents;
  final DateTime capturedAt;

  /// Total number of holdings (may exceed `constituents.length` when paginated).
  final int totalHoldings;

  bool get isEmpty => constituents.isEmpty;
  int get constituentCount => constituents.length;

  double get totalWeightPct => constituents.fold(
    0.0,
    (final double s, final IndexConstituentEntry c) => s + c.weightPct,
  );

  /// Top-N constituents by weight.
  List<IndexConstituentEntry> topN(final int n) {
    final sorted = List<IndexConstituentEntry>.from(constituents)
      ..sort(
        (final IndexConstituentEntry a, final IndexConstituentEntry b) =>
            b.weightPct.compareTo(a.weightPct),
      );
    return sorted.take(n).toList();
  }

  /// All dominant constituents (weight >= 5%).
  List<IndexConstituentEntry> get dominantHoldings => constituents
      .where((final IndexConstituentEntry c) => c.isDominant)
      .toList();

  @override
  List<Object?> get props => [
    indexSymbol,
    indexName,
    constituents,
    capturedAt,
    totalHoldings,
  ];
}
