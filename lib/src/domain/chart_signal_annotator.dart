/// Chart Signal Annotator — Pure domain logic.
///
/// Marks BUY/SELL signals from the consensus engine on a price chart.
/// Each annotation contains a date, price, signal direction, and label.
library;

import 'package:equatable/equatable.dart';

/// Direction of a chart signal annotation.
enum SignalAnnotationDirection { buy, sell }

/// A signal annotation to overlay on a price chart.
class ChartSignalAnnotation extends Equatable {
  const ChartSignalAnnotation({
    required this.date,
    required this.price,
    required this.direction,
    required this.label,
    this.methodName,
    this.confidence,
  });

  final DateTime date;
  final double price;
  final SignalAnnotationDirection direction;
  final String label;

  /// The method that produced this signal (e.g. 'Consensus', 'Micho Method').
  final String? methodName;

  /// Signal confidence in [0, 1]. Null if not applicable.
  final double? confidence;

  bool get isBuy => direction == SignalAnnotationDirection.buy;
  bool get isSell => direction == SignalAnnotationDirection.sell;

  @override
  List<Object?> get props => [
    date,
    price,
    direction,
    label,
    methodName,
    confidence,
  ];
}

/// Builds chart annotations from signal history.
class ChartSignalAnnotator {
  const ChartSignalAnnotator();

  /// Convert raw signal records into chart annotations.
  ///
  /// [signals] is a list of maps with keys:
  ///   - 'date' (DateTime), 'price' (double), 'direction' ('BUY'/'SELL'),
  ///   - 'method' (String), 'confidence' (double?).
  List<ChartSignalAnnotation> annotate({
    required List<SignalRecord> signals,
    bool consensusOnly = false,
  }) {
    final List<ChartSignalAnnotation> annotations = [];

    for (final SignalRecord signal in signals) {
      if (consensusOnly && signal.method != 'Consensus') continue;

      final SignalAnnotationDirection direction = signal.direction == 'BUY'
          ? SignalAnnotationDirection.buy
          : SignalAnnotationDirection.sell;

      annotations.add(
        ChartSignalAnnotation(
          date: signal.date,
          price: signal.price,
          direction: direction,
          label: '${signal.direction} — ${signal.method}',
          methodName: signal.method,
          confidence: signal.confidence,
        ),
      );
    }

    return annotations;
  }

  /// Filter annotations to only include strong signals (confidence >= threshold).
  List<ChartSignalAnnotation> filterStrong(
    List<ChartSignalAnnotation> annotations, {
    double threshold = 0.7,
  }) {
    return annotations
        .where(
          (ChartSignalAnnotation a) =>
              a.confidence == null || a.confidence! >= threshold,
        )
        .toList();
  }
}

/// A typed signal record for annotation input.
class SignalRecord extends Equatable {
  const SignalRecord({
    required this.date,
    required this.price,
    required this.direction,
    required this.method,
    this.confidence,
  });

  final DateTime date;
  final double price;

  /// 'BUY' or 'SELL'.
  final String direction;
  final String method;
  final double? confidence;

  @override
  List<Object?> get props => [date, price, direction, method, confidence];
}
