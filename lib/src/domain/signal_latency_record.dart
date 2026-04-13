import 'package:equatable/equatable.dart';

/// Signal latency record — detection-to-delivery latency with bucket classification.
enum LatencyBucket { fast, normal, slow, critical }

class SignalLatencyRecord extends Equatable {
  const SignalLatencyRecord({
    required this.ticker,
    required this.method,
    required this.detectionMs,
    required this.deliveryMs,
    required this.bucket,
  });

  final String ticker;
  final String method;
  final int detectionMs;
  final int deliveryMs;
  final LatencyBucket bucket;

  SignalLatencyRecord copyWith({
    String? ticker,
    String? method,
    int? detectionMs,
    int? deliveryMs,
    LatencyBucket? bucket,
  }) => SignalLatencyRecord(
    ticker: ticker ?? this.ticker,
    method: method ?? this.method,
    detectionMs: detectionMs ?? this.detectionMs,
    deliveryMs: deliveryMs ?? this.deliveryMs,
    bucket: bucket ?? this.bucket,
  );

  @override
  List<Object?> get props => [ticker, method, detectionMs, deliveryMs, bucket];
}
