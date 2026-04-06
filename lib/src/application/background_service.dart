/// Background Service — Platform-specific background refresh mechanisms.
///
/// Android: WorkManager periodic task (min ~15 min interval).
///   - workmanager plugin handles scheduling, constraints (network, battery).
///   - Supported platforms: Android, iOS. Windows is NOT supported.
///
/// Windows: In-app Timer.periodic while the app is running.
///   - True OS-level background tasks are not available in the same way as Android.
///   - "Run in tray / Keep running" mode: app minimizes to system tray and
///     continues periodic refresh via Timer.periodic.
///   - Future enhancement: separate helper process or Windows Task Scheduler
///     entry (documented but not implemented in MVP).
///
/// Reference: https://pub.dev/packages/workmanager
library;

import 'dart:async';
import 'dart:io' show Platform;

import 'package:logger/logger.dart';
import 'package:workmanager/workmanager.dart';

import '../data/data.dart';
import 'notification_service.dart';
import 'refresh_service.dart';

const _workManagerTaskName = 'com.crosstide.refreshAll';
const _workManagerUniqueName = 'cross_tide_periodic_refresh';

/// Top-level callback for WorkManager (Android).
/// Must be a top-level or static function.
@pragma('vm:entry-point')
void workManagerCallbackDispatcher() {
  Workmanager().executeTask((taskName, inputData) async {
    final logger = Logger();
    logger.i('WorkManager task started: $taskName');

    try {
      // Create minimal dependencies for background execution.
      // In production, you'd use a service locator or pass config via inputData.
      final db = AppDatabase();
      final settings = await db.getSettings();
      final providerName = settings?.providerName ?? 'mock';
      final apiKey = inputData?['apiKey'] as String? ?? '';

      IMarketDataProvider provider;
      if (providerName == 'alpha_vantage' && apiKey.isNotEmpty) {
        provider = AlphaVantageProvider(apiKey: apiKey);
      } else {
        provider = MockMarketDataProvider();
      }

      final repository = StockRepository(db: db, provider: provider);
      final notificationService = LocalNotificationService();
      await notificationService.initialize();

      final refreshService = RefreshService(
        repository: repository,
        notificationService: notificationService,
      );

      await refreshService.refreshAll();
      await db.close();
      logger.i('WorkManager task completed');
      return true;
    } catch (e, st) {
      logger.e('WorkManager task failed', error: e, stackTrace: st);
      return false;
    }
  });
}

class BackgroundService {
  BackgroundService({Logger? logger}) : _logger = logger ?? Logger();

  final Logger _logger;
  Timer? _windowsTimer;

  /// Initialize background refresh for the current platform.
  Future<void> initialize({int refreshIntervalMinutes = 60}) async {
    if (Platform.isAndroid) {
      await _initAndroidWorkManager(refreshIntervalMinutes);
    } else if (Platform.isWindows) {
      _initWindowsTimer(refreshIntervalMinutes);
    }
  }

  /// Register periodic WorkManager task on Android.
  Future<void> _initAndroidWorkManager(int intervalMinutes) async {
    _logger.i(
      'Initializing Android WorkManager (interval: ${intervalMinutes}min)',
    );

    await Workmanager().initialize(workManagerCallbackDispatcher);

    await Workmanager().registerPeriodicTask(
      _workManagerUniqueName,
      _workManagerTaskName,
      frequency: Duration(minutes: intervalMinutes.clamp(15, 1440)),
      constraints: Constraints(
        networkType: NetworkType.connected,
        requiresBatteryNotLow: true,
      ),
      existingWorkPolicy: ExistingPeriodicWorkPolicy.replace,
    );

    _logger.i('Android WorkManager registered');
  }

  /// Start in-app periodic timer on Windows.
  /// This only works while the app is running (foreground or tray mode).
  void _initWindowsTimer(int intervalMinutes) {
    _logger.i(
      'Initializing Windows periodic timer (interval: ${intervalMinutes}min)',
    );
    _windowsTimer?.cancel();
    // Timer will be set by the caller who has access to RefreshService.
    // This method just logs the intent; actual timer setup is in startWindowsRefreshLoop.
  }

  /// Start the Windows refresh loop. Call this from the app's main widget
  /// after all services are initialized.
  void startWindowsRefreshLoop({
    required RefreshService refreshService,
    required int intervalMinutes,
  }) {
    _windowsTimer?.cancel();
    _windowsTimer = Timer.periodic(Duration(minutes: intervalMinutes), (
      _,
    ) async {
      _logger.d('Windows timer fired');
      try {
        await refreshService.refreshAll();
      } catch (e, st) {
        _logger.e('Windows timer refresh failed', error: e, stackTrace: st);
      }
    });
    _logger.i('Windows refresh loop started (every ${intervalMinutes}min)');
  }

  /// Stop background tasks.
  Future<void> stop() async {
    _windowsTimer?.cancel();
    _windowsTimer = null;

    if (Platform.isAndroid) {
      await Workmanager().cancelByUniqueName(_workManagerUniqueName);
      _logger.i('Android WorkManager cancelled');
    }
  }

  /// Update the refresh interval.
  Future<void> updateInterval(int minutes) async {
    await stop();
    await initialize(refreshIntervalMinutes: minutes);
  }
}
