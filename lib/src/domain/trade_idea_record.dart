import 'package:equatable/equatable.dart';

/// Conviction level for a trade idea.
enum TradeIdeaConviction { low, medium, high }

/// Direction of a trade idea.
enum TradeIdeaDirection { long, short, neutral }

/// A structured trade idea or thesis record linking a ticker to a
/// rationale, entry criteria, and risk/reward targets.
class TradeIdeaRecord extends Equatable {
  const TradeIdeaRecord({
    required this.ideaId,
    required this.ticker,
    required this.direction,
    required this.conviction,
    required this.thesis,
    required this.createdAt,
    this.entryPrice,
    this.targetPrice,
    this.stopPrice,
    this.catalystDate,
    this.tags = const [],
  });

  final String ideaId;
  final String ticker;
  final TradeIdeaDirection direction;
  final TradeIdeaConviction conviction;

  /// Plain-text investment thesis or rationale.
  final String thesis;

  final DateTime createdAt;
  final double? entryPrice;
  final double? targetPrice;
  final double? stopPrice;
  final DateTime? catalystDate;
  final List<String> tags;

  TradeIdeaRecord copyWith({
    String? ideaId,
    String? ticker,
    TradeIdeaDirection? direction,
    TradeIdeaConviction? conviction,
    String? thesis,
    DateTime? createdAt,
    double? entryPrice,
    double? targetPrice,
    double? stopPrice,
    DateTime? catalystDate,
    List<String>? tags,
  }) => TradeIdeaRecord(
    ideaId: ideaId ?? this.ideaId,
    ticker: ticker ?? this.ticker,
    direction: direction ?? this.direction,
    conviction: conviction ?? this.conviction,
    thesis: thesis ?? this.thesis,
    createdAt: createdAt ?? this.createdAt,
    entryPrice: entryPrice ?? this.entryPrice,
    targetPrice: targetPrice ?? this.targetPrice,
    stopPrice: stopPrice ?? this.stopPrice,
    catalystDate: catalystDate ?? this.catalystDate,
    tags: tags ?? this.tags,
  );

  @override
  List<Object?> get props => [
    ideaId,
    ticker,
    direction,
    conviction,
    thesis,
    createdAt,
    entryPrice,
    targetPrice,
    stopPrice,
    catalystDate,
    tags,
  ];
}
