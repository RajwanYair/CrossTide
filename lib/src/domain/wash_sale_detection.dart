import 'package:equatable/equatable.dart';

/// IRS wash-sale rule detection result for a trade (S517).
class WashSaleDetection extends Equatable {
  const WashSaleDetection({
    required this.detectionId,
    required this.ticker,
    required this.saleDateMs,
    required this.repurchaseDateMs,
    required this.disallowedLossUsd,
    this.isConfirmed = false,
  });

  final String detectionId;
  final String ticker;

  /// Epoch milliseconds of the original sale date.
  final int saleDateMs;

  /// Epoch milliseconds of the repurchase date.
  final int repurchaseDateMs;

  /// Amount of the disallowed loss in USD.
  final double disallowedLossUsd;

  /// True when the detection has been reviewed and confirmed.
  final bool isConfirmed;

  int get daysBetween =>
      ((repurchaseDateMs - saleDateMs) / 86400000).round().abs();
  bool get isWithin30Days => daysBetween <= 30;
  bool get hasSignificantLoss => disallowedLossUsd >= 500;

  @override
  List<Object?> get props => [
    detectionId,
    ticker,
    saleDateMs,
    repurchaseDateMs,
    disallowedLossUsd,
    isConfirmed,
  ];
}
