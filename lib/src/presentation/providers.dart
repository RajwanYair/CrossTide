/// Riverpod Providers — Dependency injection and state management.
///
/// Why Riverpod: Compile-time safety, no BuildContext dependency for providers,
/// excellent testability (override any provider), auto-dispose, and first-class
/// async support. Preferred over Bloc for this project's read-heavy, event-light
/// architecture.
library;

import 'dart:async' show StreamController, Timer;
import 'dart:io'
    show InternetAddress, InternetAddressType, Platform, SocketException;

import 'package:flutter/material.dart' show Color, ThemeMode;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:logger/logger.dart';

import '../application/application.dart';
import '../data/data.dart';
import '../data/database/database.dart' as db show WatchlistGroup;
import '../domain/alert_metrics_calculator.dart'
    as domain
    show AlertMetrics, AlertMetricsCalculator;
import '../domain/cross_up_anomaly_detector.dart'
    as domain
    show CrossUpAnomaly, CrossUpAnomalyDetector;
import '../domain/entities.dart' as domain;
import '../domain/signal_confidence_calculator.dart'
    as domain
    show SignalConfidenceCalculator;

// ---------------------------------------------------------------------------
// Core singletons
// ---------------------------------------------------------------------------

final loggerProvider = Provider<Logger>((ref) => Logger());

final databaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(db.close);
  return db;
});

final secureStorageProvider = Provider<FlutterSecureStorage>(
  (ref) => const FlutterSecureStorage(),
);

// ---------------------------------------------------------------------------
// API key management
// ---------------------------------------------------------------------------

final apiKeyProvider = FutureProvider<String?>((ref) async {
  final storage = ref.watch(secureStorageProvider);
  return storage.read(key: 'market_data_api_key');
});

// ---------------------------------------------------------------------------
// Market data provider
// ---------------------------------------------------------------------------

final marketDataProviderProvider = FutureProvider<IMarketDataProvider>((
  ref,
) async {
  final db = ref.watch(databaseProvider);
  final settings = await db.getSettings();
  final providerName = settings?.providerName ?? 'yahoo_finance';
  final logger = ref.read(loggerProvider);

  switch (providerName) {
    case 'yahoo_finance':
      return ThrottledMarketDataProvider(
        inner: FallbackMarketDataProvider(
          providers: [
            YahooFinanceProvider(logger: logger),
            MockMarketDataProvider(delayMs: 0),
          ],
          logger: logger,
        ),
      );
    case 'alpha_vantage':
      final storage = ref.watch(secureStorageProvider);
      final apiKey = await storage.read(key: 'market_data_api_key') ?? '';
      if (apiKey.isEmpty) {
        logger.w(
          'Alpha Vantage selected but no API key — falling back to Yahoo Finance',
        );
        return ThrottledMarketDataProvider(
          inner: FallbackMarketDataProvider(
            providers: [
              YahooFinanceProvider(logger: logger),
              MockMarketDataProvider(delayMs: 0),
            ],
            logger: logger,
          ),
        );
      }
      return ThrottledMarketDataProvider(
        inner: FallbackMarketDataProvider(
          providers: [
            AlphaVantageProvider(apiKey: apiKey, logger: logger),
            YahooFinanceProvider(logger: logger),
            MockMarketDataProvider(delayMs: 0),
          ],
          logger: logger,
        ),
      );
    case 'mock':
      return MockMarketDataProvider();
    default:
      return ThrottledMarketDataProvider(
        inner: FallbackMarketDataProvider(
          providers: [
            YahooFinanceProvider(logger: logger),
            MockMarketDataProvider(delayMs: 0),
          ],
          logger: logger,
        ),
      );
  }
});

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

final repositoryProvider = FutureProvider<StockRepository>((ref) async {
  final db = ref.watch(databaseProvider);
  final provider = await ref.watch(marketDataProviderProvider.future);
  return StockRepository(
    db: db,
    provider: provider,
    logger: ref.read(loggerProvider),
  );
});

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

