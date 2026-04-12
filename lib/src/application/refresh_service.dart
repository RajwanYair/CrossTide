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
  final _michoDetector = const MichoMethodDetector();
  final _rsiMethodDetector = const RsiMethodDetector();
  final _macdMethodDetector = const MacdMethodDetector();
  final _bollingerMethodDetector = const BollingerMethodDetector();
  final _stochasticMethodDetector = const StochasticMethodDetector();
  final _obvMethodDetector = const ObvMethodDetector();
  final _adxMethodDetector = const AdxMethodDetector();
  final _cciMethodDetector = const CciMethodDetector();
  final _sarMethodDetector = const SarMethodDetector();
  final _williamsRMethodDetector = const WilliamsRMethodDetector();
  final _mfiMethodDetector = const MfiMethodDetector();
  final _supertrendMethodDetector = const SupertrendMethodDetector();
  final _consensusEngine = const ConsensusEngine();
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

    // 2. Compute current SMA200 and SMA150 for display (always kept up-to-date)
    final currentSma = _smaCalculator.compute(candles, period: 200);
    await repository.updateTickerSma(upper, currentSma);
    final currentSma150 = _smaCalculator.compute(candles, period: 150);
    await repository.updateTickerSma150(upper, currentSma150);

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

    // 2c. Fetch company profile (non-critical; Yahoo Finance only).
    // Only fetched once — when companyName is still null (lazy enrichment).
    if (existingEntry?.companyName == null &&
        repository.provider is YahooFinanceProvider) {
      final profile = await (repository.provider as YahooFinanceProvider)
          .fetchCompanyProfile(upper);
      if (profile != null) {
        final membership = _computeIndexMembership(upper);
        await repository.updateTickerProfile(
          upper,
          companyName: profile.longName,
          description: profile.description,
          industry: profile.industry,
          indexMembership: membership.isEmpty ? null : membership,
        );
      }
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

    // 9. Micho Method BUY / SELL evaluations
    final wantMichoBuy = enabledAlertTypes.contains(AlertType.michoMethodBuy);
    final wantMichoSell = enabledAlertTypes.contains(AlertType.michoMethodSell);
    if (wantMichoBuy || wantMichoSell) {
      // Load state once for idempotency checks
      final michoState = await repository.getAlertState(upper);
      var updatedMichoState = michoState;

      final signals = _michoDetector.evaluateBoth(
        ticker: upper,
        candles: candles,
      );

      // The candle date for the most recent bar (used as idempotency key)
      final candleDate = candles.isNotEmpty
          ? DateTime(
              candles.last.date.year,
              candles.last.date.month,
              candles.last.date.day,
            )
          : null;

      for (final signal in signals) {
        if (signal.alertType == AlertType.michoMethodBuy && !wantMichoBuy) {
          continue;
        }
        if (signal.alertType == AlertType.michoMethodSell && !wantMichoSell) {
          continue;
        }

        // Idempotency: skip if we already fired this alert for the same candle.
        if (candleDate != null) {
          final lastFired = signal.alertType == AlertType.michoMethodBuy
              ? updatedMichoState.lastMichoBuyAt
              : updatedMichoState.lastMichoSellAt;
          if (lastFired != null) {
            final lastFiredDay = DateTime(
              lastFired.year,
              lastFired.month,
              lastFired.day,
            );
            if (!lastFiredDay.isBefore(candleDate)) {
              _logger.d(
                '$upper: ${signal.alertType.displayName} already fired '
                'for candle $candleDate — suppressed',
              );
              continue;
            }
          }
        }

        if (inQuiet) {
          _logger.i(
            '$upper: ${signal.alertType.displayName} suppressed (quiet hours)',
          );
          continue;
        }
        _logger.i('$upper: ${signal.description}');
        if (signal.alertType == AlertType.michoMethodBuy) {
          await notificationService.showMichoBuyAlert(
            ticker: upper,
            close: signal.currentClose!,
            sma150: signal.currentSma!,
          );
          updatedMichoState = updatedMichoState.copyWith(
            lastMichoBuyAt: candleDate ?? DateTime.now(),
          );
        } else {
          await notificationService.showMichoSellAlert(
            ticker: upper,
            close: signal.currentClose!,
            sma150: signal.currentSma!,
          );
          updatedMichoState = updatedMichoState.copyWith(
            lastMichoSellAt: candleDate ?? DateTime.now(),
          );
        }
        await repository.saveAlertState(updatedMichoState);
        await _appendHistory(
          symbol: upper,
          alertType: signal.alertType.name,
          message: signal.description!,
        );
        firedAny = true;
      }
    }

    // 10. RSI / MACD / Bollinger method evaluations + Consensus Engine
    final allMethodSignals = <MethodSignal>[];

    // Collect Micho signals (already evaluated above) for consensus
    if (wantMichoBuy || wantMichoSell) {
      allMethodSignals.addAll(
        _michoDetector.evaluateBoth(ticker: upper, candles: candles),
      );
    }

    // RSI Method
    final wantRsiBuy = enabledAlertTypes.contains(AlertType.rsiMethodBuy);
    final wantRsiSell = enabledAlertTypes.contains(AlertType.rsiMethodSell);
    if (wantRsiBuy || wantRsiSell) {
      final rsiSignals = _rsiMethodDetector.evaluateBoth(
        ticker: upper,
        candles: candles,
      );
      allMethodSignals.addAll(rsiSignals);
      for (final MethodSignal signal in rsiSignals) {
        if (signal.alertType == AlertType.rsiMethodBuy && !wantRsiBuy) {
          continue;
        }
        if (signal.alertType == AlertType.rsiMethodSell && !wantRsiSell) {
          continue;
        }
        if (inQuiet) {
          _logger.i(
            '$upper: ${signal.alertType.displayName} suppressed (quiet hours)',
          );
          continue;
        }
        _logger.i('$upper: ${signal.description}');
        await _appendHistory(
          symbol: upper,
          alertType: signal.alertType.name,
          message: signal.description!,
        );
        firedAny = true;
      }
    }

    // MACD Method
    final wantMacdBuy = enabledAlertTypes.contains(AlertType.macdMethodBuy);
    final wantMacdSell = enabledAlertTypes.contains(AlertType.macdMethodSell);
    if (wantMacdBuy || wantMacdSell) {
      final macdSignals = _macdMethodDetector.evaluateBoth(
        ticker: upper,
        candles: candles,
      );
      allMethodSignals.addAll(macdSignals);
      for (final MethodSignal signal in macdSignals) {
        if (signal.alertType == AlertType.macdMethodBuy && !wantMacdBuy) {
          continue;
        }
        if (signal.alertType == AlertType.macdMethodSell && !wantMacdSell) {
          continue;
        }
        if (inQuiet) {
          _logger.i(
            '$upper: ${signal.alertType.displayName} suppressed (quiet hours)',
          );
          continue;
        }
        _logger.i('$upper: ${signal.description}');
        await _appendHistory(
          symbol: upper,
          alertType: signal.alertType.name,
          message: signal.description!,
        );
        firedAny = true;
      }
    }

    // Bollinger Method
    final wantBollBuy = enabledAlertTypes.contains(
      AlertType.bollingerMethodBuy,
    );
    final wantBollSell = enabledAlertTypes.contains(
      AlertType.bollingerMethodSell,
    );
    if (wantBollBuy || wantBollSell) {
      final bollSignals = _bollingerMethodDetector.evaluateBoth(
        ticker: upper,
        candles: candles,
      );
      allMethodSignals.addAll(bollSignals);
      for (final MethodSignal signal in bollSignals) {
        if (signal.alertType == AlertType.bollingerMethodBuy && !wantBollBuy) {
          continue;
        }
        if (signal.alertType == AlertType.bollingerMethodSell &&
            !wantBollSell) {
          continue;
        }
        if (inQuiet) {
          _logger.i(
            '$upper: ${signal.alertType.displayName} suppressed (quiet hours)',
          );
          continue;
        }
        _logger.i('$upper: ${signal.description}');
        await _appendHistory(
          symbol: upper,
          alertType: signal.alertType.name,
          message: signal.description!,
        );
        firedAny = true;
      }
    }

    // Stochastic Method
    final wantStochBuy = enabledAlertTypes.contains(
      AlertType.stochasticMethodBuy,
    );
    final wantStochSell = enabledAlertTypes.contains(
      AlertType.stochasticMethodSell,
    );
    if (wantStochBuy || wantStochSell) {
      final stochSignals = _stochasticMethodDetector.evaluateBoth(
        ticker: upper,
        candles: candles,
      );
      allMethodSignals.addAll(stochSignals);
      for (final MethodSignal signal in stochSignals) {
        if (signal.alertType == AlertType.stochasticMethodBuy &&
            !wantStochBuy) {
          continue;
        }
        if (signal.alertType == AlertType.stochasticMethodSell &&
            !wantStochSell) {
          continue;
        }
        if (inQuiet) {
          _logger.i(
            '$upper: ${signal.alertType.displayName} suppressed (quiet hours)',
          );
          continue;
        }
        _logger.i('$upper: ${signal.description}');
        await _appendHistory(
          symbol: upper,
          alertType: signal.alertType.name,
          message: signal.description!,
        );
        firedAny = true;
      }
    }

    // OBV Divergence Method
    final wantObvBuy = enabledAlertTypes.contains(AlertType.obvMethodBuy);
    final wantObvSell = enabledAlertTypes.contains(AlertType.obvMethodSell);
    if (wantObvBuy || wantObvSell) {
      final obvSignals = _obvMethodDetector.evaluateBoth(
        ticker: upper,
        candles: candles,
      );
      allMethodSignals.addAll(obvSignals);
      for (final MethodSignal signal in obvSignals) {
        if (signal.alertType == AlertType.obvMethodBuy && !wantObvBuy) {
          continue;
        }
        if (signal.alertType == AlertType.obvMethodSell && !wantObvSell) {
          continue;
        }
        if (inQuiet) {
          _logger.i(
            '$upper: ${signal.alertType.displayName} suppressed (quiet hours)',
          );
          continue;
        }
        _logger.i('$upper: ${signal.description}');
        await _appendHistory(
          symbol: upper,
          alertType: signal.alertType.name,
          message: signal.description!,
        );
        firedAny = true;
      }
    }

    // ADX Trend Method
    final wantAdxBuy = enabledAlertTypes.contains(AlertType.adxMethodBuy);
    final wantAdxSell = enabledAlertTypes.contains(AlertType.adxMethodSell);
    if (wantAdxBuy || wantAdxSell) {
      final adxSignals = _adxMethodDetector.evaluateBoth(
        ticker: upper,
        candles: candles,
      );
      allMethodSignals.addAll(adxSignals);
      for (final MethodSignal signal in adxSignals) {
        if (signal.alertType == AlertType.adxMethodBuy && !wantAdxBuy) {
          continue;
        }
        if (signal.alertType == AlertType.adxMethodSell && !wantAdxSell) {
          continue;
        }
        if (inQuiet) {
          _logger.i(
            '$upper: ${signal.alertType.displayName} suppressed (quiet hours)',
          );
          continue;
        }
        _logger.i('$upper: ${signal.description}');
        await _appendHistory(
          symbol: upper,
          alertType: signal.alertType.name,
          message: signal.description!,
        );
        firedAny = true;
      }
    }

    // CCI Method
    final wantCciBuy = enabledAlertTypes.contains(AlertType.cciMethodBuy);
    final wantCciSell = enabledAlertTypes.contains(AlertType.cciMethodSell);
    if (wantCciBuy || wantCciSell) {
      final cciSignals = _cciMethodDetector.evaluateBoth(
        ticker: upper,
        candles: candles,
      );
      allMethodSignals.addAll(cciSignals);
      for (final MethodSignal signal in cciSignals) {
        if (signal.alertType == AlertType.cciMethodBuy && !wantCciBuy) {
          continue;
        }
        if (signal.alertType == AlertType.cciMethodSell && !wantCciSell) {
          continue;
        }
        if (inQuiet) {
          _logger.i(
            '$upper: ${signal.alertType.displayName} suppressed (quiet hours)',
          );
          continue;
        }
        _logger.i('$upper: ${signal.description}');
        await _appendHistory(
          symbol: upper,
          alertType: signal.alertType.name,
          message: signal.description!,
        );
        firedAny = true;
      }
    }

    // Parabolic SAR Method
    final wantSarBuy = enabledAlertTypes.contains(AlertType.sarMethodBuy);
    final wantSarSell = enabledAlertTypes.contains(AlertType.sarMethodSell);
    if (wantSarBuy || wantSarSell) {
      final sarSignals = _sarMethodDetector.evaluateBoth(
        ticker: upper,
        candles: candles,
      );
      allMethodSignals.addAll(sarSignals);
      for (final MethodSignal signal in sarSignals) {
        if (signal.alertType == AlertType.sarMethodBuy && !wantSarBuy) {
          continue;
        }
        if (signal.alertType == AlertType.sarMethodSell && !wantSarSell) {
          continue;
        }
        if (inQuiet) {
          _logger.i(
            '$upper: ${signal.alertType.displayName} suppressed (quiet hours)',
          );
          continue;
        }
        _logger.i('$upper: ${signal.description}');
        await _appendHistory(
          symbol: upper,
          alertType: signal.alertType.name,
          message: signal.description!,
        );
        firedAny = true;
      }
    }

    // Williams %R Method
    final wantWrBuy = enabledAlertTypes.contains(AlertType.williamsRMethodBuy);
    final wantWrSell = enabledAlertTypes.contains(
      AlertType.williamsRMethodSell,
    );
    if (wantWrBuy || wantWrSell) {
      final wrSignals = _williamsRMethodDetector.evaluateBoth(
        ticker: upper,
        candles: candles,
      );
      allMethodSignals.addAll(wrSignals);
      for (final MethodSignal signal in wrSignals) {
        if (signal.alertType == AlertType.williamsRMethodBuy && !wantWrBuy) {
          continue;
        }
        if (signal.alertType == AlertType.williamsRMethodSell && !wantWrSell) {
          continue;
        }
        if (inQuiet) {
          _logger.i(
            '$upper: ${signal.alertType.displayName} suppressed (quiet hours)',
          );
          continue;
        }
        _logger.i('$upper: ${signal.description}');
        await _appendHistory(
          symbol: upper,
          alertType: signal.alertType.name,
          message: signal.description!,
        );
        firedAny = true;
      }
    }

    // MFI Method
    final wantMfiBuy = enabledAlertTypes.contains(AlertType.mfiMethodBuy);
    final wantMfiSell = enabledAlertTypes.contains(AlertType.mfiMethodSell);
    if (wantMfiBuy || wantMfiSell) {
      final mfiSignals = _mfiMethodDetector.evaluateBoth(
        ticker: upper,
        candles: candles,
      );
      allMethodSignals.addAll(mfiSignals);
      for (final MethodSignal signal in mfiSignals) {
        if (signal.alertType == AlertType.mfiMethodBuy && !wantMfiBuy) {
          continue;
        }
        if (signal.alertType == AlertType.mfiMethodSell && !wantMfiSell) {
          continue;
        }
        if (inQuiet) {
          _logger.i(
            '$upper: ${signal.alertType.displayName} suppressed (quiet hours)',
          );
          continue;
        }
        _logger.i('$upper: ${signal.description}');
        await _appendHistory(
          symbol: upper,
          alertType: signal.alertType.name,
          message: signal.description!,
        );
        firedAny = true;
      }
    }

    // SuperTrend Method
    final wantStBuy = enabledAlertTypes.contains(AlertType.supertrendMethodBuy);
    final wantStSell = enabledAlertTypes.contains(
      AlertType.supertrendMethodSell,
    );
    if (wantStBuy || wantStSell) {
      final stSignals = _supertrendMethodDetector.evaluateBoth(
        ticker: upper,
        candles: candles,
      );
      allMethodSignals.addAll(stSignals);
      for (final MethodSignal signal in stSignals) {
        if (signal.alertType == AlertType.supertrendMethodBuy && !wantStBuy) {
          continue;
        }
        if (signal.alertType == AlertType.supertrendMethodSell && !wantStSell) {
          continue;
        }
        if (inQuiet) {
          _logger.i(
            '$upper: ${signal.alertType.displayName} suppressed (quiet hours)',
          );
          continue;
        }
        _logger.i('$upper: ${signal.description}');
        await _appendHistory(
          symbol: upper,
          alertType: signal.alertType.name,
          message: signal.description!,
        );
        firedAny = true;
      }
    }

    // Consensus Engine: combine all method signals
    final wantConsensusBuy = enabledAlertTypes.contains(AlertType.consensusBuy);
    final wantConsensusSell = enabledAlertTypes.contains(
      AlertType.consensusSell,
    );
    if (wantConsensusBuy || wantConsensusSell) {
      final consensus = _consensusEngine.evaluate(
        ticker: upper,
        signals: allMethodSignals,
      );

      // Load state for consensus idempotency
      final consensusState = await repository.getAlertState(upper);
      var updatedConsensusState = consensusState;
      final consensusCandleDate = candles.isNotEmpty
          ? DateTime(
              candles.last.date.year,
              candles.last.date.month,
              candles.last.date.day,
            )
          : null;

      if (consensus.buySignal != null && wantConsensusBuy && !inQuiet) {
        // Idempotency check for consensus BUY
        final lastFired = updatedConsensusState.lastConsensusBuyAt;
        final alreadyFired =
            lastFired != null &&
            consensusCandleDate != null &&
            !DateTime(
              lastFired.year,
              lastFired.month,
              lastFired.day,
            ).isBefore(consensusCandleDate);

        if (!alreadyFired) {
          _logger.i('$upper: ${consensus.buySignal!.description}');
          await notificationService.showConsensusBuyAlert(
            ticker: upper,
            close: consensus.buySignal!.currentClose!,
            description: consensus.buySignal!.description!,
          );
          updatedConsensusState = updatedConsensusState.copyWith(
            lastConsensusBuyAt: consensusCandleDate ?? DateTime.now(),
          );
          await repository.saveAlertState(updatedConsensusState);
          await _appendHistory(
            symbol: upper,
            alertType: AlertType.consensusBuy.name,
            message: consensus.buySignal!.description!,
          );
          firedAny = true;
        }
      }
      if (consensus.sellSignal != null && wantConsensusSell && !inQuiet) {
        // Idempotency check for consensus SELL
        final lastFired = updatedConsensusState.lastConsensusSellAt;
        final alreadyFired =
            lastFired != null &&
            consensusCandleDate != null &&
            !DateTime(
              lastFired.year,
              lastFired.month,
              lastFired.day,
            ).isBefore(consensusCandleDate);

        if (!alreadyFired) {
          _logger.i('$upper: ${consensus.sellSignal!.description}');
          await notificationService.showConsensusSellAlert(
            ticker: upper,
            close: consensus.sellSignal!.currentClose!,
            description: consensus.sellSignal!.description!,
          );
          updatedConsensusState = updatedConsensusState.copyWith(
            lastConsensusSellAt: consensusCandleDate ?? DateTime.now(),
          );
          await repository.saveAlertState(updatedConsensusState);
          await _appendHistory(
            symbol: upper,
            alertType: AlertType.consensusSell.name,
            message: consensus.sellSignal!.description!,
          );
          firedAny = true;
        }
      }
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

  /// Returns a comma-separated string of major index memberships for [symbol].
  ///
  /// Checks S&P 500 (via known list), NASDAQ-100, and Dow Jones 30.
  /// The index lists are embedded here to avoid file I/O in tests.
  String _computeIndexMembership(String symbol) {
    final up = symbol.toUpperCase();
    final tags = <String>[];
    if (_sp500.contains(up)) tags.add('S&P 500');
    if (_nasdaq100.contains(up)) tags.add('NASDAQ-100');
    if (_dow30.contains(up)) tags.add('Dow Jones');
    return tags.join(', ');
  }

  // ---- Index constituent lists (as of mid-2025) ----

  static const Set<String> _sp500 = {
    'A',
    'AAL',
    'AAPL',
    'ABBV',
    'ABNB',
    'ABT',
    'ACGL',
    'ACI',
    'ACN',
    'ADBE',
    'ADI',
    'ADM',
    'ADP',
    'ADSK',
    'AEE',
    'AEP',
    'AES',
    'AFL',
    'AIG',
    'AIZ',
    'AJG',
    'AKAM',
    'ALB',
    'ALGN',
    'ALL',
    'ALLE',
    'AMAT',
    'AMCR',
    'AMD',
    'AME',
    'AMGN',
    'AMP',
    'AMT',
    'AMZN',
    'ANET',
    'ANF',
    'AON',
    'AOS',
    'APA',
    'APD',
    'APH',
    'APTV',
    'ARE',
    'ATO',
    'AVB',
    'AVGO',
    'AVY',
    'AWK',
    'AXON',
    'AXP',
    'AZO',
    'BA',
    'BAC',
    'BALL',
    'BAX',
    'BBY',
    'BDX',
    'BEN',
    'BF.B',
    'BG',
    'BIIB',
    'BK',
    'BKNG',
    'BKR',
    'BLK',
    'BMY',
    'BR',
    'BRK.B',
    'BRO',
    'BSX',
    'BWA',
    'BX',
    'BXP',
    'C',
    'CAG',
    'CAH',
    'CARR',
    'CAT',
    'CB',
    'CBOE',
    'CBRE',
    'CCI',
    'CCL',
    'CDNS',
    'CDW',
    'CE',
    'CF',
    'CFG',
    'CHD',
    'CHRW',
    'CHTR',
    'CI',
    'CINF',
    'CL',
    'CLX',
    'CMCSA',
    'CME',
    'CMG',
    'CMI',
    'CMS',
    'CNC',
    'CNP',
    'COF',
    'COO',
    'COP',
    'COR',
    'COST',
    'CPAY',
    'CPB',
    'CPRT',
    'CPT',
    'CRL',
    'CRM',
    'CRWD',
    'CSCO',
    'CSGP',
    'CSX',
    'CTAS',
    'CTLT',
    'CTRA',
    'CTSH',
    'CTVA',
    'CVS',
    'CVX',
    'CZR',
    'D',
    'DAL',
    'DDOG',
    'DE',
    'DECK',
    'DFS',
    'DG',
    'DGX',
    'DHI',
    'DHR',
    'DIS',
    'DLTR',
    'DOC',
    'DOV',
    'DOW',
    'DPZ',
    'DRI',
    'DTE',
    'DUK',
    'DVA',
    'DVN',
    'DXCM',
    'EA',
    'EBAY',
    'ECL',
    'ED',
    'EFX',
    'EIX',
    'EL',
    'ELV',
    'EMN',
    'EMR',
    'ENPH',
    'EOG',
    'EPAM',
    'EQIX',
    'EQR',
    'EQT',
    'ES',
    'ESS',
    'ETN',
    'ETR',
    'EVRG',
    'EW',
    'EXC',
    'EXPD',
    'EXPE',
    'EXR',
    'F',
    'FANG',
    'FAST',
    'FCX',
    'FDS',
    'FDX',
    'FE',
    'FFIV',
    'FI',
    'FICO',
    'FIS',
    'FITB',
    'FMC',
    'FOX',
    'FOXA',
    'FRT',
    'FSLR',
    'FTNT',
    'FTV',
    'GD',
    'GDDY',
    'GE',
    'GEHC',
    'GEN',
    'GILD',
    'GIS',
    'GL',
    'GLW',
    'GM',
    'GNRC',
    'GOOGL',
    'GOOG',
    'GPC',
    'GPN',
    'GRMN',
    'GS',
    'GWW',
    'HAL',
    'HAS',
    'HBAN',
    'HCA',
    'HD',
    'HES',
    'HIG',
    'HII',
    'HLT',
    'HOLX',
    'HON',
    'HPE',
    'HPQ',
    'HRL',
    'HSIC',
    'HST',
    'HSY',
    'HUBB',
    'HUM',
    'HWM',
    'IBM',
    'ICE',
    'IDXX',
    'IEX',
    'IFF',
    'ILMN',
    'INCY',
    'INTC',
    'INTU',
    'INVH',
    'IP',
    'IPG',
    'IQV',
    'IR',
    'IRM',
    'ISRG',
    'IT',
    'ITW',
    'IVZ',
    'J',
    'JBHT',
    'JBL',
    'JCI',
    'JKHY',
    'JNJ',
    'JNPR',
    'JPM',
    'K',
    'KDP',
    'KEY',
    'KEYS',
    'KHC',
    'KIM',
    'KKR',
    'KLAC',
    'KMB',
    'KMI',
    'KMX',
    'KO',
    'KR',
    'KVUE',
    'L',
    'LDOS',
    'LEN',
    'LH',
    'LHX',
    'LIN',
    'LKQ',
    'LLY',
    'LMT',
    'LNT',
    'LOW',
    'LRCX',
    'LULU',
    'LUV',
    'LVS',
    'LW',
    'LYB',
    'LYV',
    'MA',
    'MAA',
    'MAR',
    'MAS',
    'MCD',
    'MCHP',
    'MCK',
    'MCO',
    'MDLZ',
    'MDT',
    'MET',
    'META',
    'MGM',
    'MHK',
    'MKC',
    'MKTX',
    'MLM',
    'MMC',
    'MMM',
    'MNST',
    'MO',
    'MOH',
    'MOS',
    'MPC',
    'MPWR',
    'MRK',
    'MRNA',
    'MRO',
    'MS',
    'MSCI',
    'MSFT',
    'MSI',
    'MTB',
    'MTCH',
    'MTD',
    'MU',
    'NCLH',
    'NDAQ',
    'NDSN',
    'NEE',
    'NEM',
    'NFLX',
    'NI',
    'NKE',
    'NOC',
    'NOW',
    'NRG',
    'NSC',
    'NTAP',
    'NTRS',
    'NUE',
    'NVDA',
    'NVR',
    'NWS',
    'NWSA',
    'NXPI',
    'O',
    'ODFL',
    'OKE',
    'OMC',
    'ON',
    'ORCL',
    'ORLY',
    'OTIS',
    'OXY',
    'PAYX',
    'PAYC',
    'PCAR',
    'PCG',
    'PEAK',
    'PEG',
    'PEP',
    'PFE',
    'PFG',
    'PG',
    'PGR',
    'PH',
    'PHM',
    'PKG',
    'PLD',
    'PM',
    'PNC',
    'PNR',
    'PNW',
    'POOL',
    'PPG',
    'PPL',
    'PRU',
    'PSA',
    'PSX',
    'PTC',
    'PWR',
    'PXD',
    'PYPL',
    'QCOM',
    'QRVO',
    'RCL',
    'RE',
    'REG',
    'REGN',
    'RF',
    'RJF',
    'RL',
    'RMD',
    'ROK',
    'ROL',
    'ROP',
    'ROST',
    'RSG',
    'RTX',
    'RVTY',
    'SBAC',
    'SBUX',
    'SCHW',
    'SHW',
    'SJM',
    'SLB',
    'SMCI',
    'SNA',
    'SNPS',
    'SO',
    'SOLV',
    'SPG',
    'SPGI',
    'SRE',
    'STE',
    'STLD',
    'STT',
    'STX',
    'STZ',
    'SWK',
    'SWKS',
    'SYF',
    'SYK',
    'SYY',
    'T',
    'TAP',
    'TDG',
    'TDY',
    'TECH',
    'TEL',
    'TER',
    'TFC',
    'TFX',
    'TGT',
    'TJX',
    'TMO',
    'TMUS',
    'TPR',
    'TRGP',
    'TRMB',
    'TROW',
    'TRV',
    'TSCO',
    'TSLA',
    'TSN',
    'TT',
    'TTWO',
    'TXN',
    'TXT',
    'TYL',
    'UAL',
    'UBER',
    'UDR',
    'UHS',
    'ULTA',
    'UNH',
    'UNP',
    'UPS',
    'URI',
    'USB',
    'V',
    'VFC',
    'VICI',
    'VLO',
    'VLTO',
    'VMC',
    'VRSK',
    'VRSN',
    'VRTX',
    'VST',
    'VTR',
    'VTRS',
    'VZ',
    'WAB',
    'WAT',
    'WBA',
    'WBD',
    'WDAY',
    'WDC',
    'WEC',
    'WELL',
    'WFC',
    'WHR',
    'WM',
    'WMB',
    'WMT',
    'WRB',
    'WST',
    'WTW',
    'WY',
    'WYNN',
    'XEL',
    'XOM',
    'XYL',
    'YUM',
    'ZBH',
    'ZBRA',
    'ZTS',
  };

  static const Set<String> _nasdaq100 = {
    'AAPL',
    'ABNB',
    'ADBE',
    'ADI',
    'ADP',
    'ADSK',
    'AEP',
    'AMAT',
    'AMD',
    'AMGN',
    'AMZN',
    'ANSS',
    'ARM',
    'ASML',
    'AVGO',
    'AZN',
    'BIIB',
    'BKNG',
    'BKR',
    'CCEP',
    'CDNS',
    'CDW',
    'CEG',
    'CHTR',
    'CMCSA',
    'COST',
    'CPRT',
    'CRWD',
    'CSCO',
    'CSGP',
    'CSX',
    'CTAS',
    'CTSH',
    'DASH',
    'DDOG',
    'DLTR',
    'DXCM',
    'EA',
    'EXC',
    'FANG',
    'FAST',
    'FTNT',
    'GEHC',
    'GFS',
    'GILD',
    'GOOG',
    'GOOGL',
    'HON',
    'IDXX',
    'ILMN',
    'INTC',
    'INTU',
    'ISRG',
    'KDP',
    'KHC',
    'KLAC',
    'LRCX',
    'LULU',
    'MAR',
    'MCHP',
    'MDB',
    'MDLZ',
    'META',
    'MNST',
    'MRNA',
    'MRVL',
    'MSFT',
    'MU',
    'NFLX',
    'NVDA',
    'NXPI',
    'O',
    'ODFL',
    'ON',
    'ORLY',
    'PANW',
    'PAYX',
    'PCAR',
    'PDD',
    'PEP',
    'PYPL',
    'QCOM',
    'REGN',
    'ROP',
    'ROST',
    'SBUX',
    'SMCI',
    'SNPS',
    'SPLK',
    'TEAM',
    'TMUS',
    'TSLA',
    'TTD',
    'TTWO',
    'TXN',
    'UBER',
    'VRSK',
    'VRTX',
    'WBD',
    'WDAY',
    'XEL',
    'ZS',
  };

  static const Set<String> _dow30 = {
    'AMGN',
    'AAPL',
    'AXP',
    'BA',
    'CAT',
    'CRM',
    'CSCO',
    'CVX',
    'DIS',
    'DOW',
    'GS',
    'HD',
    'HON',
    'IBM',
    'INTC',
    'JNJ',
    'JPM',
    'KO',
    'MCD',
    'MMM',
    'MRK',
    'MSFT',
    'NKE',
    'PG',
    'TRV',
    'UNH',
    'V',
    'VZ',
    'WMT',
    'WBA',
  };
}
