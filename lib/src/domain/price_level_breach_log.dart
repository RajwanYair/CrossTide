import 'package:equatable/equatable.dart';

/// Audit log entry created when price crosses a configured trigger level.
///
/// Pairs with `PriceTriggerRule` to record when and by how much a
/// price-level condition was satisfied.
class PriceLevelBreachLog extends Equatable {
  /// Creates a [PriceLevelBreachLog].
  const PriceLevelBreachLog({
    required this.logId,
    required this.ticker,
    required this.triggerLevel,
    required this.breachPrice,
    required this.breachedAt,
    required this.isUpside,
  });

  /// Unique identifier for this breach record.
  final String logId;

  /// Ticker that breached the level.
  final String ticker;

  /// The price level that was breached.
  final double triggerLevel;

  /// The actual price at the moment of breach.
  final double breachPrice;

  /// Timestamp of the breach.
  final DateTime breachedAt;

  /// `true` = price crossed upward through [triggerLevel];
  /// `false` = crossed downward.
  final bool isUpside;

  /// Distance between [breachPrice] and [triggerLevel].
  double get overshoot => (breachPrice - triggerLevel).abs();

  /// Overshoot as a percentage of [triggerLevel].
  double get overshootPct =>
      triggerLevel == 0 ? 0.0 : overshoot / triggerLevel * 100;

  @override
  List<Object?> get props => [
    logId,
    ticker,
    triggerLevel,
    breachPrice,
    breachedAt,
    isUpside,
  ];
}