final notificationServiceProvider = Provider<INotificationService>((ref) {
  return LocalNotificationService(logger: ref.read(loggerProvider));
});

final refreshServiceProvider = FutureProvider<RefreshService>((ref) async {
  final repo = await ref.watch(repositoryProvider.future);
  final webhook = await ref.watch(webhookServiceProvider.future);
  return RefreshService(
    repository: repo,
    notificationService: ref.read(notificationServiceProvider),
    logger: ref.read(loggerProvider),
    webhookService: webhook,
  );
});

final backgroundServiceProvider = Provider<BackgroundService>((ref) {
  return BackgroundService(logger: ref.read(loggerProvider));
});

final windowsTaskSchedulerProvider = Provider<WindowsTaskSchedulerService>((
  ref,
) {
  return WindowsTaskSchedulerService(logger: ref.read(loggerProvider));
});

// ---------------------------------------------------------------------------
// Ticker list state
// ---------------------------------------------------------------------------

final tickerListProvider = StreamProvider<List<Ticker>>((ref) {
  final db = ref.watch(databaseProvider);
  return db.watchAllTickers();
});

// ---------------------------------------------------------------------------
// Settings state
// ---------------------------------------------------------------------------

final settingsProvider = FutureProvider<domain.AppSettings>((ref) async {
  final repo = await ref.watch(repositoryProvider.future);
  return repo.getSettings();
});

// ---------------------------------------------------------------------------
// Ticker detail state
// ---------------------------------------------------------------------------

final tickerCandlesProvider =
    FutureProvider.family<List<domain.DailyCandle>, String>((
      ref,
      ticker,
    ) async {
      final repo = await ref.watch(repositoryProvider.future);
      return repo.fetchAndCacheCandles(ticker);
    });

final tickerAlertStateProvider =
    FutureProvider.family<domain.TickerAlertState, String>((ref, ticker) async {
      final repo = await ref.watch(repositoryProvider.future);
      return repo.getAlertState(ticker);
    });

/// Full domain TickerEntry for a specific symbol (includes nextEarningsAt).
final tickerEntryProvider = FutureProvider.family<domain.TickerEntry?, String>((
  ref,
  symbol,
) async {
  final repo = await ref.watch(repositoryProvider.future);
  final all = await repo.getAllTickers();
  return all.where((t) => t.symbol == symbol.toUpperCase()).firstOrNull;
});

/// Real-time intraday quote for a symbol.
///
/// Fetches once on first watch; call [ref.invalidate] to refresh.
/// Returns null when the provider is not Yahoo Finance or on error.
final intradayQuoteProvider =
    FutureProvider.family<domain.IntradayQuote?, String>((ref, symbol) async {
      final provider = await ref.watch(marketDataProviderProvider.future);
      // Walk through wrapper types to find the Yahoo provider.
      YahooFinanceProvider? yahoo;
      if (provider is YahooFinanceProvider) {
        yahoo = provider;
      } else if (provider is ThrottledMarketDataProvider &&
          provider.inner is FallbackMarketDataProvider) {
        final fallback = provider.inner as FallbackMarketDataProvider;
        for (final IMarketDataProvider p in fallback.providers) {
          if (p is YahooFinanceProvider) {
            yahoo = p;
            break;
          }
        }
      }
      return yahoo?.fetchQuote(symbol);
    });

/// Derives the accent seed [Color] from the persisted [AppSettings].
/// Falls back to the default deep-blue if settings aren't loaded yet.
final accentColorProvider = Provider<Color>((ref) {
  final settingsAsync = ref.watch(settingsProvider);
  final colorValue = switch (settingsAsync) {
    AsyncData(:final value) => value.accentColorValue,
    _ => 0xFF0D47A1,
  };
  return Color(colorValue);
});

