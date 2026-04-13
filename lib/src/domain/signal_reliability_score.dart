import 'package:equatable/equatable.dart';

/// Signal reliability score — historical accuracy grade for a method.
enum ReliabilityGrade { a, b, c, d, f }

class SignalReliabilityScore extends Equatable {
  const SignalReliabilityScore({
    required this.ticker,
    required this.method,
    required this.score,
    required this.sampleSize,
    required this.grade,
  });

  final String ticker;
  final String method;
  final double score;
  final int sampleSize;
  final ReliabilityGrade grade;

  SignalReliabilityScore copyWith({
    String? ticker,
    String? method,
    double? score,
    int? sampleSize,
    ReliabilityGrade? grade,
  }) => SignalReliabilityScore(
    ticker: ticker ?? this.ticker,
    method: method ?? this.method,
    score: score ?? this.score,
    sampleSize: sampleSize ?? this.sampleSize,
    grade: grade ?? this.grade,
  );

  @override
  List<Object?> get props => [ticker, method, score, sampleSize, grade];
}
