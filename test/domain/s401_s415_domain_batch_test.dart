import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  // ── S401 AlertChannelStatus ─────────────────────────────────────────────
  group('AlertChannelStatus (S401)', () {
    final healthy = AlertChannelStatus(
      channel: AlertChannelType.push,
      isEnabled: true,
      lastTestedAt: DateTime(2026, 1, 1),
      consecutiveFailures: 0,
    );

    final degraded = AlertChannelStatus(
      channel: AlertChannelType.email,
      isEnabled: true,
      lastTestedAt: DateTime(2026, 1, 1),
      consecutiveFailures: 4,
      failureReason: 'SMTP timeout',
    );

    test('isHealthy true when enabled and zero failures', () {
      expect(healthy.isHealthy, isTrue);
    });

    test('isHealthy false when disabled', () {
      final disabled = AlertChannelStatus(
        channel: AlertChannelType.sms,
        isEnabled: false,
        lastTestedAt: DateTime(2026, 1, 1),
      );
      expect(disabled.isHealthy, isFalse);
    });

    test('isDegraded true when consecutiveFailures > 3', () {
      expect(degraded.isDegraded, isTrue);
    });

    test('isDegraded false when failures <= 3', () {
      final borderline = AlertChannelStatus(
        channel: AlertChannelType.push,
        isEnabled: true,
        lastTestedAt: DateTime(2026, 1, 1),
        consecutiveFailures: 3,
      );
      expect(borderline.isDegraded, isFalse);
    });

    test('failureReason is set when degraded', () {
      expect(degraded.failureReason, 'SMTP timeout');
    });

    test('equality holds for same values', () {
      final a = AlertChannelStatus(
        channel: AlertChannelType.push,
        isEnabled: true,
        lastTestedAt: DateTime(2026, 1, 1),
      );
      final b = AlertChannelStatus(
        channel: AlertChannelType.push,
        isEnabled: true,
        lastTestedAt: DateTime(2026, 1, 1),
      );
      expect(a, equals(b));
    });

    test('all AlertChannelType values are distinct', () {
      const types = AlertChannelType.values;
      expect(types.toSet().length, types.length);
    });
  });

  // ── S402 AlertResponseLog ───────────────────────────────────────────────
  group('AlertResponseLog (S402)', () {
    final dismissed = AlertResponseLog(
      responseId: 'r1',
      alertId: 'a1',
      ticker: 'AAPL',
      actionKey: 'dismiss',
      respondedAt: DateTime(2026, 4, 10),
      durationMs: 2500,
    );

    final engaged = AlertResponseLog(
      responseId: 'r2',
      alertId: 'a2',
      ticker: 'MSFT',
      actionKey: 'view_chart',
      respondedAt: DateTime(2026, 4, 10),
    );

    test('isDismissed true for dismiss action', () {
      expect(dismissed.isDismissed, isTrue);
    });

    test('isEngaged true for non-dismiss actions', () {
      expect(engaged.isEngaged, isTrue);
    });

    test('durationMs available when tracked', () {
      expect(dismissed.durationMs, 2500);
    });

    test('durationMs null when not tracked', () {
      expect(engaged.durationMs, isNull);
    });

    test('equality holds for same values', () {
      final a = AlertResponseLog(
        responseId: 'r1',
        alertId: 'a1',
        ticker: 'AAPL',
        actionKey: 'dismiss',
        respondedAt: DateTime(2026, 4, 10),
        durationMs: 2500,
      );
      final b = AlertResponseLog(
        responseId: 'r1',
        alertId: 'a1',
        ticker: 'AAPL',
        actionKey: 'dismiss',
        respondedAt: DateTime(2026, 4, 10),
        durationMs: 2500,
      );
      expect(a, equals(b));
    });
  });

  // ── S403 AsyncDataState ─────────────────────────────────────────────────
  group('AsyncDataState (S403)', () {
    test('hasData true when data is present', () {
      const state = AsyncDataState<String>(data: 'hello');
      expect(state.hasData, isTrue);
    });

    test('hasData false when data is null', () {
      const state = AsyncDataState<String>();
      expect(state.hasData, isFalse);
    });

    test('hasError true when errorMessage is set', () {
      const state = AsyncDataState<int>(errorMessage: 'Network error');
      expect(state.hasError, isTrue);
    });

    test('isEmpty true when no data, not loading, no error', () {
      const state = AsyncDataState<double>();
      expect(state.isEmpty, isTrue);
    });

    test('isEmpty false when isLoading true', () {
      const state = AsyncDataState<double>(isLoading: true);
      expect(state.isEmpty, isFalse);
    });

    test('equality holds for same generics and values', () {
      const a = AsyncDataState<String>(data: 'test');
      const b = AsyncDataState<String>(data: 'test');
      expect(a, equals(b));
    });
  });

  // ── S404 BatchScanJob ───────────────────────────────────────────────────
  group('BatchScanJob (S404)', () {
    final completed = BatchScanJob(
      jobId: 'j1',
      status: BatchScanStatus.completed,
      totalTickers: 100,
      processedTickers: 100,
      matchedTickers: 12,
      createdAt: DateTime(2026, 4, 1),
      completedAt: DateTime(2026, 4, 1, 0, 5),
    );

    final running = BatchScanJob(
      jobId: 'j2',
      status: BatchScanStatus.running,
      totalTickers: 200,
      processedTickers: 80,
      matchedTickers: 5,
      createdAt: DateTime(2026, 4, 2),
    );

    test('isComplete true when status is completed', () {
      expect(completed.isComplete, isTrue);
    });

    test('isComplete false when running', () {
      expect(running.isComplete, isFalse);
    });

    test('progressPct reflects processed vs total', () {
      expect(running.progressPct, closeTo(40.0, 0.01));
    });

    test('progressPct 100 when all processed', () {
      expect(completed.progressPct, closeTo(100.0, 0.01));
    });

    test('matchedTickers available on completed job', () {
      expect(completed.matchedTickers, 12);
    });

    test('equality holds for same values', () {
      final a = BatchScanJob(
        jobId: 'j1',
        status: BatchScanStatus.completed,
        totalTickers: 100,
        processedTickers: 100,
        matchedTickers: 12,
        createdAt: DateTime(2026, 4, 1),
        completedAt: DateTime(2026, 4, 1, 0, 5),
      );
      final b = BatchScanJob(
        jobId: 'j1',
        status: BatchScanStatus.completed,
        totalTickers: 100,
        processedTickers: 100,
        matchedTickers: 12,
        createdAt: DateTime(2026, 4, 1),
        completedAt: DateTime(2026, 4, 1, 0, 5),
      );
      expect(a, equals(b));
    });

    test('all BatchScanStatus values are distinct', () {
      const statuses = BatchScanStatus.values;
      expect(statuses.toSet().length, statuses.length);
    });
  });

  // ── S405 CandleGapEvent ─────────────────────────────────────────────────
  group('CandleGapEvent (S405)', () {
    final gapUp = CandleGapEvent(
      ticker: 'AAPL',
      gapDate: DateTime(2026, 4, 1),
      prevClose: 200.0,
      openPrice: 210.0,
    );

    final gapDown = CandleGapEvent(
      ticker: 'TSLA',
      gapDate: DateTime(2026, 4, 1),
      prevClose: 300.0,
      openPrice: 285.0,
    );

    test('isGapUp true when open above prevClose', () {
      expect(gapUp.isGapUp, isTrue);
    });

    test('isGapUp false for gap down', () {
      expect(gapDown.isGapUp, isFalse);
    });

    test('gapPct is positive for gap up', () {
      expect(gapUp.gapPct, greaterThan(0.0));
    });

    test('gapPct is negative for gap down', () {
      expect(gapDown.gapPct, lessThan(0.0));
    });

    test('isBigGap true when abs gap >= 2%', () {
      expect(gapUp.isBigGap, isTrue); // 5%
    });

    test('equality holds for same values', () {
      final a = CandleGapEvent(
        ticker: 'AAPL',
        gapDate: DateTime(2026, 4, 1),
        prevClose: 200.0,
        openPrice: 210.0,
      );
      final b = CandleGapEvent(
        ticker: 'AAPL',
        gapDate: DateTime(2026, 4, 1),
        prevClose: 200.0,
        openPrice: 210.0,
      );
      expect(a, equals(b));
    });
  });

  // ── S406 ChartLayoutConfig ──────────────────────────────────────────────
  group('ChartLayoutConfig (S406)', () {
    const layout = ChartLayoutConfig(
      layoutId: 'l1',
      name: 'Multi-Method View',
      mainPanelIndicators: ['sma50', 'sma200'],
      subPanels: ['rsi', 'macd'],
      isDefault: true,
    );

    test('totalPanels counts main plus sub-panels', () {
      expect(layout.totalPanels, 3);
    });

    test('isDefault true when set', () {
      expect(layout.isDefault, isTrue);
    });

    test('mainPanelIndicators are accessible', () {
      expect(layout.mainPanelIndicators, contains('sma200'));
    });

    test('empty subPanels gives totalPanels of 1', () {
      const minimal = ChartLayoutConfig(
        layoutId: 'l2',
        name: 'Simple',
        mainPanelIndicators: [],
        subPanels: [],
      );
      expect(minimal.totalPanels, 1);
    });

    test('equality holds for same values', () {
      const a = ChartLayoutConfig(
        layoutId: 'l1',
        name: 'Multi-Method View',
        mainPanelIndicators: ['sma50', 'sma200'],
        subPanels: ['rsi', 'macd'],
        isDefault: true,
      );
      const b = ChartLayoutConfig(
        layoutId: 'l1',
        name: 'Multi-Method View',
        mainPanelIndicators: ['sma50', 'sma200'],
        subPanels: ['rsi', 'macd'],
        isDefault: true,
      );
      expect(a, equals(b));
    });
  });

  // ── S407 MarketMoverEntry ───────────────────────────────────────────────
  group('MarketMoverEntry (S407)', () {
    const gainer = MarketMoverEntry(
      ticker: 'NVDA',
      changePct: 8.5,
      close: 950.0,
      volume: 50000000,
      rank: 1,
      sectorName: 'Technology',
    );

    const loser = MarketMoverEntry(
      ticker: 'XYZ',
      changePct: -6.2,
      close: 12.0,
      volume: 10000000,
      rank: 1,
    );

    test('isGainer true for positive changePct', () {
      expect(gainer.isGainer, isTrue);
    });

    test('isGainer false for negative changePct', () {
      expect(loser.isGainer, isFalse);
    });

    test('isBigMover true when abs change >= 5%', () {
      expect(gainer.isBigMover, isTrue);
      expect(loser.isBigMover, isTrue);
    });

    test('sectorName null when not provided', () {
      expect(loser.sectorName, isNull);
    });

    test('equality holds for same values', () {
      const a = MarketMoverEntry(
        ticker: 'NVDA',
        changePct: 8.5,
        close: 950.0,
        volume: 50000000,
        rank: 1,
      );
      const b = MarketMoverEntry(
        ticker: 'NVDA',
        changePct: 8.5,
        close: 950.0,
        volume: 50000000,
        rank: 1,
      );
      expect(a, equals(b));
    });
  });

  // ── S408 NewsAlertConfig ────────────────────────────────────────────────
  group('NewsAlertConfig (S408)', () {
    const config = NewsAlertConfig(
      configId: 'c1',
      keywords: ['earnings', 'guidance'],
      minRelevanceScore: 0.6,
      isEnabled: true,
      allowedSources: ['Reuters', 'Bloomberg'],
      blocklistSources: ['spam-news.com'],
    );

    test('isSourcePermitted true for allowed source', () {
      expect(config.isSourcePermitted('Reuters'), isTrue);
    });

    test('isSourcePermitted false for blocklisted source', () {
      expect(config.isSourcePermitted('spam-news.com'), isFalse);
    });

    test(
      'isSourcePermitted false for non-allowed when allowlist non-empty',
      () {
        expect(config.isSourcePermitted('Unknown'), isFalse);
      },
    );

    test('empty allowlist permits any non-blocked source', () {
      const open = NewsAlertConfig(
        configId: 'c2',
        keywords: ['buyout'],
        minRelevanceScore: 0.5,
        isEnabled: true,
      );
      expect(open.isSourcePermitted('AnySource'), isTrue);
    });

    test('isActive true when enabled and has keywords', () {
      expect(config.isActive, isTrue);
    });

    test('equality holds for same values', () {
      const a = NewsAlertConfig(
        configId: 'c1',
        keywords: ['earnings', 'guidance'],
        minRelevanceScore: 0.6,
        isEnabled: true,
      );
      const b = NewsAlertConfig(
        configId: 'c1',
        keywords: ['earnings', 'guidance'],
        minRelevanceScore: 0.6,
        isEnabled: true,
      );
      expect(a, equals(b));
    });
  });

  // ── S409 OrderBookLevel ─────────────────────────────────────────────────
  group('OrderBookLevel (S409)', () {
    const bid = OrderBookLevel(price: 199.95, size: 500, side: true);
    const ask = OrderBookLevel(price: 200.05, size: 300, side: false);

    test('isBid true for bid side', () {
      expect(bid.isBid, isTrue);
    });

    test('isAsk true for ask side', () {
      expect(ask.isAsk, isTrue);
    });

    test('notional equals price times size', () {
      expect(bid.notional, closeTo(99975.0, 0.01));
    });

    test('equality holds for same values', () {
      const a = OrderBookLevel(price: 199.95, size: 500, side: true);
      const b = OrderBookLevel(price: 199.95, size: 500, side: true);
      expect(a, equals(b));
    });

    test('bid and ask are not equal', () {
      expect(bid, isNot(equals(ask)));
    });
  });

  // ── S410 PortfolioExposureMap ───────────────────────────────────────────
  group('PortfolioExposureMap (S410)', () {
    final balanced = PortfolioExposureMap(
      capturedAt: DateTime(2026, 4, 1),
      assetClassWeights: const {'equity': 55.0, 'bonds': 35.0, 'cash': 10.0},
      sectorWeights: const {'tech': 25.0, 'health': 20.0, 'finance': 15.0},
      topHoldingTicker: 'AAPL',
      topHoldingPct: 8.0,
    );

    final concentrated = PortfolioExposureMap(
      capturedAt: DateTime(2026, 4, 1),
      assetClassWeights: const {'equity': 90.0, 'bonds': 10.0},
      sectorWeights: const {'tech': 65.0, 'other': 35.0},
    );

    test('isConcentrated false for balanced portfolio', () {
      expect(balanced.isConcentrated, isFalse);
    });

    test('isConcentrated true when any class exceeds 60%', () {
      expect(concentrated.isConcentrated, isTrue);
    });

    test('isSectorConcentrated true when sector exceeds 30%', () {
      expect(concentrated.isSectorConcentrated, isTrue);
    });

    test('topHoldingTicker null when not provided', () {
      expect(concentrated.topHoldingTicker, isNull);
    });

    test('equality holds for same values', () {
      final a = PortfolioExposureMap(
        capturedAt: DateTime(2026, 4, 1),
        assetClassWeights: const {'equity': 55.0},
        sectorWeights: const {'tech': 25.0},
      );
      final b = PortfolioExposureMap(
        capturedAt: DateTime(2026, 4, 1),
        assetClassWeights: const {'equity': 55.0},
        sectorWeights: const {'tech': 25.0},
      );
      expect(a, equals(b));
    });
  });

  // ── S411 PriceLevelBreachLog ────────────────────────────────────────────
  group('PriceLevelBreachLog (S411)', () {
    final upsideBreach = PriceLevelBreachLog(
      logId: 'bl1',
      ticker: 'AAPL',
      triggerLevel: 200.0,
      breachPrice: 203.5,
      breachedAt: DateTime(2026, 4, 1),
      isUpside: true,
    );

    test('isUpside true for upward breach', () {
      expect(upsideBreach.isUpside, isTrue);
    });

    test('overshoot equals abs difference', () {
      expect(upsideBreach.overshoot, closeTo(3.5, 0.01));
    });

    test('overshootPct computed correctly', () {
      expect(upsideBreach.overshootPct, closeTo(1.75, 0.01));
    });

    test('downside breach has isUpside false', () {
      final downside = PriceLevelBreachLog(
        logId: 'bl2',
        ticker: 'MSFT',
        triggerLevel: 350.0,
        breachPrice: 345.0,
        breachedAt: DateTime(2026, 4, 1),
        isUpside: false,
      );
      expect(downside.isUpside, isFalse);
      expect(downside.overshoot, closeTo(5.0, 0.01));
    });

    test('equality holds for same values', () {
      final a = PriceLevelBreachLog(
        logId: 'bl1',
        ticker: 'AAPL',
        triggerLevel: 200.0,
        breachPrice: 203.5,
        breachedAt: DateTime(2026, 4, 1),
        isUpside: true,
      );
      final b = PriceLevelBreachLog(
        logId: 'bl1',
        ticker: 'AAPL',
        triggerLevel: 200.0,
        breachPrice: 203.5,
        breachedAt: DateTime(2026, 4, 1),
        isUpside: true,
      );
      expect(a, equals(b));
    });
  });

  // ── S412 RatioComparisonResult ──────────────────────────────────────────
  group('RatioComparisonResult (S412)', () {
    const result = RatioComparisonResult(
      ratioName: 'P/E',
      tickerA: 'AAPL',
      valueA: 28.0,
      tickerB: 'MSFT',
      valueB: 20.0,
    );

    test('difference is valueA minus valueB', () {
      expect(result.difference, closeTo(8.0, 0.01));
    });

    test('aIsHigher true when A > B', () {
      expect(result.aIsHigher, isTrue);
    });

    test('isSignificant true when abs diff > 20%', () {
      expect(result.isSignificant, isTrue); // 40% difference
    });

    test('differencePct computed against valueB', () {
      expect(result.differencePct, closeTo(40.0, 0.01));
    });

    test('equality holds for same values', () {
      const a = RatioComparisonResult(
        ratioName: 'P/E',
        tickerA: 'AAPL',
        valueA: 28.0,
        tickerB: 'MSFT',
        valueB: 35.0,
      );
      const b = RatioComparisonResult(
        ratioName: 'P/E',
        tickerA: 'AAPL',
        valueA: 28.0,
        tickerB: 'MSFT',
        valueB: 35.0,
      );
      expect(a, equals(b));
    });
  });

  // ── S413 SectorMomentumScore ────────────────────────────────────────────
  group('SectorMomentumScore (S413)', () {
    final leading = SectorMomentumScore(
      sectorName: 'Technology',
      score: 85.0,
      direction: SectorMomentumDirection.leading,
      calculatedAt: DateTime(2026, 4, 1),
      relativeStrength: 1.15,
    );

    final lagging = SectorMomentumScore(
      sectorName: 'Utilities',
      score: 30.0,
      direction: SectorMomentumDirection.lagging,
      calculatedAt: DateTime(2026, 4, 1),
      relativeStrength: 0.85,
    );

    test('isPositive true for leading direction', () {
      expect(leading.isPositive, isTrue);
    });

    test('isPositive false for lagging direction', () {
      expect(lagging.isPositive, isFalse);
    });

    test('isOutperforming true when relativeStrength > 1', () {
      expect(leading.isOutperforming, isTrue);
    });

    test('isOutperforming false when relativeStrength < 1', () {
      expect(lagging.isOutperforming, isFalse);
    });

    test('all SectorMomentumDirection values are distinct', () {
      const dirs = SectorMomentumDirection.values;
      expect(dirs.toSet().length, dirs.length);
    });

    test('equality holds for same values', () {
      final a = SectorMomentumScore(
        sectorName: 'Technology',
        score: 85.0,
        direction: SectorMomentumDirection.leading,
        calculatedAt: DateTime(2026, 4, 1),
      );
      final b = SectorMomentumScore(
        sectorName: 'Technology',
        score: 85.0,
        direction: SectorMomentumDirection.leading,
        calculatedAt: DateTime(2026, 4, 1),
      );
      expect(a, equals(b));
    });
  });

  // ── S414 TechnicalSummaryCard ───────────────────────────────────────────
  group('TechnicalSummaryCard (S414)', () {
    final bullish = TechnicalSummaryCard(
      ticker: 'AAPL',
      close: 215.0,
      sma50: 205.0,
      sma200: 195.0,
      rsi14: 62.0,
      macdLine: 2.5,
      macdSignal: 1.8,
      updatedAt: DateTime(2026, 4, 1),
    );

    final oversold = TechnicalSummaryCard(
      ticker: 'XYZ',
      close: 50.0,
      sma50: 60.0,
      sma200: 55.0,
      rsi14: 22.0,
      macdLine: -1.0,
      macdSignal: -0.5,
      updatedAt: DateTime(2026, 4, 1),
    );

    test('isAboveBothMas true when close > sma50 and sma200', () {
      expect(bullish.isAboveBothMas, isTrue);
    });

    test('isGoldenCross true when sma50 > sma200', () {
      expect(bullish.isGoldenCross, isTrue);
    });

    test('isMacdBullish true when macdLine > macdSignal', () {
      expect(bullish.isMacdBullish, isTrue);
    });

    test('isOversold true when rsi14 < 30', () {
      expect(oversold.isOversold, isTrue);
    });

    test('isOverbought false when rsi in normal range', () {
      expect(bullish.isOverbought, isFalse);
    });

    test('equality holds for same values', () {
      final a = TechnicalSummaryCard(
        ticker: 'AAPL',
        close: 215.0,
        sma50: 205.0,
        sma200: 195.0,
        rsi14: 62.0,
        macdLine: 2.5,
        macdSignal: 1.8,
        updatedAt: DateTime(2026, 4, 1),
      );
      final b = TechnicalSummaryCard(
        ticker: 'AAPL',
        close: 215.0,
        sma50: 205.0,
        sma200: 195.0,
        rsi14: 62.0,
        macdLine: 2.5,
        macdSignal: 1.8,
        updatedAt: DateTime(2026, 4, 1),
      );
      expect(a, equals(b));
    });
  });

  // ── S415 TickerOwnershipRecord ──────────────────────────────────────────
  group('TickerOwnershipRecord (S415)', () {
    final institutional = TickerOwnershipRecord(
      ticker: 'AAPL',
      ownerCategory: 'institutional',
      ownershipPct: 62.5,
      reportedAt: DateTime(2026, 3, 31),
      changePctPoints: 1.2,
      holderName: 'Vanguard Group',
    );

    test('isSignificantHolder true when ownershipPct >= 5', () {
      expect(institutional.isSignificantHolder, isTrue);
    });

    test('isAccumulating true when changePctPoints positive', () {
      expect(institutional.isAccumulating, isTrue);
    });

    test('isAccumulating false when distributing', () {
      final distributing = TickerOwnershipRecord(
        ticker: 'AAPL',
        ownerCategory: 'institutional',
        ownershipPct: 10.0,
        reportedAt: DateTime(2026, 3, 31),
        changePctPoints: -0.5,
      );
      expect(distributing.isAccumulating, isFalse);
    });

    test('holderName available when set', () {
      expect(institutional.holderName, 'Vanguard Group');
    });

    test('isSignificantHolder false below 5%', () {
      final minor = TickerOwnershipRecord(
        ticker: 'XYZ',
        ownerCategory: 'retail',
        ownershipPct: 2.0,
        reportedAt: DateTime(2026, 3, 31),
      );
      expect(minor.isSignificantHolder, isFalse);
    });

    test('equality holds for same values', () {
      final a = TickerOwnershipRecord(
        ticker: 'AAPL',
        ownerCategory: 'institutional',
        ownershipPct: 62.5,
        reportedAt: DateTime(2026, 3, 31),
      );
      final b = TickerOwnershipRecord(
        ticker: 'AAPL',
        ownerCategory: 'institutional',
        ownershipPct: 62.5,
        reportedAt: DateTime(2026, 3, 31),
      );
      expect(a, equals(b));
    });
  });
}