/// S&P 500 benchmark candles (fetched on-demand when the overlay is toggled).
/// Uses the SPY ETF as a proxy — always available via Yahoo Finance.
final sp500CandlesProvider = FutureProvider<List<domain.DailyCandle>>((
  ref,
) async {
  final repo = await ref.watch(repositoryProvider.future);
  return repo.fetchAndCacheCandles('SPY');
});

/// Alert sensitivity stats for a single symbol.
///
/// Computes [AlertSensitivityStats] from all [AlertHistoryEntry] records for
/// [symbol] stored in the local database.
final alertSensitivityProvider =
    FutureProvider.family<domain.AlertSensitivityStats, String>((
      ref,
      symbol,
    ) async {
      final repo = await ref.watch(repositoryProvider.future);
      return repo.getAlertSensitivityStats(symbol);
    });

/// Multi-factor signal confidence score for a specific ticker.
final signalConfidenceProvider =
    FutureProvider.family<domain.SignalConfidenceScore, String>((
      ref,
      symbol,
    ) async {
      final repo = await ref.watch(repositoryProvider.future);
      final candles = await repo.fetchAndCacheCandles(symbol);
      return const domain.SignalConfidenceCalculator().compute(symbol, candles);
    });

/// [AuditLogService] singleton — records user settings changes.
final auditLogServiceProvider = Provider<AuditLogService>((ref) {
  final db = ref.watch(databaseProvider);
  final logger = ref.watch(loggerProvider);
  return AuditLogService(db: db, logger: logger);
});

/// Audit log entries (newest first, up to 200).
final auditLogProvider = FutureProvider<List<domain.AuditLogEntry>>((
  ref,
) async {
  final service = ref.watch(auditLogServiceProvider);
  return service.getLog();
});

/// Persists and exposes the user's [ThemeMode] preference.
///
/// Stored in secure storage under key `'theme_mode'`.
/// Values: `'light'` | `'dark'` | `'system'` (default).
final themeModeProvider = AsyncNotifierProvider<ThemeModeNotifier, ThemeMode>(
  ThemeModeNotifier.new,
);

class ThemeModeNotifier extends AsyncNotifier<ThemeMode> {
  static const _storageKey = 'theme_mode';

  @override
  Future<ThemeMode> build() async {
    final storage = ref.watch(secureStorageProvider);
    final raw = await storage.read(key: _storageKey);
    return _parse(raw);
  }

  Future<void> setMode(ThemeMode mode) async {
    final storage = ref.read(secureStorageProvider);
    await storage.write(key: _storageKey, value: _serialize(mode));
    state = AsyncData(mode);
  }

  static ThemeMode _parse(String? raw) => switch (raw) {
    'light' => ThemeMode.light,
    'dark' => ThemeMode.dark,
    _ => ThemeMode.system,
  };

  static String _serialize(ThemeMode mode) => switch (mode) {
    ThemeMode.light => 'light',
    ThemeMode.dark => 'dark',
    ThemeMode.system => 'system',
  };
}

/// Returns the set of enabled [AlertType]s for [ticker].
/// Kept separate from [tickerCandlesProvider] so the selector can invalidate
/// it independently.
final tickerEnabledAlertTypesProvider =
    FutureProvider.family<Set<domain.AlertType>, String>((ref, ticker) async {
      final repo = await ref.watch(repositoryProvider.future);
      final tickers = await repo.getAllTickers();
      final entry = tickers.firstWhere(
        (t) => t.symbol == ticker.toUpperCase(),
        orElse: () => domain.TickerEntry(symbol: ticker.toUpperCase()),
      );
      return entry.enabledAlertTypes;
    });

// ---------------------------------------------------------------------------
// Watchlist groups
// ---------------------------------------------------------------------------

/// Stream of all [WatchlistGroup]s ordered by sortOrder.
final watchlistGroupsProvider = StreamProvider<List<db.WatchlistGroup>>((
  ref,
) async* {
  final repo = await ref.watch(repositoryProvider.future);
  yield* repo.watchGroups();
});

