import 'package:equatable/equatable.dart';

/// Context enrichment source for a signal.
enum SignalContextSource {
  priceAction,
  volumeSpike,
  macroRegime,
  sentimentIndex,
  newsEvent,
}

/// An enriched signal that bundles a trading signal with contextual
/// market data captured at the time of detection.
class ContextAwareSignal extends Equatable {
  const ContextAwareSignal({
    required this.ticker,
    required this.baseSignalType,
    required this.contextSources,
    required this.priceAtDetection,
    required this.volumeAtDetection,
    required this.detectedAt,
    this.macroRegimeLabel,
    this.sentimentScore,
  });

  final String ticker;

  /// The underlying trading signal name (e.g. "MichoMethodBuy").
  final String baseSignalType;

  /// Context enrichment sources that contributed to this signal.
  final List<SignalContextSource> contextSources;

  final double priceAtDetection;
  final int volumeAtDetection;
  final DateTime detectedAt;

  final String? macroRegimeLabel;

  /// Market sentiment score at signal time (−1.0 = extreme fear, +1.0 = extreme greed).
  final double? sentimentScore;

  ContextAwareSignal copyWith({
    String? ticker,
    String? baseSignalType,
    List<SignalContextSource>? contextSources,
    double? priceAtDetection,
    int? volumeAtDetection,
    DateTime? detectedAt,
    String? macroRegimeLabel,
    double? sentimentScore,
  }) => ContextAwareSignal(
    ticker: ticker ?? this.ticker,
    baseSignalType: baseSignalType ?? this.baseSignalType,
    contextSources: contextSources ?? this.contextSources,
    priceAtDetection: priceAtDetection ?? this.priceAtDetection,
    volumeAtDetection: volumeAtDetection ?? this.volumeAtDetection,
    detectedAt: detectedAt ?? this.detectedAt,
    macroRegimeLabel: macroRegimeLabel ?? this.macroRegimeLabel,
    sentimentScore: sentimentScore ?? this.sentimentScore,
  );

  @override
  List<Object?> get props => [
    ticker,
    baseSignalType,
    contextSources,
    priceAtDetection,
    volumeAtDetection,
    detectedAt,
    macroRegimeLabel,
    sentimentScore,
  ];
}
