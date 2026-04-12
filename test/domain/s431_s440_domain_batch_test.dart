import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  // ── S431: DataProviderConfig ──────────────────────────────────────────────
  group('DataProviderConfig', () {
    test('isPaidTier false for free tier', () {
      const DataProviderConfig config = DataProviderConfig(
        providerId: 'yahoo',
        providerName: 'Yahoo Finance',
        baseUrl: 'https://query1.finance.yahoo.com',
        tier: DataProviderTier.free,
        rateLimitPerMinute: 60,
      );
      expect(config.isPaidTier, isFalse);
      expect(config.isHighThroughput, isFalse);
      expect(config.isEnabled, isTrue);
    });

    test('isPaidTier true for professional tier', () {
      const DataProviderConfig config = DataProviderConfig(
        providerId: 'polygon',
        providerName: 'Polygon.io',
        baseUrl: 'https://api.polygon.io',
        tier: DataProviderTier.professional,
        rateLimitPerMinute: 250,
        isEnabled: false,
      );
      expect(config.isPaidTier, isTrue);
      expect(config.isHighThroughput, isTrue);
      expect(config.isEnabled, isFalse);
    });

    test('isHighThroughput boundary at 100', () {
      const DataProviderConfig config = DataProviderConfig(
        providerId: 'p1',
        providerName: 'P1',
        baseUrl: 'https://p1.example.com',
        tier: DataProviderTier.basic,
        rateLimitPerMinute: 100,
      );
      expect(config.isHighThroughput, isTrue);
    });

    test('equality', () {
      const DataProviderConfig a = DataProviderConfig(
        providerId: 'yahoo',
        providerName: 'Yahoo Finance',
        baseUrl: 'https://query1.finance.yahoo.com',
        tier: DataProviderTier.free,
        rateLimitPerMinute: 60,
      );
      const DataProviderConfig b = DataProviderConfig(
        providerId: 'yahoo',
        providerName: 'Yahoo Finance',
        baseUrl: 'https://query1.finance.yahoo.com',
        tier: DataProviderTier.free,
        rateLimitPerMinute: 60,
      );
      expect(a, equals(b));
    });
  });

  // ── S432: TickerNewsSummary ───────────────────────────────────────────────
  group('TickerNewsSummary', () {
    test('isBullish true when dominant sentiment is bullish', () {
      const TickerNewsSummary summary = TickerNewsSummary(
        ticker: 'AAPL',
        windowHours: 24,
        articleCount: 12,
        sentimentScore: 0.65,
        dominantSentiment: TickerNewsSentiment.bullish,
        topHeadline: 'Apple hits record revenue',
      );
      expect(summary.isBullish, isTrue);
      expect(summary.isBearish, isFalse);
      expect(summary.hasNews, isTrue);
    });

    test('isBearish true when dominant sentiment is bearish', () {
      const TickerNewsSummary summary = TickerNewsSummary(
        ticker: 'NFLX',
        windowHours: 12,
        articleCount: 7,
        sentimentScore: -0.40,
        dominantSentiment: TickerNewsSentiment.bearish,
        topHeadline: 'Netflix subscriber miss',
      );
      expect(summary.isBearish, isTrue);
      expect(summary.isBullish, isFalse);
    });

    test('hasNews false when articleCount is 0', () {
      const TickerNewsSummary summary = TickerNewsSummary(
        ticker: 'XYZ',
        windowHours: 24,
        articleCount: 0,
        sentimentScore: 0.0,
        dominantSentiment: TickerNewsSentiment.neutral,
        topHeadline: '',
      );
      expect(summary.hasNews, isFalse);
    });

    test('equality', () {
      const TickerNewsSummary a = TickerNewsSummary(
        ticker: 'AAPL',
        windowHours: 24,
        articleCount: 12,
        sentimentScore: 0.65,
        dominantSentiment: TickerNewsSentiment.bullish,
        topHeadline: 'Apple hits record revenue',
      );
      const TickerNewsSummary b = TickerNewsSummary(
        ticker: 'AAPL',
        windowHours: 24,
        articleCount: 12,
        sentimentScore: 0.65,
        dominantSentiment: TickerNewsSentiment.bullish,
        topHeadline: 'Apple hits record revenue',
      );
      expect(a, equals(b));
    });
  });

  // ── S433: EarningsEstimate ────────────────────────────────────────────────
  group('EarningsEstimate', () {
    test('hasConsensus true when >= 3 analysts', () {
      const EarningsEstimate est = EarningsEstimate(
        ticker: 'MSFT',
        fiscalQuarter: 'Q2 2025',
        analystCount: 5,
        epsConsensus: 3.10,
        epsHigh: 3.20,
        epsLow: 3.00,
        revenueConsensusMillions: 62000,
      );
      expect(est.hasConsensus, isTrue);
      expect(est.epsRange, closeTo(0.20, 0.001));
      expect(est.isHighAgreement, isFalse);
    });

    test('hasConsensus false when < 3 analysts', () {
      const EarningsEstimate est = EarningsEstimate(
        ticker: 'SMCO',
        fiscalQuarter: 'Q1 2025',
        analystCount: 2,
        epsConsensus: 1.50,
        epsHigh: 1.55,
        epsLow: 1.48,
        revenueConsensusMillions: 500,
      );
      expect(est.hasConsensus, isFalse);
    });

    test('isHighAgreement true when range <= 0.10', () {
      const EarningsEstimate est = EarningsEstimate(
        ticker: 'GOOG',
        fiscalQuarter: 'Q3 2025',
        analystCount: 8,
        epsConsensus: 1.85,
        epsHigh: 1.90,
        epsLow: 1.84,
        revenueConsensusMillions: 85000,
      );
      expect(est.epsRange, closeTo(0.06, 0.001));
      expect(est.isHighAgreement, isTrue);
    });

    test('equality', () {
      const EarningsEstimate a = EarningsEstimate(
        ticker: 'MSFT',
        fiscalQuarter: 'Q2 2025',
        analystCount: 5,
        epsConsensus: 3.10,
        epsHigh: 3.20,
        epsLow: 3.00,
        revenueConsensusMillions: 62000,
      );
      const EarningsEstimate b = EarningsEstimate(
        ticker: 'MSFT',
        fiscalQuarter: 'Q2 2025',
        analystCount: 5,
        epsConsensus: 3.10,
        epsHigh: 3.20,
        epsLow: 3.00,
        revenueConsensusMillions: 62000,
      );
      expect(a, equals(b));
    });
  });

  // ── S434: PriceTargetConsensus ────────────────────────────────────────────
  group('PriceTargetConsensus', () {
    test('upsidePotential computed correctly', () {
      const PriceTargetConsensus ptc = PriceTargetConsensus(
        ticker: 'NVDA',
        currentPrice: 800.0,
        targetMean: 1000.0,
        targetHigh: 1200.0,
        targetLow: 750.0,
        analystCount: 10,
        buyRatings: 8,
        holdRatings: 2,
        sellRatings: 0,
      );
      expect(ptc.upsidePotential, closeTo(25.0, 0.01));
      expect(ptc.isBuyMajority, isTrue);
      expect(ptc.isAboveCurrentPrice, isTrue);
    });

    test('isBuyMajority false when buy count is minority', () {
      const PriceTargetConsensus ptc = PriceTargetConsensus(
        ticker: 'META',
        currentPrice: 500.0,
        targetMean: 480.0,
        targetHigh: 520.0,
        targetLow: 420.0,
        analystCount: 6,
        buyRatings: 2,
        holdRatings: 3,
        sellRatings: 1,
      );
      expect(ptc.isBuyMajority, isFalse);
      expect(ptc.isAboveCurrentPrice, isFalse);
    });

    test('upsidePotential zero when price is zero', () {
      const PriceTargetConsensus ptc = PriceTargetConsensus(
        ticker: 'X',
        currentPrice: 0.0,
        targetMean: 10.0,
        targetHigh: 12.0,
        targetLow: 8.0,
        analystCount: 1,
        buyRatings: 1,
        holdRatings: 0,
        sellRatings: 0,
      );
      expect(ptc.upsidePotential, equals(0.0));
    });

    test('equality', () {
      const PriceTargetConsensus a = PriceTargetConsensus(
        ticker: 'NVDA',
        currentPrice: 800.0,
        targetMean: 1000.0,
        targetHigh: 1200.0,
        targetLow: 750.0,
        analystCount: 10,
        buyRatings: 8,
        holdRatings: 2,
        sellRatings: 0,
      );
      const PriceTargetConsensus b = PriceTargetConsensus(
        ticker: 'NVDA',
        currentPrice: 800.0,
        targetMean: 1000.0,
        targetHigh: 1200.0,
        targetLow: 750.0,
        analystCount: 10,
        buyRatings: 8,
        holdRatings: 2,
        sellRatings: 0,
      );
      expect(a, equals(b));
    });
  });

  // ── S435: MacroEconomicSnapshot ───────────────────────────────────────────
  group('MacroEconomicSnapshot', () {
    test('isRecessionarySignal true when inverted curve and negative GDP', () {
      final MacroEconomicSnapshot snap = MacroEconomicSnapshot(
        snapshotId: 'm1',
        capturedAt: DateTime(2025, 6, 1),
        gdpGrowthPct: -0.5,
        inflationPct: 4.0,
        unemploymentPct: 5.5,
        centralBankRatePct: 5.25,
        yieldCurve10y2yBps: -50,
      );
      expect(snap.isYieldCurveInverted, isTrue);
      expect(snap.isRecessionarySignal, isTrue);
      expect(snap.isHighInflation, isTrue);
    });

    test('isRecessionarySignal false when curve not inverted', () {
      final MacroEconomicSnapshot snap = MacroEconomicSnapshot(
        snapshotId: 'm2',
        capturedAt: DateTime(2025, 6, 2),
        gdpGrowthPct: 2.5,
        inflationPct: 2.1,
        unemploymentPct: 3.8,
        centralBankRatePct: 4.0,
        yieldCurve10y2yBps: 70,
      );
      expect(snap.isYieldCurveInverted, isFalse);
      expect(snap.isRecessionarySignal, isFalse);
      expect(snap.isHighInflation, isFalse);
    });

    test('equality', () {
      final MacroEconomicSnapshot a = MacroEconomicSnapshot(
        snapshotId: 'm1',
        capturedAt: DateTime(2025, 6, 1),
        gdpGrowthPct: 2.0,
        inflationPct: 2.5,
        unemploymentPct: 4.0,
        centralBankRatePct: 4.5,
        yieldCurve10y2yBps: 40,
      );
      final MacroEconomicSnapshot b = MacroEconomicSnapshot(
        snapshotId: 'm1',
        capturedAt: DateTime(2025, 6, 1),
        gdpGrowthPct: 2.0,
        inflationPct: 2.5,
        unemploymentPct: 4.0,
        centralBankRatePct: 4.5,
        yieldCurve10y2yBps: 40,
      );
      expect(a, equals(b));
    });
  });

  // ── S436: SectorPerformanceSnapshot ──────────────────────────────────────
  group('SectorPerformanceSnapshot', () {
    const SectorPerformanceSnapshot snap = SectorPerformanceSnapshot(
      snapshotId: 'sp1',
      periodLabel: 'YTD 2025',
      sectorPerformances: {
        'Technology': 18.5,
        'Energy': -3.2,
        'Healthcare': 7.0,
      },
    );

    test('leadingSector is Technology', () {
      expect(snap.leadingSector, equals('Technology'));
    });

    test('laggingSector is Energy', () {
      expect(snap.laggingSector, equals('Energy'));
    });

    test('sectorCount is 3', () {
      expect(snap.sectorCount, equals(3));
    });

    test('leadingSector null for empty snapshot', () {
      const SectorPerformanceSnapshot empty = SectorPerformanceSnapshot(
        snapshotId: 'sp2',
        periodLabel: 'Empty',
        sectorPerformances: {},
      );
      expect(empty.leadingSector, isNull);
      expect(empty.laggingSector, isNull);
    });

    test('equality', () {
      const SectorPerformanceSnapshot a = SectorPerformanceSnapshot(
        snapshotId: 'sp1',
        periodLabel: 'YTD 2025',
        sectorPerformances: {'Technology': 18.5},
      );
      const SectorPerformanceSnapshot b = SectorPerformanceSnapshot(
        snapshotId: 'sp1',
        periodLabel: 'YTD 2025',
        sectorPerformances: {'Technology': 18.5},
      );
      expect(a, equals(b));
    });
  });

  // ── S437: MarketCalendarEntry ─────────────────────────────────────────────
  group('MarketCalendarEntry', () {
    test('isMarketClosed true for holiday', () {
      final MarketCalendarEntry entry = MarketCalendarEntry(
        entryId: 'e1',
        title: 'Independence Day',
        eventDate: DateTime(2025, 7, 4),
        category: MarketCalendarCategory.holiday,
        exchange: 'NYSE',
      );
      expect(entry.isMarketClosed, isTrue);
      expect(entry.isHighImpact, isFalse);
      expect(entry.isConfirmed, isTrue);
    });

    test('isHighImpact true for centralBank', () {
      final MarketCalendarEntry entry = MarketCalendarEntry(
        entryId: 'e2',
        title: 'FOMC Rate Decision',
        eventDate: DateTime(2025, 9, 17),
        category: MarketCalendarCategory.centralBank,
        exchange: 'US',
      );
      expect(entry.isHighImpact, isTrue);
      expect(entry.isMarketClosed, isFalse);
    });

    test('isHighImpact true for economicRelease', () {
      final MarketCalendarEntry entry = MarketCalendarEntry(
        entryId: 'e3',
        title: 'CPI Release',
        eventDate: DateTime(2025, 8, 13),
        category: MarketCalendarCategory.economicRelease,
        exchange: 'US',
        isConfirmed: false,
      );
      expect(entry.isHighImpact, isTrue);
      expect(entry.isConfirmed, isFalse);
    });

    test('equality', () {
      final MarketCalendarEntry a = MarketCalendarEntry(
        entryId: 'e1',
        title: 'Holiday',
        eventDate: DateTime(2025, 7, 4),
        category: MarketCalendarCategory.holiday,
        exchange: 'NYSE',
      );
      final MarketCalendarEntry b = MarketCalendarEntry(
        entryId: 'e1',
        title: 'Holiday',
        eventDate: DateTime(2025, 7, 4),
        category: MarketCalendarCategory.holiday,
        exchange: 'NYSE',
      );
      expect(a, equals(b));
    });
  });

  // ── S438: AltDataSignal ───────────────────────────────────────────────────
  group('AltDataSignal', () {
    test('isBullish true when score > 0.2', () {
      final AltDataSignal signal = AltDataSignal(
        signalId: 'sig1',
        ticker: 'AMZN',
        source: AltDataSource.searchTrend,
        signalScore: 0.75,
        generatedAt: DateTime(2025, 4, 1),
        periodDays: 30,
      );
      expect(signal.isBullish, isTrue);
      expect(signal.isBearish, isFalse);
      expect(signal.isStrong, isTrue);
    });

    test('isBearish true when score < -0.2', () {
      final AltDataSignal signal = AltDataSignal(
        signalId: 'sig2',
        ticker: 'LYFT',
        source: AltDataSource.transactionData,
        signalScore: -0.45,
        generatedAt: DateTime(2025, 4, 2),
        periodDays: 14,
      );
      expect(signal.isBearish, isTrue);
      expect(signal.isStrong, isFalse);
    });

    test('neutral signal is neither bullish nor strong', () {
      final AltDataSignal signal = AltDataSignal(
        signalId: 'sig3',
        ticker: 'SPY',
        source: AltDataSource.webTraffic,
        signalScore: 0.10,
        generatedAt: DateTime(2025, 4, 3),
        periodDays: 7,
      );
      expect(signal.isBullish, isFalse);
      expect(signal.isBearish, isFalse);
      expect(signal.isStrong, isFalse);
    });

    test('equality', () {
      final AltDataSignal a = AltDataSignal(
        signalId: 'sig1',
        ticker: 'AMZN',
        source: AltDataSource.searchTrend,
        signalScore: 0.75,
        generatedAt: DateTime(2025, 4, 1),
        periodDays: 30,
      );
      final AltDataSignal b = AltDataSignal(
        signalId: 'sig1',
        ticker: 'AMZN',
        source: AltDataSource.searchTrend,
        signalScore: 0.75,
        generatedAt: DateTime(2025, 4, 1),
        periodDays: 30,
      );
      expect(a, equals(b));
    });
  });

  // ── S439: FundamentalRatioSnapshot ────────────────────────────────────────
  group('FundamentalRatioSnapshot', () {
    test('isValueStock true when PE < 15 and PB < 2', () {
      final FundamentalRatioSnapshot snap = FundamentalRatioSnapshot(
        ticker: 'BAC',
        capturedAt: DateTime(2025, 3, 31),
        peRatio: 10.5,
        pbRatio: 1.2,
        psRatio: 2.0,
        evEbitda: 12.0,
        debtToEquity: 1.8,
      );
      expect(snap.isValueStock, isTrue);
      expect(snap.isHighLeverage, isFalse);
      expect(snap.isPremiumValuation, isFalse);
    });

    test('isHighLeverage true when D/E > 2', () {
      final FundamentalRatioSnapshot snap = FundamentalRatioSnapshot(
        ticker: 'T',
        capturedAt: DateTime(2025, 3, 31),
        peRatio: 8.0,
        pbRatio: 0.9,
        psRatio: 1.5,
        evEbitda: 8.0,
        debtToEquity: 3.5,
      );
      expect(snap.isHighLeverage, isTrue);
    });

    test('isPremiumValuation true when EV/EBITDA > 20', () {
      final FundamentalRatioSnapshot snap = FundamentalRatioSnapshot(
        ticker: 'NVDA',
        capturedAt: DateTime(2025, 3, 31),
        peRatio: 60.0,
        pbRatio: 25.0,
        psRatio: 20.0,
        evEbitda: 45.0,
        debtToEquity: 0.4,
      );
      expect(snap.isPremiumValuation, isTrue);
      expect(snap.isValueStock, isFalse);
    });

    test('equality', () {
      final FundamentalRatioSnapshot a = FundamentalRatioSnapshot(
        ticker: 'BAC',
        capturedAt: DateTime(2025, 3, 31),
        peRatio: 10.5,
        pbRatio: 1.2,
        psRatio: 2.0,
        evEbitda: 12.0,
        debtToEquity: 1.8,
      );
      final FundamentalRatioSnapshot b = FundamentalRatioSnapshot(
        ticker: 'BAC',
        capturedAt: DateTime(2025, 3, 31),
        peRatio: 10.5,
        pbRatio: 1.2,
        psRatio: 2.0,
        evEbitda: 12.0,
        debtToEquity: 1.8,
      );
      expect(a, equals(b));
    });
  });

  // ── S440: LiquidityScore ──────────────────────────────────────────────────
  group('LiquidityScore', () {
    test('isLiquid true for high tier', () {
      const LiquidityScore ls = LiquidityScore(
        ticker: 'SPY',
        score: 95.0,
        tier: LiquidityTier.high,
        averageDailyVolume: 80000000,
        averageSpreadBps: 1.0,
      );
      expect(ls.isLiquid, isTrue);
      expect(ls.isTightSpread, isTrue);
    });

    test('isLiquid true for medium tier', () {
      const LiquidityScore ls = LiquidityScore(
        ticker: 'AAPL',
        score: 75.0,
        tier: LiquidityTier.medium,
        averageDailyVolume: 50000000,
        averageSpreadBps: 3.0,
      );
      expect(ls.isLiquid, isTrue);
    });

    test('isLiquid false for low tier', () {
      const LiquidityScore ls = LiquidityScore(
        ticker: 'SMCO',
        score: 30.0,
        tier: LiquidityTier.low,
        averageDailyVolume: 100000,
        averageSpreadBps: 20.0,
      );
      expect(ls.isLiquid, isFalse);
      expect(ls.isTightSpread, isFalse);
    });

    test('isTightSpread true at exactly 5 bps', () {
      const LiquidityScore ls = LiquidityScore(
        ticker: 'QQQ',
        score: 88.0,
        tier: LiquidityTier.high,
        averageDailyVolume: 40000000,
        averageSpreadBps: 5.0,
      );
      expect(ls.isTightSpread, isTrue);
    });

    test('equality', () {
      const LiquidityScore a = LiquidityScore(
        ticker: 'SPY',
        score: 95.0,
        tier: LiquidityTier.high,
        averageDailyVolume: 80000000,
        averageSpreadBps: 1.0,
      );
      const LiquidityScore b = LiquidityScore(
        ticker: 'SPY',
        score: 95.0,
        tier: LiquidityTier.high,
        averageDailyVolume: 80000000,
        averageSpreadBps: 1.0,
      );
      expect(a, equals(b));
    });
  });
}
