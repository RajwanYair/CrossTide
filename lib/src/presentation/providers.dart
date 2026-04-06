/// Riverpod Providers — Dependency injection and state management.
///
/// Why Riverpod: Compile-time safety, no BuildContext dependency for providers,
/// excellent testability (override any provider), auto-dispose, and first-class
/// async support. Preferred over Bloc for this project's read-heavy, event-light
/// architecture.
library;

import 'dart:io' show Platform;

import 'package:flutter/material.dart' show ThemeMode;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:logger/logger.dart';

import '../application/application.dart';
import '../data/data.dart';
import '../data/database/database.dart' as db show WatchlistGroup;
import '../domain/entities.dart' as domain;

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
      return YahooFinanceProvider(logger: logger);
    case 'alpha_vantage':
      final storage = ref.watch(secureStorageProvider);
      final apiKey = await storage.read(key: 'market_data_api_key') ?? '';
      if (apiKey.isEmpty) {
        logger.w(
          'Alpha Vantage selected but no API key — falling back to Yahoo Finance',
        );
        return YahooFinanceProvider(logger: logger);
      }
      return AlphaVantageProvider(apiKey: apiKey, logger: logger);
    case 'mock':
      return MockMarketDataProvider();
    default:
      return YahooFinanceProvider(logger: logger);
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
  return RefreshService(
    repository: repo,
    notificationService: ref.read(notificationServiceProvider),
    logger: ref.read(loggerProvider),
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

/// S&P 500 benchmark candles (fetched on-demand when the overlay is toggled).
/// Uses the SPY ETF as a proxy — always available via Yahoo Finance.
final sp500CandlesProvider = FutureProvider<List<domain.DailyCandle>>((
  ref,
) async {
  final repo = await ref.watch(repositoryProvider.future);
  return repo.fetchAndCacheCandles('SPY');
});

/// Persists and exposes the user's [ThemeMode] preference.
///
/// Stored in secure storage under key `'theme_mode'`.
/// Values: `'light'` | `'dark'` | `'system'` (default).
final themeModeProvider =
    AsyncNotifierProvider<ThemeModeNotifier, ThemeMode>(
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
    FutureProvider.family<Set<domain.AlertType>, String>((
      ref,
      ticker,
    ) async {
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

/// Active group filter. Null = show all tickers.
final activeGroupFilterProvider = StateProvider<String?>((ref) => null);

// ---------------------------------------------------------------------------
// Refresh action
// ---------------------------------------------------------------------------

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
