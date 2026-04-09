/// Prometheus Metric — domain model for Prometheus-format metrics export.
library;

import 'package:equatable/equatable.dart';

/// Prometheus metric type.
enum PrometheusMetricType {
  /// Monotonically increasing counter.
  counter,

  /// Arbitrarily settable gauge.
  gauge,

  /// Histogram (bucket-based distribution).
  histogram,

  /// Summary (quantile-based distribution).
  summary,
}

/// A single Prometheus metric with label set and value.
class PrometheusMetric extends Equatable {
  const PrometheusMetric({
    required this.name,
    required this.type,
    required this.help,
    required this.value,
    this.labels = const {},
    this.timestamp,
  });

  /// Metric name (e.g. `crosstide_alerts_total`).
  final String name;

  /// Prometheus metric type.
  final PrometheusMetricType type;

  /// HELP string shown in the metrics page.
  final String help;

  /// Numeric value.
  final double value;

  /// Label key-value pairs (e.g. `{ticker: 'AAPL', method: 'micho'}`).
  final Map<String, String> labels;

  /// Optional Unix ms timestamp; omitted when null.
  final int? timestamp;

  @override
  List<Object?> get props => [name, type, help, value, labels, timestamp];
}

/// A point-in-time snapshot of all Prometheus metrics for one app instance.
class PrometheusMetricsSnapshot extends Equatable {
  const PrometheusMetricsSnapshot({
    required this.instanceId,
    required this.collectedAt,
    required this.metrics,
  });

  /// Stable app instance identifier (e.g. device fingerprint hash).
  final String instanceId;

  /// When these metrics were collected.
  final DateTime collectedAt;

  /// All metrics in this snapshot.
  final List<PrometheusMetric> metrics;

  /// Render the snapshot as Prometheus text format (exposition format 0.0.4).
  String toExpositionFormat() {
    final buf = StringBuffer();
    final seen = <String>{};
    for (final m in metrics) {
      if (seen.add('${m.name}_${m.type.name}')) {
        buf
          ..writeln('# HELP ${m.name} ${m.help}')
          ..writeln('# TYPE ${m.name} ${m.type.name}');
      }
      final labelStr = m.labels.isEmpty
          ? ''
          : '{${m.labels.entries.map((e) => '${e.key}="${e.value}"').join(',')}}';
      final ts =
          m.timestamp != null ? ' ${m.timestamp}' : '';
      buf.writeln('${m.name}$labelStr ${m.value}$ts');
    }
    return buf.toString();
  }

  @override
  List<Object?> get props => [instanceId, collectedAt, metrics];
}
