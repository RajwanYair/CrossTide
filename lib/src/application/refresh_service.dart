/// Refresh Service — Application-layer orchestration.
///
/// Coordinates: fetch data → compute SMA → detect cross-up → update state → notify.
/// Used by both Android WorkManager callback and Windows periodic timer.
library;

import 'dart:async' show unawaited;

import 'package:logger/logger.dart';

import '../data/providers/yahoo_finance_provider.dart';
import '../data/repository.dart';
import '../domain/domain.dart';
import 'notification_service.dart';
import 'webhook_service.dart';

class RefreshService {
  RefreshService({
    required this.repository,
    required this.notificationService,
    Logger? logger,
    WebhookService? webhookService,
  }) : _logger = logger ?? Logger(),
       _webhook = webhookService;

  final StockRepository repository;
  final INotificationService notificationService;
  final Logger _logger;
  final WebhookService? _webhook;

  final _smaCalculator = const SmaCalculator();
  final _crossUpDetector = const CrossUpDetector();
  final _goldenCrossDetector = const GoldenCrossDetector();
  final _alertStateMachine = const AlertStateMachine();
  final _volumeCalculator = const VolumeCalculator();

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

  /// Append an entry to the persistent alert history log and fire webhooks.
  Future<void> _appendHistory({
    required String symbol,
    required String alertType,
    required String message,
  }) async {
    try {
      await repository.addAlertHistory(
        symbol: symbol,
        alertType: alertType,
        message: message,
      );
    } catch (e) {
      _logger.w('Failed to append alert history: $e');
    }
    // Fire-and-forget webhook delivery (failures are swallowed inside send())
    final webhookMsg = '📊 *CrossTide Alert* — $symbol\n$message';
    unawaited(_webhook?.send(webhookMsg));
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

    // 2b. Fetch next earnings date (non-critical; Yahoo Finance only).
    // Only refresh once per day to limit API calls.
    final existingEntry = (await repository.getAllTickers())
        .where((t) => t.symbol == upper)
        .firstOrNull;
    final earningsStale =
        existingEntry?.nextEarningsAt == null ||
        existingEntry!.nextEarningsAt!.isBefore(DateTime.now());
    if (earningsStale && repository.provider is YahooFinanceProvider) {
      final nextEarnings = await (repository.provider as YahooFinanceProvider)
          .fetchNextEarnings(upper);
      await repository.updateNextEarnings(upper, nextEarnings);
    }

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
      if (enabledAlertTypes.contains(AlertType.sma150CrossUp)) SmaPeriod.sma150,
      if (enabledAlertTypes.contains(AlertType.sma200CrossUp)) SmaPeriod.sma200,
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
          await _appendHistory(
            symbol: upper,
            alertType: switch (period) {
              SmaPeriod.sma50 => AlertType.sma50CrossUp.name,
              SmaPeriod.sma150 => AlertType.sma150CrossUp.name,
              SmaPeriod.sma200 => AlertType.sma200CrossUp.name,
            },
            message:
                '${period.label} cross-up: close \$${evaluation.currentClose.toStringAsFixed(2)} > SMA \$${evaluation.currentSma.toStringAsFixed(2)}',
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
    }

    // 7. Percentage-move check
    if (enabledAlertTypes.contains(AlertType.pctMove) && candles.length >= 2) {
      await checkPctMove(
        upper,
        candles.last.close,
        candles[candles.length - 2].close,
        settings: settings,
      );
    }

    // 8. Volume spike check
    if (enabledAlertTypes.contains(AlertType.volumeSpike)) {
      await checkVolumeSpike(upper, candles, settings: settings);
    }
    if (wantGolden || wantDeath) {
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

  /// Check if [candles] has a volume spike vs 20-day rolling average.
  Future<void> checkVolumeSpike(
    String symbol,
    List<DailyCandle> candles, {
    AppSettings? settings,
  }) async {
    settings ??= await repository.getSettings();
    final isSpike = _volumeCalculator.isSpike(
      candles,
      multiplier: settings.volumeSpikeMultiplier,
    );
    if (!isSpike) return;

    final ratio = _volumeCalculator.spikeRatio(candles) ?? 0.0;
    _logger.i(
      '$symbol: volume spike ${ratio.toStringAsFixed(1)}× avg '
      '(vol=${candles.last.volume})',
    );

    final inQuiet = _alertStateMachine.isInQuietHours(
      now: DateTime.now(),
      quietStart: settings.quietHoursStart,
      quietEnd: settings.quietHoursEnd,
    );
    if (!inQuiet) {
      final volStr = candles.last.volume >= 1000000
          ? '${(candles.last.volume / 1e6).toStringAsFixed(1)}M'
          : '${(candles.last.volume / 1000).toStringAsFixed(0)}K';
      final avgVol = (candles.last.volume / ratio).round();
      final avgStr = avgVol >= 1000000
          ? '${(avgVol / 1e6).toStringAsFixed(1)}M'
          : '${(avgVol / 1000).toStringAsFixed(0)}K';
      await notificationService.showVolumeSpikeAlert(
        ticker: symbol,
        volume: candles.last.volume.toDouble(),
        avgVolume: avgVol,
        ratio: ratio,
      );
      await _appendHistory(
        symbol: symbol,
        alertType: AlertType.volumeSpike.name,
        message:
            'Volume spike ${ratio.toStringAsFixed(1)}×: $volStr vs avg $avgStr',
      );
    }
  }

  /// Check pending percentage-move thresholds for [symbol].
  /// Fires a notification if |close/prevClose - 1| × 100 ≥ any threshold.
  Future<void> checkPctMove(
    String symbol,
    double latestClose,
    double prevClose, {
    AppSettings? settings,
  }) async {
    if (prevClose == 0) return;
    settings ??= await repository.getSettings();
    final thresholds = await repository.getPctMoveThresholds(symbol);
    if (thresholds.isEmpty) return;

    final pct = ((latestClose - prevClose) / prevClose) * 100;
    final inQuiet = _alertStateMachine.isInQuietHours(
      now: DateTime.now(),
      quietStart: settings.quietHoursStart,
      quietEnd: settings.quietHoursEnd,
    );

    for (final t in thresholds) {
      if (pct.abs() >= t.thresholdPct) {
        _logger.i(
          '$symbol: ${pct.toStringAsFixed(1)}% move ≥ threshold '
          '${t.thresholdPct}%',
        );
        if (!inQuiet) {
          final sign = pct >= 0 ? '▲' : '▼';
          await notificationService.showPctMoveAlert(
            ticker: symbol,
            close: latestClose,
            prevClose: prevClose,
            thresholdPct: t.thresholdPct,
          );
          await _appendHistory(
            symbol: symbol,
            alertType: AlertType.pctMove.name,
            message:
                '$sign${pct.abs().toStringAsFixed(1)}% move ≥ ${t.thresholdPct}% threshold; close \$${latestClose.toStringAsFixed(2)}',
          );
        }
        // Only fire once per cycle (loudest/first matching threshold)
        break;
      }
    }
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
          await _appendHistory(
            symbol: symbol,
            alertType: AlertType.priceTarget.name,
            message:
                'Price target \$${target.targetPrice.toStringAsFixed(2)} hit; close \$${latestClose.toStringAsFixed(2)}',
          );
        }
      }
    }
  }
}
