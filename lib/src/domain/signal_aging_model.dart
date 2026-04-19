import 'package:equatable/equatable.dart';

/// Signal aging model — confidence decay model for stale signals.
enum SignalDecayFunction { exponential, linear, step, none }

class SignalAgingModel extends Equatable {
  const SignalAgingModel({
    required this.method,
    required this.halfLifeHours,
    required this.decayFunction,
    required this.minimumConfidence,
    required this.isActive,
  });

  final String method;
  final double halfLifeHours;
  final SignalDecayFunction decayFunction;
  final double minimumConfidence;
  final bool isActive;

  SignalAgingModel copyWith({
    String? method,
    double? halfLifeHours,
    SignalDecayFunction? decayFunction,
    double? minimumConfidence,
    bool? isActive,
  }) => SignalAgingModel(
    method: method ?? this.method,
    halfLifeHours: halfLifeHours ?? this.halfLifeHours,
    decayFunction: decayFunction ?? this.decayFunction,
    minimumConfidence: minimumConfidence ?? this.minimumConfidence,
    isActive: isActive ?? this.isActive,
  );

  @override
  List<Object?> get props => [
    method,
    halfLifeHours,
    decayFunction,
    minimumConfidence,
    isActive,
  ];
}
