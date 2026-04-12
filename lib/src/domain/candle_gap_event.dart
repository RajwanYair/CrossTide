import 'package:equatable/equatable.dart';

/// A price gap between the prior session close and the current open.
///
/// Gap events signal potential momentum shifts and are used by gap-trading
/// strategies and alert rules to identify unusual opening moves.
class CandleGapEvent extends Equatable {
  /// Creates a [CandleGapEvent].
  const CandleGapEvent({
    required this.ticker,
    required this.gapDate,
    required this.prevClose,
    required this.openPrice,
  });

  /// Ticker symbol.
  final String ticker;

  /// Trading date on which the gap occurred.
  final DateTime gapDate;

  /// Closing price of the previous session.
  final double prevClose;

  /// Opening price of the gap session.
  final double openPrice;

  /// Gap size as a signed percentage relative to [prevClose].
  /// Positive = gap up; negative = gap down.
  double get gapPct =>
      prevClose == 0 ? 0.0 : (openPrice - prevClose) / prevClose * 100;

  /// Returns `true` when [openPrice] is above [prevClose].
  bool get isGapUp => openPrice > prevClose;

  /// Returns `true` when the absolute gap percentage is at least 2%.
  bool get isBigGap => gapPct.abs() >= 2.0;

  @override
  List<Object?> get props => [ticker, gapDate, prevClose, openPrice];
}