/// Price targets for a specific symbol (live stream).
final priceTargetsProvider =
    StreamProvider.family<List<domain.PriceTarget>, String>((
      ref,
      symbol,
    ) async* {
      final repo = await ref.watch(repositoryProvider.future);
      yield* repo.watchPriceTargets(symbol);
    });

/// Percentage-move thresholds for a specific symbol (live stream).
final pctMoveThresholdsProvider =
    StreamProvider.family<List<domain.PctMoveThreshold>, String>((
      ref,
      symbol,
    ) async* {
      final repo = await ref.watch(repositoryProvider.future);
      yield* repo.watchPctMoveThresholds(symbol);
    });

/// Per-ticker research notes (live stream, newest-first).
final tickerNotesProvider =
    StreamProvider.family<List<domain.TickerNote>, String>((
      ref,
      symbol,
    ) async* {
      final db = ref.watch(databaseProvider);
      yield* db
          .watchNotes(symbol)
          .map(
            (List<TickerNotesTableData> rows) => rows
                .map(
                  (TickerNotesTableData r) => domain.TickerNote(
                    id: r.id,
                    symbol: r.symbol,
                    content: r.content,
                    createdAt: r.createdAt,
                    updatedAt: r.updatedAt,
                  ),
                )
                .toList(),
          );
    });

/// Active group filter. Null = show all tickers.
final activeGroupFilterProvider = NotifierProvider<ActiveGroupFilter, String?>(
  ActiveGroupFilter.new,
);

class ActiveGroupFilter extends Notifier<String?> {
  @override
  String? build() => null;

  void applyFilter(String? value) => state = value;
}

// ---------------------------------------------------------------------------
// Connectivity
// ---------------------------------------------------------------------------

/// Whether the device has an active Internet connection.
///
/// Works on both Android and Windows without any extra package by doing a DNS
/// lookup every 15 seconds.  Starts optimistically as `true`.
final connectivityProvider = StreamProvider<bool>((ref) {
  final controller = StreamController<bool>();

  Future<bool> checkConnectivity() async {
    try {
      final result =
          await InternetAddress.lookup(
            'query1.finance.yahoo.com',
            type: InternetAddressType.any,
          ).timeout(
            const Duration(seconds: 5),
            onTimeout: () => <InternetAddress>[],
          );
      return result.isNotEmpty && result.first.rawAddress.isNotEmpty;
    } on SocketException {
      return false;
    } catch (_) {
      return false;
    }
  }

  // Emit immediately, then re-check every 15 seconds.
  checkConnectivity().then(controller.add);
  final timer = Timer.periodic(const Duration(seconds: 15), (_) {
    checkConnectivity().then(controller.add);
  });

  ref.onDispose(() {
    timer.cancel();
    controller.close();
  });

  return controller.stream;
});

/// Alert history (all fired alerts, newest first).
final alertHistoryProvider = StreamProvider<List<domain.AlertHistoryEntry>>((
  ref,
) async* {
  final repo = await ref.watch(repositoryProvider.future);
  yield* repo.watchAlertHistory();
});

/// Cross-up anomalies derived from the alert history.
///
/// Runs the [CrossUpAnomalyDetector] over [alertHistoryProvider] every time
/// the history changes. A banner or badge in the alert history screen surfaces
/// the result.
final crossUpAnomaliesProvider = Provider<List<domain.CrossUpAnomaly>>((ref) {
  final historyAsync = ref.watch(alertHistoryProvider);
  return historyAsync.maybeWhen(
    data: (entries) {
      const detector = domain.CrossUpAnomalyDetector(
        windowHours: 24,
        minOccurrences: 2,
      );
      return detector.detect(entries);
    },
    orElse: () => [],
  );
});

// ---------------------------------------------------------------------------
// Refresh action
// ---------------------------------------------------------------------------

