import 'package:equatable/equatable.dart';

/// Type of conflict between two signals on the same ticker.
enum SignalConflictType {
  buyVsSell,
  divergentMethods,
  timeframeConflict,
  momentumVsReversal,
}

/// A detected conflict between two or more signals on a ticker.
class SignalConflict extends Equatable {
  const SignalConflict({
    required this.symbol,
    required this.conflictType,
    required this.methodA,
    required this.methodB,
    required this.detectedAt,
    this.description,
  });

  final String symbol;
  final SignalConflictType conflictType;
  final String methodA;
  final String methodB;
  final DateTime detectedAt;
  final String? description;

  bool get isBuyVsSell => conflictType == SignalConflictType.buyVsSell;
  bool get hasDescription => description != null;

  @override
  List<Object?> get props => [
    symbol,
    conflictType,
    methodA,
    methodB,
    detectedAt,
    description,
  ];
}

/// Analyzes for conflicting signals across methods on the same ticker.
class SignalConflictAnalyzer extends Equatable {
  const SignalConflictAnalyzer({this.detectTimeframeConflicts = true});

  final bool detectTimeframeConflicts;

  /// Find conflicts within a map of {methodName → signal direction ('buy'/'sell')}.
  List<SignalConflict> analyze({
    required String symbol,
    required Map<String, String> methodSignals,
    required DateTime now,
  }) {
    final List<SignalConflict> conflicts = [];
    final List<MapEntry<String, String>> entries = methodSignals.entries
        .toList();

    for (int i = 0; i < entries.length; i++) {
      for (int j = i + 1; j < entries.length; j++) {
        final MapEntry<String, String> a = entries[i];
        final MapEntry<String, String> b = entries[j];
        if (a.value != b.value) {
          conflicts.add(
            SignalConflict(
              symbol: symbol,
              conflictType: SignalConflictType.buyVsSell,
              methodA: a.key,
              methodB: b.key,
              detectedAt: now,
              description:
                  '${a.key} says ${a.value} but ${b.key} says ${b.value}',
            ),
          );
        }
      }
    }
    return conflicts;
  }

  @override
  List<Object?> get props => [detectTimeframeConflicts];
}
