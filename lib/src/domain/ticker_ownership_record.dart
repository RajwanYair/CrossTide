import 'package:equatable/equatable.dart';

/// A record of institutional or retail ownership for a ticker.
///
/// Tracks the percentage of outstanding shares held by a given owner
/// category and the change since the last reporting period.
class TickerOwnershipRecord extends Equatable {
  /// Creates a [TickerOwnershipRecord].
  const TickerOwnershipRecord({
    required this.ticker,
    required this.ownerCategory,
    required this.ownershipPct,
    required this.reportedAt,
    this.changePctPoints,
    this.holderName,
  });

  /// Ticker symbol.
  final String ticker;

  /// Category of the owner (e.g. `'institutional'`, `'insider'`, `'retail'`).
  final String ownerCategory;

  /// Percentage of outstanding shares held (0–100).
  final double ownershipPct;

  /// End of the reporting period.
  final DateTime reportedAt;

  /// Change in ownership percentage points since prior report
  /// (positive = accumulation, negative = distribution).
  final double? changePctPoints;

  /// Name of the specific holder (e.g. `'Vanguard Group'`), if available.
  final String? holderName;

  /// Returns `true` when ownership is above 5% — a significant stake.
  bool get isSignificantHolder => ownershipPct >= 5.0;

  /// Returns `true` when the holder is accumulating (adding shares).
  bool get isAccumulating => changePctPoints != null && changePctPoints! > 0;

  @override
  List<Object?> get props => [
    ticker,
    ownerCategory,
    ownershipPct,
    reportedAt,
    changePctPoints,
    holderName,
  ];
}
