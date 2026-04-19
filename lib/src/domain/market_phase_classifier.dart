import 'package:equatable/equatable.dart';

/// Market phase classifier — Wyckoff accumulation/markup/distribution/markdown phase.
enum MarketPhase { accumulation, markup, distribution, markdown }

class MarketPhaseClassifier extends Equatable {
  const MarketPhaseClassifier({
    required this.ticker,
    required this.phase,
    required this.confidence,
    required this.priceLevel,
    required this.volumeSignal,
  });

  final String ticker;
  final MarketPhase phase;
  final double confidence;
  final double priceLevel;
  final String volumeSignal;

  MarketPhaseClassifier copyWith({
    String? ticker,
    MarketPhase? phase,
    double? confidence,
    double? priceLevel,
    String? volumeSignal,
  }) => MarketPhaseClassifier(
    ticker: ticker ?? this.ticker,
    phase: phase ?? this.phase,
    confidence: confidence ?? this.confidence,
    priceLevel: priceLevel ?? this.priceLevel,
    volumeSignal: volumeSignal ?? this.volumeSignal,
  );

  @override
  List<Object?> get props => [
    ticker,
    phase,
    confidence,
    priceLevel,
    volumeSignal,
  ];
}
