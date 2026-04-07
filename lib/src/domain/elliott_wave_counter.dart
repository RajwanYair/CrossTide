/// Elliott Wave Counter — identifies potential Elliott Wave patterns
/// (impulse 5-wave and corrective 3-wave) from swing points.
library;

import 'package:equatable/equatable.dart';

/// Type of Elliott Wave.
enum WaveType { impulse, corrective }

/// An identified wave segment.
class WaveSegment extends Equatable {
  const WaveSegment({
    required this.label,
    required this.startIndex,
    required this.endIndex,
    required this.startPrice,
    required this.endPrice,
  });

  /// Wave label (e.g. "1", "2", "3", "4", "5", "A", "B", "C").
  final String label;

  final int startIndex;
  final int endIndex;
  final double startPrice;
  final double endPrice;

  /// Price change for this wave.
  double get priceChange => endPrice - startPrice;

  /// Whether this is an up-wave.
  bool get isUpWave => endPrice > startPrice;

  @override
  List<Object?> get props => [
    label,
    startIndex,
    endIndex,
    startPrice,
    endPrice,
  ];
}

/// Result of Elliott Wave analysis.
class ElliottWaveResult extends Equatable {
  const ElliottWaveResult({
    required this.type,
    required this.waves,
    required this.isValid,
    required this.invalidReason,
  });

  final WaveType type;
  final List<WaveSegment> waves;
  final bool isValid;

  /// Reason for invalidity, if applicable.
  final String invalidReason;

  @override
  List<Object?> get props => [type, waves, isValid, invalidReason];
}

/// Counts Elliott Waves from alternating swing points.
class ElliottWaveCounter {
  const ElliottWaveCounter();

  /// Attempt to fit a 5-wave impulse from alternating price pivots.
  ///
  /// [pivots] should alternate high/low, minimum 6 points for 5 waves.
  ElliottWaveResult countImpulse(List<({int index, double price})> pivots) {
    if (pivots.length < 6) {
      return const ElliottWaveResult(
        type: WaveType.impulse,
        waves: [],
        isValid: false,
        invalidReason: 'Need at least 6 pivots for 5 waves',
      );
    }

    final labels = ['1', '2', '3', '4', '5'];
    final waves = <WaveSegment>[];

    for (int i = 0; i < 5 && i + 1 < pivots.length; i++) {
      waves.add(
        WaveSegment(
          label: labels[i],
          startIndex: pivots[i].index,
          endIndex: pivots[i + 1].index,
          startPrice: pivots[i].price,
          endPrice: pivots[i + 1].price,
        ),
      );
    }

    // Validate Elliott rules
    final reason = _validateImpulse(waves);

    return ElliottWaveResult(
      type: WaveType.impulse,
      waves: waves,
      isValid: reason.isEmpty,
      invalidReason: reason,
    );
  }

  /// Attempt to fit a 3-wave corrective (A-B-C).
  ElliottWaveResult countCorrective(List<({int index, double price})> pivots) {
    if (pivots.length < 4) {
      return const ElliottWaveResult(
        type: WaveType.corrective,
        waves: [],
        isValid: false,
        invalidReason: 'Need at least 4 pivots for 3 waves',
      );
    }

    final labels = ['A', 'B', 'C'];
    final waves = <WaveSegment>[];

    for (int i = 0; i < 3 && i + 1 < pivots.length; i++) {
      waves.add(
        WaveSegment(
          label: labels[i],
          startIndex: pivots[i].index,
          endIndex: pivots[i + 1].index,
          startPrice: pivots[i].price,
          endPrice: pivots[i + 1].price,
        ),
      );
    }

    return ElliottWaveResult(
      type: WaveType.corrective,
      waves: waves,
      isValid: waves.length == 3,
      invalidReason: waves.length < 3 ? 'Incomplete corrective pattern' : '',
    );
  }

  String _validateImpulse(List<WaveSegment> waves) {
    if (waves.length < 5) return 'Incomplete: need 5 waves';

    // Rule: Wave 2 should not retrace beyond start of Wave 1
    if (waves[0].isUpWave) {
      if (waves[1].endPrice < waves[0].startPrice) {
        return 'Wave 2 retraces past Wave 1 start';
      }
    } else {
      if (waves[1].endPrice > waves[0].startPrice) {
        return 'Wave 2 retraces past Wave 1 start';
      }
    }

    // Rule: Wave 3 should not be the shortest impulse wave
    final w1 = waves[0].priceChange.abs();
    final w3 = waves[2].priceChange.abs();
    final w5 = waves[4].priceChange.abs();

    if (w3 < w1 && w3 < w5) {
      return 'Wave 3 is the shortest impulse wave';
    }

    // Rule: Wave 4 should not overlap Wave 1 territory
    if (waves[0].isUpWave) {
      if (waves[3].endPrice < waves[0].endPrice) {
        return 'Wave 4 overlaps Wave 1 territory';
      }
    } else {
      if (waves[3].endPrice > waves[0].endPrice) {
        return 'Wave 4 overlaps Wave 1 territory';
      }
    }

    return '';
  }
}
