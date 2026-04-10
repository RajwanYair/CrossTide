import 'package:equatable/equatable.dart';

/// Direction qualifier for a price alert level.
enum PriceAlertDirection { above, below, crossUp, crossDown }

/// Status of a price alert level.
enum PriceAlertStatus { pending, triggered, expired, dismissed }

/// A structured price level alert configuration for a single ticker.
class PriceAlertLevel extends Equatable {
  const PriceAlertLevel({
    required this.id,
    required this.symbol,
    required this.targetPrice,
    required this.direction,
    this.status = PriceAlertStatus.pending,
    this.note,
    this.expiresAt,
  }) : assert(targetPrice > 0, 'targetPrice must be > 0');

  final String id;
  final String symbol;
  final double targetPrice;
  final PriceAlertDirection direction;
  final PriceAlertStatus status;
  final String? note;
  final DateTime? expiresAt;

  bool get isPending => status == PriceAlertStatus.pending;
  bool get isTriggered => status == PriceAlertStatus.triggered;
  bool get hasMemo => note != null && note!.isNotEmpty;
  bool get hasExpiry => expiresAt != null;

  /// Returns true if this alert is expired as of [now].
  bool isExpiredAt(DateTime now) =>
      expiresAt != null && now.isAfter(expiresAt!);

  /// Returns true if [currentPrice] would trigger this alert level.
  bool wouldTrigger(double previousPrice, double currentPrice) {
    return switch (direction) {
      PriceAlertDirection.above => currentPrice >= targetPrice,
      PriceAlertDirection.below => currentPrice <= targetPrice,
      PriceAlertDirection.crossUp =>
        previousPrice < targetPrice && currentPrice >= targetPrice,
      PriceAlertDirection.crossDown =>
        previousPrice > targetPrice && currentPrice <= targetPrice,
    };
  }

  PriceAlertLevel trigger() => PriceAlertLevel(
    id: id,
    symbol: symbol,
    targetPrice: targetPrice,
    direction: direction,
    status: PriceAlertStatus.triggered,
    note: note,
    expiresAt: expiresAt,
  );

  PriceAlertLevel dismiss() => PriceAlertLevel(
    id: id,
    symbol: symbol,
    targetPrice: targetPrice,
    direction: direction,
    status: PriceAlertStatus.dismissed,
    note: note,
    expiresAt: expiresAt,
  );

  @override
  List<Object?> get props => [
    id,
    symbol,
    targetPrice,
    direction,
    status,
    note,
    expiresAt,
  ];
}
