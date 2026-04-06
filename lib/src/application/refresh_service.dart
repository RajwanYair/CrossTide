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
  final _goldenCrossDetector = const GoldenCrossDetector();
  final _alertStateMachine = const AlertStateMachine();

  /// Refresh all tickers: fetch data, evaluate alerts, fire notifications.
  /// This is the main entry point for background tasks.
  ///
  /// Returns a map of ticker → whether any alert was fired.
  Future<Map<String, bool>> refreshAll() async {
    final results = <String, bool>{};
    final settings = await repository.getSettings();
    final tickers = await repository.getAllTickers();

    _logger.i('Starting refresh for ${tickers.length} tickers');
    final stopwatch = Stopwatch()..start();

    for (final ticker in tickers) {
      try {
        final fired = await refreshTicker(
          ticker.symbol,
          settings: settings,
          enabledAlertTypes: ticker.enabledAlertTypes,
        );
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

  /// Refresh a single ticker.
  ///
  /// [enabledAlertTypes] controls which detectors run. Defaults to SMA200
  /// cross-up only (legacy behaviour).
  ///
  /// Returns true if at least one notification was fired.
  Future<bool> refreshTicker(
    String symbol, {
    AppSettings? settings,
    Set<AlertType> enabledAlertTypes = const {AlertType.sma200CrossUp},
  }) async {
    settings ??= await repository.getSettings();
    final upper = symbol.toUpperCase().trim();

    _logger.d('Refreshing $upper (alerts: $enabledAlertTypes)');

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

    // 2. Compute current SMA200 for display (always kept up-to-date)
    final currentSma = _smaCalculator.compute(candles, period: 200);
    await repository.updateTickerSma(upper, currentSma);

    // 3. Quiet-hour check (shared across all alert types)
    final now = DateTime.now();
    final inQuiet = _alertStateMachine.isInQuietHours(
      now: now,
      quietStart: settings.quietHoursStart,
      quietEnd: settings.quietHoursEnd,
    );

    var firedAny = false;

    // 4. SMA cross-up evaluations (SMA50 / SMA150 / SMA200)
    final crossUpPeriods = <SmaPeriod>[
      if (enabledAlertTypes.contains(AlertType.sma50CrossUp)) SmaPeriod.sma50,
      if (enabledAlertTypes.contains(AlertType.sma150CrossUp))
        SmaPeriod.sma150,
      if (enabledAlertTypes.contains(AlertType.sma200CrossUp))
        SmaPeriod.sma200,
    ];

    if (crossUpPeriods.isNotEmpty) {
      final previousState = await repository.getAlertState(upper);

      for (final period in crossUpPeriods) {
        final evaluation = _crossUpDetector.evaluate(
          ticker: upper,
          candles: candles,
          previousState: previousState,
          smaPeriod: period,
          trendStrictnessDays: settings.trendStrictnessDays,
        );

        if (evaluation == null) continue;

        // Update state machine (uses first applicable period for DB state)
        if (period == SmaPeriod.sma200) {
          final newState = _alertStateMachine.transition(
            previousState,
            evaluation,
          );
          await repository.saveAlertState(newState);
        }

        if (evaluation.shouldAlert) {
          if (inQuiet) {
            _logger.i('$upper: ${period.label} alert suppressed (quiet hours)');
            continue;
          }
          _logger.i(
            '$upper: ${period.label} CROSS-UP! '
            'Close=${evaluation.currentClose}, SMA=${evaluation.currentSma}',
          );
          await notificationService.showCrossUpAlert(
            ticker: upper,
            close: evaluation.currentClose,
            sma200: evaluation.currentSma,
          );
          firedAny = true;
        }
      }
    }

    // 5. Golden Cross / Death Cross evaluations
    final wantGolden = enabledAlertTypes.contains(AlertType.goldenCross);
    final wantDeath = enabledAlertTypes.contains(AlertType.deathCross);

    // 6. Price target check (independent of other alert types)
    if (enabledAlertTypes.contains(AlertType.priceTarget)) {
      await checkPriceTargets(upper, candles.last.close, settings: settings);
    }    if (wantGolden || wantDeath) {
      final crossEvents = _goldenCrossDetector.evaluateBoth(
        ticker: upper,
        candles: candles,
      );

      for (final event in crossEvents) {
        if (!event.isCrossEvent) continue;
        if (event.type == AlertType.goldenCross && !wantGolden) continue;
        if (event.type == AlertType.deathCross && !wantDeath) continue;

        if (inQuiet) {
          _logger.i(
            '$upper: ${event.type.displayName} suppressed (quiet hours)',
          );
          continue;
        }

        _logger.i(
          '$upper: ${event.type.displayName}! '
          'SMA50=${event.currentSma50.toStringAsFixed(2)}, '
          'SMA200=${event.currentSma200.toStringAsFixed(2)}',
        );
        await notificationService.showCrossUpAlert(
          ticker: upper,
          close: candles.last.close,
          sma200: event.currentSma200,
        );
        firedAny = true;
      }
    }

    if (!firedAny) {
      _logger.d('$upper: no alerts fired this cycle');
    }
    return firedAny;
  }

  /// Check pending price targets for [symbol] against [latestClose].
  /// Fires a notification for each target that has been reached.
  Future<void> checkPriceTargets(
    String symbol,
    double latestClose, {
    AppSettings? settings,
  }) async {
    settings ??= await repository.getSettings();
    final pending = await repository.getPriceTargets(symbol);
    final inQuiet = _alertStateMachine.isInQuietHours(
      now: DateTime.now(),
      quietStart: settings.quietHoursStart,
      quietEnd: settings.quietHoursEnd,
    );

    for (final target in pending) {
      if (target.hasFired) continue;
      if (latestClose >= target.targetPrice) {
        _logger.i(
          '$symbol: price target \$${target.targetPrice} hit '
          '(close=\$$latestClose)',
        );
        if (target.id != null) {
          await repository.markPriceTargetFired(target.id!);
        }
        if (!inQuiet) {
          await notificationService.showPriceTargetAlert(
            ticker: symbol,
            close: latestClose,
            target: target.targetPrice,
          );
        }
      }
    }
  }
}
