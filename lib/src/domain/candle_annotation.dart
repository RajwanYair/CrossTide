/// Candle Annotation — overlay markers attached to specific candles for charts.
library;

import 'package:equatable/equatable.dart';

/// Visual shape of the annotation marker.
enum AnnotationShape {
  /// Upward triangle (buy signal).
  triangleUp,

  /// Downward triangle (sell signal).
  triangleDown,

  /// Circle dot.
  dot,

  /// Circle outline.
  circle,

  /// Diamond.
  diamond,

  /// Star.
  star,
}

/// Semantic category of the annotation.
enum AnnotationKind {
  /// Consensus BUY signal fired.
  consensusBuy,

  /// Consensus SELL signal fired.
  consensusSell,

  /// Single-method BUY signal.
  methodBuy,

  /// Single-method SELL signal.
  methodSell,

  /// Price-target hit.
  priceTargetHit,

  /// Earnings release date.
  earningsDate,

  /// Dividend ex-date.
  dividendExDate,

  /// Custom user annotation.
  custom,
}

/// An annotation marker positioned on a specific candle date.
class CandleAnnotation extends Equatable {
  const CandleAnnotation({
    required this.ticker,
    required this.candleDate,
    required this.kind,
    required this.shape,
    this.label,
    this.methodName,
    this.priceLevel,
  });

  final String ticker;

  /// ISO date of the candle this annotation belongs to.
  final DateTime candleDate;

  final AnnotationKind kind;
  final AnnotationShape shape;

  /// Short label shown in a tooltip (e.g. 'RSI BUY').
  final String? label;

  /// For method signals — which method fired.
  final String? methodName;

  /// For price-level annotations — the relevant price.
  final double? priceLevel;

  /// True when the annotation represents a BUY direction.
  bool get isBuy =>
      kind == AnnotationKind.consensusBuy ||
      kind == AnnotationKind.methodBuy;

  @override
  List<Object?> get props => [
        ticker,
        candleDate,
        kind,
        shape,
        label,
        methodName,
        priceLevel,
      ];
}

/// Builds a sorted list of [CandleAnnotation]s for a chart from a set of signals.
class CandleAnnotationBuilder {
  const CandleAnnotationBuilder();

  /// Create annotations for a list of fired signal maps.
  ///
  /// [signals] is a list of records:
  ///   - `ticker`: String  
  ///   - `date`: DateTime  
  ///   - `kind`: AnnotationKind  
  ///   - `method`: String? (method name, for method signals)  
  List<CandleAnnotation> build(
    List<({String ticker, DateTime date, AnnotationKind kind, String? method})>
        signals,
  ) {
    final result = signals.map((s) => CandleAnnotation(
          ticker: s.ticker,
          candleDate: s.date,
          kind: s.kind,
          shape: _shapeFor(s.kind),
          label: _labelFor(s.kind, s.method),
          methodName: s.method,
        ));

    final list = result.toList()
      ..sort((a, b) => a.candleDate.compareTo(b.candleDate));
    return list;
  }

  AnnotationShape _shapeFor(AnnotationKind kind) {
    switch (kind) {
      case AnnotationKind.consensusBuy:
        return AnnotationShape.triangleUp;
      case AnnotationKind.consensusSell:
        return AnnotationShape.triangleDown;
      case AnnotationKind.methodBuy:
        return AnnotationShape.dot;
      case AnnotationKind.methodSell:
        return AnnotationShape.dot;
      case AnnotationKind.priceTargetHit:
        return AnnotationShape.diamond;
      case AnnotationKind.earningsDate:
        return AnnotationShape.star;
      case AnnotationKind.dividendExDate:
        return AnnotationShape.circle;
      case AnnotationKind.custom:
        return AnnotationShape.dot;
    }
  }

  String _labelFor(AnnotationKind kind, String? method) {
    switch (kind) {
      case AnnotationKind.consensusBuy:
        return 'Consensus BUY';
      case AnnotationKind.consensusSell:
        return 'Consensus SELL';
      case AnnotationKind.methodBuy:
        return '${method ?? "Method"} BUY';
      case AnnotationKind.methodSell:
        return '${method ?? "Method"} SELL';
      case AnnotationKind.priceTargetHit:
        return 'Price Target';
      case AnnotationKind.earningsDate:
        return 'Earnings';
      case AnnotationKind.dividendExDate:
        return 'Ex-Div';
      case AnnotationKind.custom:
        return method ?? 'Note';
    }
  }
}

// (AnnotationShape.circle is defined in the enum above)
