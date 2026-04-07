/// Harmonic Pattern Detector — identifies harmonic price patterns
/// (Gartley, Butterfly, Bat, Crab) based on Fibonacci ratios.
library;

import 'package:equatable/equatable.dart';

/// Type of harmonic pattern.
enum HarmonicType { gartley, butterfly, bat, crab }

/// Bias of the harmonic pattern.
enum HarmonicBias { bullish, bearish }

/// A detected harmonic pattern.
class HarmonicPattern extends Equatable {
  const HarmonicPattern({
    required this.type,
    required this.bias,
    required this.xPoint,
    required this.aPoint,
    required this.bPoint,
    required this.cPoint,
    required this.dPoint,
    required this.completionPct,
    required this.prz,
  });

  final HarmonicType type;
  final HarmonicBias bias;
  final ({int index, double price}) xPoint;
  final ({int index, double price}) aPoint;
  final ({int index, double price}) bPoint;
  final ({int index, double price}) cPoint;
  final ({int index, double price}) dPoint;

  /// How complete the pattern is (0–100).
  final double completionPct;

  /// Potential Reversal Zone price.
  final double prz;

  @override
  List<Object?> get props => [
    type,
    bias,
    xPoint,
    aPoint,
    bPoint,
    cPoint,
    dPoint,
  ];
}

/// Fibonacci ratio tolerances for each pattern.
class _Ratios {
  const _Ratios({
    required this.abXaMin,
    required this.abXaMax,
    required this.bcAbMin,
    required this.bcAbMax,
    required this.cdBcMin,
    required this.cdBcMax,
    required this.adXaMin,
    required this.adXaMax,
  });

  final double abXaMin, abXaMax;
  final double bcAbMin, bcAbMax;
  final double cdBcMin, cdBcMax;
  final double adXaMin, adXaMax;
}

/// Detects harmonic patterns from price pivots.
class HarmonicPatternDetector {
  const HarmonicPatternDetector({this.tolerance = 0.05});

  /// Ratio matching tolerance.
  final double tolerance;

  static const _patterns = {
    HarmonicType.gartley: _Ratios(
      abXaMin: 0.618,
      abXaMax: 0.618,
      bcAbMin: 0.382,
      bcAbMax: 0.886,
      cdBcMin: 1.272,
      cdBcMax: 1.618,
      adXaMin: 0.786,
      adXaMax: 0.786,
    ),
    HarmonicType.butterfly: _Ratios(
      abXaMin: 0.786,
      abXaMax: 0.786,
      bcAbMin: 0.382,
      bcAbMax: 0.886,
      cdBcMin: 1.618,
      cdBcMax: 2.618,
      adXaMin: 1.272,
      adXaMax: 1.618,
    ),
    HarmonicType.bat: _Ratios(
      abXaMin: 0.382,
      abXaMax: 0.5,
      bcAbMin: 0.382,
      bcAbMax: 0.886,
      cdBcMin: 1.618,
      cdBcMax: 2.618,
      adXaMin: 0.886,
      adXaMax: 0.886,
    ),
    HarmonicType.crab: _Ratios(
      abXaMin: 0.382,
      abXaMax: 0.618,
      bcAbMin: 0.382,
      bcAbMax: 0.886,
      cdBcMin: 2.24,
      cdBcMax: 3.618,
      adXaMin: 1.618,
      adXaMax: 1.618,
    ),
  };

  /// Detect patterns from 5 pivots (X, A, B, C, D).
  List<HarmonicPattern> detect(List<({int index, double price})> pivots) {
    if (pivots.length < 5) return [];

    final results = <HarmonicPattern>[];

    for (int i = 0; i <= pivots.length - 5; i++) {
      final x = pivots[i];
      final a = pivots[i + 1];
      final b = pivots[i + 2];
      final c = pivots[i + 3];
      final d = pivots[i + 4];

      final xa = (a.price - x.price).abs();
      if (xa == 0) continue;

      final ab = (b.price - a.price).abs();
      final bc = (c.price - b.price).abs();
      final cd = (d.price - c.price).abs();
      final ad = (d.price - a.price).abs();

      final abXa = ab / xa;
      final bcAb = ab > 0 ? bc / ab : 0.0;
      final cdBc = bc > 0 ? cd / bc : 0.0;
      final adXa = ad / xa;

      for (final MapEntry<HarmonicType, _Ratios> entry in _patterns.entries) {
        final r = entry.value;
        if (_inRange(abXa, r.abXaMin, r.abXaMax) &&
            _inRange(bcAb, r.bcAbMin, r.bcAbMax) &&
            _inRange(cdBc, r.cdBcMin, r.cdBcMax) &&
            _inRange(adXa, r.adXaMin, r.adXaMax)) {
          final isBullish = a.price > x.price;
          results.add(
            HarmonicPattern(
              type: entry.key,
              bias: isBullish ? HarmonicBias.bullish : HarmonicBias.bearish,
              xPoint: x,
              aPoint: a,
              bPoint: b,
              cPoint: c,
              dPoint: d,
              completionPct: 100,
              prz: d.price,
            ),
          );
        }
      }
    }

    return results;
  }

  bool _inRange(double value, double min, double max) =>
      value >= min - tolerance && value <= max + tolerance;
}
