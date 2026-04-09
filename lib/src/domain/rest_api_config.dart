/// REST API Config — configuration for the optional in-app REST API server.
library;

import 'package:equatable/equatable.dart';

/// Authentication mode for the REST API server.
enum RestApiAuthMode {
  /// No authentication — suitable for localhost-only access.
  none,

  /// Static API key passed in the `X-Api-Key` header.
  apiKey,

  /// Bearer token passed in `Authorization: Bearer <token>`.
  bearerToken,

  /// HTTP Basic authentication.
  basicAuth,
}

/// A single HTTP endpoint exposed by the REST API.
class RestApiRoute extends Equatable {
  const RestApiRoute({required this.path, required this.enabled});

  /// Relative path (e.g. '/api/alerts').
  final String path;

  final bool enabled;

  @override
  List<Object?> get props => [path, enabled];
}

/// Configuration for the optional in-app HTTP REST server.
///
/// When enabled, the app binds a lightweight HTTP server locally so that
/// power users can query `/api/alerts`, `/api/config`, and `/api/metrics`
/// from Grafana, scripts, or a local web dashboard.
class RestApiConfig extends Equatable {
  const RestApiConfig({
    required this.enabled,
    required this.port,
    required this.basePath,
    required this.authMode,
    required this.allowedOrigins,
    required this.routes,
    this.credentialKeyRef,
  }) : assert(port > 0 && port <= 65535, 'port must be in [1, 65535]');

  /// Sensible defaults: disabled, port 8080, /api base, no auth.
  factory RestApiConfig.defaults() => const RestApiConfig(
    enabled: false,
    port: 8080,
    basePath: '/api',
    authMode: RestApiAuthMode.none,
    allowedOrigins: ['http://localhost'],
    routes: [
      RestApiRoute(path: '/api/alerts', enabled: true),
      RestApiRoute(path: '/api/config', enabled: true),
      RestApiRoute(path: '/api/metrics', enabled: true),
    ],
  );

  final bool enabled;

  /// TCP port the HTTP server binds to.
  final int port;

  /// Base URL prefix for all routes (e.g. '/api').
  final String basePath;

  final RestApiAuthMode authMode;

  /// Allowed CORS origins (exact match).
  final List<String> allowedOrigins;

  final List<RestApiRoute> routes;

  /// Secure-storage key ref for the API key / password (null when no auth).
  final String? credentialKeyRef;

  /// Returns true when no credential is required to access this API.
  bool get isPublic => authMode == RestApiAuthMode.none;

  @override
  List<Object?> get props => [
    enabled,
    port,
    basePath,
    authMode,
    allowedOrigins,
    routes,
    credentialKeyRef,
  ];
}