/// Per-ticker alert-frequency metrics derived from [alertHistoryProvider].
final alertMetricsProvider = Provider<List<domain.AlertMetrics>>((ref) {
  return ref
      .watch(alertHistoryProvider)
      .maybeWhen(
        data: (entries) =>
            const domain.AlertMetricsCalculator().compute(entries),
        orElse: () => [],
      );
});

final refreshAllProvider = FutureProvider<Map<String, bool>>((ref) async {
  final service = await ref.watch(refreshServiceProvider.future);
  return service.refreshAll();
});

// ---------------------------------------------------------------------------
// Has completed onboarding
// ---------------------------------------------------------------------------

final onboardingCompleteProvider = FutureProvider<bool>((ref) async {
  final storage = ref.watch(secureStorageProvider);
  final val = await storage.read(key: 'onboarding_complete');
  return val == 'true';
});

// ---------------------------------------------------------------------------
// Platform info
// ---------------------------------------------------------------------------

final isWindowsProvider = Provider<bool>((ref) => Platform.isWindows);
final isAndroidProvider = Provider<bool>((ref) => Platform.isAndroid);

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

/// Provides the [HealthCheckService]. Constructed lazily once the repository
/// is available; used in main.dart and the diagnostics screen.
final healthCheckServiceProvider = FutureProvider<HealthCheckService>((
  ref,
) async {
  final repo = await ref.watch(repositoryProvider.future);
  return HealthCheckService(repository: repo, logger: ref.read(loggerProvider));
});

/// One-shot [HealthReport] produced at app startup.
/// UI layers can watch this to surface warnings / errors in a non-blocking
/// status banner without blocking the main screen from loading.
final healthReportProvider = FutureProvider<HealthReport>((ref) async {
  final service = await ref.watch(healthCheckServiceProvider.future);
  return service.runAll();
});

/// [SnapshotService] — exports current app state to a JSON file in
/// the system temp directory.
final snapshotServiceProvider = FutureProvider<SnapshotService>((ref) async {
  final repo = await ref.watch(repositoryProvider.future);
  final logger = ref.watch(loggerProvider);
  return SnapshotService(repository: repo, logger: logger);
});

/// [WatchlistExportImportService] — exports/imports watchlist to/from JSON.
final watchlistExportImportServiceProvider =
    FutureProvider<WatchlistExportImportService>((ref) async {
      final repo = await ref.watch(repositoryProvider.future);
      final logger = ref.watch(loggerProvider);
      return WatchlistExportImportService(repository: repo, logger: logger);
    });

// ---------------------------------------------------------------------------
// Webhook service  (credentials stored in FlutterSecureStorage)
// ---------------------------------------------------------------------------

/// Keys used to persist webhook credentials in secure storage.
class WebhookKeys {
  static const telegramBotUrl = 'webhook_telegram_url';
  static const telegramChatId = 'webhook_telegram_chat_id';
  static const discordUrl = 'webhook_discord_url';
}

/// Provides a [WebhookService] pre-configured from secure storage.
///
/// Re-evaluated whenever the secure storage values change (via rebuild).
final webhookServiceProvider = FutureProvider<WebhookService>((ref) async {
  final storage = ref.read(secureStorageProvider);
  final logger = ref.read(loggerProvider);

  final telegramUrl = await storage.read(key: WebhookKeys.telegramBotUrl);
  final telegramChatId = await storage.read(key: WebhookKeys.telegramChatId);
  final discordUrl = await storage.read(key: WebhookKeys.discordUrl);

  final configs = <WebhookConfig>[
    if ((telegramUrl?.isNotEmpty ?? false) &&
        (telegramChatId?.isNotEmpty ?? false))
      WebhookConfig(
        type: WebhookType.telegram,
        url: telegramUrl!,
        telegramChatId: telegramChatId,
      ),
    if (discordUrl?.isNotEmpty ?? false)
      WebhookConfig(type: WebhookType.discord, url: discordUrl!),
  ];

  final svc = WebhookService(logger: logger);
  svc.configure(configs);
  return svc;
});
