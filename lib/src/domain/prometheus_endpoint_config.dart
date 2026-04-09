/// Prometheus Endpoint Config — configuration for the optional /metrics scrape endpoint.
library;

import 'package:equatable/equatable.dart';

/// Authentication scheme used to protect the metrics endpoint.
enum MetricsAuthScheme {
  /// No authentication — endpoint is publicly accessible within the local network.
  none,

  /// Bearer token authentication — token stored in secure storage.
  bearerToken,

  /// HTTP Basic authentication — password stored in secure storage.
  basicAuth,
}

/// Configuration for the optional Prometheus-compatible scrape endpoint.
class PrometheusEndpointConfig extends Equatable {
  const PrometheusEndpointConfig({
    required this.enabled,
    required this.port,
    required this.path,
    required this.authScheme,
    required this.scrapeIntervalSeconds,
    this.tokenKeyRef,
  }) : assert(port > 0 && port <= 65535, 'port must be in [1, 65535]'),
       assert(scrapeIntervalSeconds > 0, 'scrapeIntervalSeconds must be > 0');

  /// Disabled by default on port 9090 at /metrics, no auth.
  factory PrometheusEndpointConfig.defaults() => const PrometheusEndpointConfig(
    enabled: false,
    port: 9090,
    path: '/metrics',
    authScheme: MetricsAuthScheme.none,
    scrapeIntervalSeconds: 15,
  );

  final bool enabled;

  /// TCP port the HTTP server listens on.
  final int port;

  /// HTTP path at which metrics are served (e.g. '/metrics').
  final String path;

  final MetricsAuthScheme authScheme;

  /// How often (in seconds) Prometheus is expected to scrape this endpoint.
  final int scrapeIntervalSeconds;

  /// Key reference into flutter_secure_storage for the bearer token or password.
  /// Null when [authScheme] is [MetricsAuthScheme.none].
  final String? tokenKeyRef;

  /// Returns true when [authScheme] requires a credential.
  bool get requiresAuth => authScheme != MetricsAuthScheme.none;

  @override
  List<Object?> get props => [
    enabled,
    port,
    path,
    authScheme,
    scrapeIntervalSeconds,
    tokenKeyRef,
  ];
}
