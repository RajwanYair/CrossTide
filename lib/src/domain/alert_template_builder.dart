/// Alert Template Builder — predefined alert configuration templates.
///
/// Templates provide quick-start configurations for different trading styles:
/// conservative, moderate, aggressive, and scalper.
library;

import 'package:equatable/equatable.dart';

/// A named alert template with pre-configured settings.
class AlertTemplate extends Equatable {
  const AlertTemplate({
    required this.name,
    required this.description,
    required this.smaPeriods,
    required this.rsiOversold,
    required this.rsiOverbought,
    required this.volumeSpikeMultiplier,
    required this.enabledMethods,
    required this.consensusThreshold,
  });

  final String name;
  final String description;

  /// SMA periods to monitor (e.g. [50, 150, 200]).
  final List<int> smaPeriods;

  /// RSI level to trigger oversold alerts.
  final double rsiOversold;

  /// RSI level to trigger overbought alerts.
  final double rsiOverbought;

  /// Volume multiplier for spike detection.
  final double volumeSpikeMultiplier;

  /// Enabled method names (e.g. 'micho', 'rsi', 'macd').
  final Set<String> enabledMethods;

  /// Number of agreeing methods needed for consensus.
  final int consensusThreshold;

  @override
  List<Object?> get props => [
    name,
    smaPeriods,
    rsiOversold,
    rsiOverbought,
    volumeSpikeMultiplier,
    enabledMethods,
    consensusThreshold,
  ];
}

/// Builds predefined alert templates.
class AlertTemplateBuilder {
  const AlertTemplateBuilder();

  /// All available templates.
  List<AlertTemplate> allTemplates() => [
    conservative(),
    moderate(),
    aggressive(),
    scalper(),
  ];

  /// Conservative: long-term, high-confidence signals only.
  AlertTemplate conservative() => const AlertTemplate(
    name: 'Conservative',
    description: 'Long-term signals with high consensus threshold.',
    smaPeriods: [200],
    rsiOversold: 25,
    rsiOverbought: 75,
    volumeSpikeMultiplier: 3.0,
    enabledMethods: {'micho', 'rsi', 'macd'},
    consensusThreshold: 3,
  );

  /// Moderate: balanced approach.
  AlertTemplate moderate() => const AlertTemplate(
    name: 'Moderate',
    description: 'Balanced signals across multiple timeframes.',
    smaPeriods: [50, 200],
    rsiOversold: 30,
    rsiOverbought: 70,
    volumeSpikeMultiplier: 2.0,
    enabledMethods: {'micho', 'rsi', 'macd', 'bollinger'},
    consensusThreshold: 2,
  );

  /// Aggressive: more signals, lower thresholds.
  AlertTemplate aggressive() => const AlertTemplate(
    name: 'Aggressive',
    description: 'More signals with lower consensus requirements.',
    smaPeriods: [50, 150, 200],
    rsiOversold: 35,
    rsiOverbought: 65,
    volumeSpikeMultiplier: 1.5,
    enabledMethods: {'micho', 'rsi', 'macd', 'bollinger', 'stochastic', 'cci'},
    consensusThreshold: 2,
  );

  /// Scalper: very sensitive, short-term signals.
  AlertTemplate scalper() => const AlertTemplate(
    name: 'Scalper',
    description: 'High-frequency signals for active traders.',
    smaPeriods: [20, 50],
    rsiOversold: 40,
    rsiOverbought: 60,
    volumeSpikeMultiplier: 1.2,
    enabledMethods: {
      'micho',
      'rsi',
      'macd',
      'bollinger',
      'stochastic',
      'cci',
      'sar',
      'adx',
    },
    consensusThreshold: 1,
  );
}
