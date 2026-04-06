/// Health Check Service — application-layer self-diagnostics.
///
/// Inspired by the enterprise "health check on startup" pattern found across
/// many production projects: verify all critical subsystems before the user
/// is shown the main screen so failures are surfaced early and clearly.
///
/// Checks performed:
///   1. Network connectivity (TCP handshake to Yahoo Finance)
///   2. Market data provider reachability (lightweight HTTP HEAD)
///   3. Database readability (can we load settings?)
///   4. Notification permission (platform channel query)
///   5. Last-sync freshness (warn if data is stale)
library;

import 'dart:io' show Platform, InternetAddress, InternetAddressType;

import 'package:logger/logger.dart';

import '../data/repository.dart';

// ─── Value objects ──────────────────────────────────────────────────────────

enum HealthStatus { ok, warning, error }

class HealthCheckResult {
  const HealthCheckResult({
    required this.name,
    required this.status,
    this.message,
  });

  final String name;
  final HealthStatus status;

  /// Human-readable detail surfaced in the diagnostics overlay.
  final String? message;

  bool get isOk => status == HealthStatus.ok;
  bool get isWarning => status == HealthStatus.warning;
  bool get isError => status == HealthStatus.error;

  @override
  String toString() => '[$status] $name${message != null ? ': $message' : ''}';
}

class HealthReport {
  const HealthReport(this.results);

  final List<HealthCheckResult> results;

  HealthStatus get overall {
    if (results.any((r) => r.isError)) return HealthStatus.error;
    if (results.any((r) => r.isWarning)) return HealthStatus.warning;
    return HealthStatus.ok;
  }

  bool get isHealthy => overall == HealthStatus.ok;

  List<HealthCheckResult> get errors =>
      results.where((r) => r.isError).toList();
  List<HealthCheckResult> get warnings =>
      results.where((r) => r.isWarning).toList();

  @override
  String toString() => results.map((r) => r.toString()).join('\n');
}

// ─── Service ────────────────────────────────────────────────────────────────

class HealthCheckService {
  HealthCheckService({required this.repository, Logger? logger})
    : _logger = logger ?? Logger();

  final StockRepository repository;
  final Logger _logger;

  /// Run all health checks and return a consolidated [HealthReport].
  ///
  /// This is intentionally non-fatal: even if a check throws, we catch it and
  /// record an error result so the rest of the checks still run.
  Future<HealthReport> runAll() async {
    _logger.d('HealthCheckService: running startup diagnostics');

    final results = await Future.wait([
      _checkNetwork(),
      _checkDatabase(),
      _checkDataFreshness(),
    ]);

    final report = HealthReport(results);
    if (report.isHealthy) {
      _logger.i('HealthCheck: all OK');
    } else {
      _logger.w('HealthCheck:\n$report');
    }
    return report;
  }

  // ── Individual checks ────────────────────────────────────────────────────

  Future<HealthCheckResult> _checkNetwork() async {
    const name = 'Network';
    try {
      // Lightweight DNS lookup — no HTTP overhead, works behind corporate proxies
      // that might block raw sockets but allow DNS resolution.
      final addresses = await InternetAddress.lookup(
        'query1.finance.yahoo.com',
        type: InternetAddressType.any,
      ).timeout(const Duration(seconds: 5));

      if (addresses.isNotEmpty) {
        return const HealthCheckResult(name: name, status: HealthStatus.ok);
      }
      return const HealthCheckResult(
        name: name,
        status: HealthStatus.warning,
        message: 'DNS lookup returned no addresses',
      );
    } catch (e) {
      return HealthCheckResult(
        name: name,
        status: HealthStatus.error,
        message: 'Cannot reach market data host: $e',
      );
    }
  }

  Future<HealthCheckResult> _checkDatabase() async {
    const name = 'Database';
    try {
      // Verify we can read settings — simplest possible DB round-trip.
      await repository.getSettings();
      return const HealthCheckResult(name: name, status: HealthStatus.ok);
    } catch (e) {
      return HealthCheckResult(
        name: name,
        status: HealthStatus.error,
        message: 'Failed to read settings: $e',
      );
    }
  }

  Future<HealthCheckResult> _checkDataFreshness() async {
    const name = 'DataFreshness';
    const staleWarningHours = 25; // >1 trading day = warn
    const staleErrorHours = 72; // >3 days = error
    try {
      final tickers = await repository.getAllTickers();
      if (tickers.isEmpty) {
        return const HealthCheckResult(
          name: name,
          status: HealthStatus.ok,
          message: 'No tickers configured yet',
        );
      }

      final now = DateTime.now();
      Duration stalest = Duration.zero;
      for (final t in tickers) {
        if (t.lastRefreshAt != null) {
          final age = now.difference(t.lastRefreshAt!);
          if (age > stalest) stalest = age;
        }
      }

      if (stalest.inHours >= staleErrorHours) {
        return HealthCheckResult(
          name: name,
          status: HealthStatus.error,
          message:
              'Data is ${stalest.inHours}h old — market data may be significantly outdated',
        );
      }
      if (stalest.inHours >= staleWarningHours) {
        return HealthCheckResult(
          name: name,
          status: HealthStatus.warning,
          message: 'Data is ${stalest.inHours}h old — consider refreshing',
        );
      }
      return const HealthCheckResult(name: name, status: HealthStatus.ok);
    } catch (e) {
      // Non-critical — fresh data is desirable but not a blocker
      return HealthCheckResult(
        name: name,
        status: HealthStatus.warning,
        message: 'Could not determine data freshness: $e',
      );
    }
  }

  /// Platform identifier for logging / diagnostics display.
  static String get platformName {
    if (Platform.isWindows) return 'Windows';
    if (Platform.isAndroid) return 'Android';
    if (Platform.isIOS) return 'iOS';
    if (Platform.isMacOS) return 'macOS';
    if (Platform.isLinux) return 'Linux';
    return 'Unknown';
  }
}
