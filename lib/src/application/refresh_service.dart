/// Refresh Service — Application-layer orchestration.
///
/// Coordinates: fetch data → compute SMA → detect cross-up → update state → notify.
/// Used by both Android WorkManager callback and Windows periodic timer.
library;

import 'package:logger/logger.dart';

import '../data/repository.dart';
import '../domain/domain.dart';
import 'notification_service.dart';

class RefreshService {
  RefreshService({
    required this.repository,
    required this.notificationService,
    Logger? logger,
  }) : _logger = logger ?? Logger();

  final StockRepository repository;
  final INotificationService notificationService;
  final Logger _logger;

  final _smaCalculator = const SmaCalculator();
  final _crossUpDetector = const CrossUpDetector();
  final _alertStateMachine = const AlertStateMachine();

  /// Refresh all tickers: fetch data, evaluate cross-ups, fire alerts.
  /// This is the main entry point for background tasks.
  ///
  /// Returns a map of ticker → whether an alert was fired.
  Future<Map<String, bool>> refreshAll() async {
    final results = <String, bool>{};
    final settings = await repository.getSettings();
    final tickers = await repository.getAllTickers();

    _logger.i('Starting refresh for ${tickers.length} tickers');
    final stopwatch = Stopwatch()..start();

    for (final ticker in tickers) {
      try {
        final fired = await refreshTicker(ticker.symbol, settings: settings);
        results[ticker.symbol] = fired;
      } catch (e, st) {
        _logger.e(
          'Error refreshing ${ticker.symbol}',
          error: e,
          stackTrace: st,
        );
        results[ticker.symbol] = false;
      }

      // Stagger requests to respect rate limits (200ms between tickers)
      await Future<void>.delayed(const Duration(milliseconds: 200));
    }

    stopwatch.stop();
    _logger.i(
      'Refresh complete in ${stopwatch.elapsedMilliseconds}ms. '
      'Alerts fired: ${results.values.where((v) => v).length}/${results.length}',
    );

    return results;
  }

  /// Refresh a single ticker. Returns true if an alert was fired.
  Future<bool> refreshTicker(String symbol, {AppSettings? settings}) async {
    settings ??= await repository.getSettings();
    final upper = symbol.toUpperCase().trim();

    _logger.d('Refreshing $upper');

    // 1. Fetch candles (respects cache TTL)
    final candles = await repository.fetchAndCacheCandles(
      upper,
      cacheTtlMinutes: settings.cacheTtlMinutes,
    );

    if (candles.length < 201) {
      _logger.w(
        '$upper: insufficient data (${candles.length} candles, need 201+)',
      );
      return false;
    }

    // 2. Compute current SMA200 for display
    final currentSma = _smaCalculator.compute(candles, period: 200);
    await repository.updateTickerSma(upper, currentSma);

    // 3. Get previous alert state
    final previousState = await repository.getAlertState(upper);

    // 4. Evaluate cross-up (defaults to SMA200)
    final evaluation = _crossUpDetector.evaluate(
      ticker: upper,
      candles: candles,
      previousState: previousState,
      smaPeriod: SmaPeriod.sma200,
      trendStrictnessDays: settings.trendStrictnessDays,
    );

    if (evaluation == null) {
      _logger.w('$upper: evaluation returned null');
      return false;
    }

    // 5. Transition state machine
    final newState = _alertStateMachine.transition(previousState, evaluation);
    await repository.saveAlertState(newState);

    // 6. Fire notification if needed (respecting quiet hours)
    if (evaluation.shouldAlert) {
      final now = DateTime.now();
      final inQuiet = _alertStateMachine.isInQuietHours(
        now: now,
        quietStart: settings.quietHoursStart,
        quietEnd: settings.quietHoursEnd,
      );

      if (inQuiet) {
        _logger.i('$upper: alert suppressed (quiet hours)');
        return false;
      }

      _logger.i(
        '$upper: CROSS-UP ALERT! Close=${evaluation.currentClose}, '
        'SMA=${evaluation.currentSma} (${evaluation.smaPeriod.label})',
      );

      await notificationService.showCrossUpAlert(
        ticker: upper,
        close: evaluation.currentClose,
        sma200: evaluation.currentSma,
      );
      return true;
    }

    _logger.d(
      '$upper: no alert. Relation=${evaluation.currentRelation}, '
      'crossUp=${evaluation.isCrossUp}, rising=${evaluation.isRising}',
    );
    return false;
  }
}
