// Tests for S231-S245 domain batch:
//   notification_sound_profile, android_widget_config, prometheus_metric,
//   email_digest_config, trader_behavior_profile, sentiment_score,
//   community_watchlist, leaderboard_entry, streaming_quote_session,
//   device_sync_manifest, crypto_asset, theme_preset,
//   tax_lot_calculator, portfolio_optimizer, candle_annotation

import 'package:cross_tide/src/domain/android_widget_config.dart';
import 'package:cross_tide/src/domain/candle_annotation.dart';
import 'package:cross_tide/src/domain/community_watchlist.dart';
import 'package:cross_tide/src/domain/crypto_asset.dart';
import 'package:cross_tide/src/domain/device_sync_manifest.dart';
import 'package:cross_tide/src/domain/email_digest_config.dart';
import 'package:cross_tide/src/domain/leaderboard_entry.dart';
import 'package:cross_tide/src/domain/notification_sound_profile.dart';
import 'package:cross_tide/src/domain/portfolio_optimizer.dart';
import 'package:cross_tide/src/domain/prometheus_metric.dart';
import 'package:cross_tide/src/domain/sentiment_score.dart';
import 'package:cross_tide/src/domain/streaming_quote_session.dart';
import 'package:cross_tide/src/domain/tax_lot_calculator.dart';
import 'package:cross_tide/src/domain/theme_preset.dart';
import 'package:cross_tide/src/domain/trader_behavior_profile.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  // ─── S231 NotificationSoundProfile ───────────────────────────────────────
  group('NotificationSoundProfile', () {
    test('silent factory creates silent profile', () {
      final p = NotificationSoundProfile.silent('AAPL');
      expect(p.ticker, 'AAPL');
      expect(p.soundType, AlertSoundType.silent);
      expect(p.isAudible, isFalse);
    });

    test('ding profile is audible', () {
      const p = NotificationSoundProfile(
        ticker: 'MSFT',
        soundType: AlertSoundType.ding,
        priority: AlertSoundPriority.high,
      );
      expect(p.isAudible, isTrue);
    });

    test('vibrationOnly is not audible', () {
      const p = NotificationSoundProfile(
        ticker: 'GOOG',
        soundType: AlertSoundType.vibrationOnly,
        priority: AlertSoundPriority.normal,
      );
      expect(p.isAudible, isFalse);
    });

    test('equality', () {
      const a = NotificationSoundProfile(
        ticker: 'AAPL',
        soundType: AlertSoundType.chime,
        priority: AlertSoundPriority.urgent,
        repeatCount: 2,
      );
      const b = NotificationSoundProfile(
        ticker: 'AAPL',
        soundType: AlertSoundType.chime,
        priority: AlertSoundPriority.urgent,
        repeatCount: 2,
      );
      expect(a, equals(b));
    });
  });

  // ─── S232 AndroidWidgetConfig ─────────────────────────────────────────────
  group('AndroidWidgetConfig', () {
    test('default values', () {
      const cfg = AndroidWidgetConfig(
        widgetId: 1,
        ticker: 'AAPL',
        layoutStyle: WidgetLayoutStyle.compact,
        signalBadge: WidgetSignalBadge.dot,
      );
      expect(cfg.showSma200Distance, isTrue);
      expect(cfg.showLastUpdated, isTrue);
      expect(cfg.refreshIntervalMinutes, 15);
    });

    test('equality', () {
      const a = AndroidWidgetConfig(
        widgetId: 42,
        ticker: 'TSLA',
        layoutStyle: WidgetLayoutStyle.expanded,
        signalBadge: WidgetSignalBadge.banner,
      );
      const b = AndroidWidgetConfig(
        widgetId: 42,
        ticker: 'TSLA',
        layoutStyle: WidgetLayoutStyle.expanded,
        signalBadge: WidgetSignalBadge.banner,
      );
      expect(a, equals(b));
    });
  });

  // ─── S233 PrometheusMetric ────────────────────────────────────────────────
  group('PrometheusMetricsSnapshot', () {
    test('toExpositionFormat includes HELP and TYPE lines', () {
      final snap = PrometheusMetricsSnapshot(
        instanceId: 'device-1',
        collectedAt: DateTime(2026, 4, 9),
        metrics: const [
          PrometheusMetric(
            name: 'crosstide_alerts_total',
            type: PrometheusMetricType.counter,
            help: 'Total alerts fired',
            value: 42,
            labels: {'ticker': 'AAPL'},
          ),
        ],
      );
      final text = snap.toExpositionFormat();
      expect(text, contains('# HELP crosstide_alerts_total'));
      expect(text, contains('# TYPE crosstide_alerts_total counter'));
      expect(text, contains('crosstide_alerts_total{ticker="AAPL"} 42.0'));
    });

    test('metric without labels formats correctly', () {
      final snap = PrometheusMetricsSnapshot(
        instanceId: 'x',
        collectedAt: DateTime(2026, 1, 1),
        metrics: const [
          PrometheusMetric(
            name: 'crosstide_tickers_count',
            type: PrometheusMetricType.gauge,
            help: 'Watchlist size',
            value: 10,
          ),
        ],
      );
      final text = snap.toExpositionFormat();
      expect(text, contains('crosstide_tickers_count 10.0'));
    });

    test('equality', () {
      const m1 = PrometheusMetric(
        name: 'x',
        type: PrometheusMetricType.gauge,
        help: 'h',
        value: 1,
        timestamp: 0,
      );
      const m2 = PrometheusMetric(
        name: 'x',
        type: PrometheusMetricType.gauge,
        help: 'h',
        value: 1,
        timestamp: 0,
      );
      expect(m1, equals(m2));
    });
  });

  // ─── S234 EmailDigestConfig ───────────────────────────────────────────────
  group('EmailDigestConfig', () {
    const cfg = EmailDigestConfig(
      recipientEmail: 'trader@example.com',
      frequency: DigestFrequency.daily,
      sections: [DigestSection.consensusSignals],
    );

    test('default values', () {
      expect(cfg.sendAtHour, 18);
      expect(cfg.enabled, isTrue);
    });

    test('toggleEnabled flips', () {
      final off = cfg.toggleEnabled();
      expect(off.enabled, isFalse);
      expect(off.toggleEnabled().enabled, isTrue);
    });

    test('equality', () {
      const b = EmailDigestConfig(
        recipientEmail: 'trader@example.com',
        frequency: DigestFrequency.daily,
        sections: [DigestSection.consensusSignals],
      );
      expect(cfg, equals(b));
    });
  });

  // ─── S235 TraderBehaviorProfile ───────────────────────────────────────────
  group('TraderBehaviorClassifier', () {
    const classifier = TraderBehaviorClassifier();
    final now = DateTime(2026, 4, 9);

    List<TraderBehaviorRecord> makeRecords(int n, int avgResponseMins) =>
        List.generate(
          n,
          (i) => TraderBehaviorRecord(
            ticker: 'AAPL',
            alertType: 'michoMethodBuy',
            firedAt: now.subtract(Duration(days: i)),
            acknowledgedAt:
                now.subtract(Duration(days: i)).add(Duration(minutes: avgResponseMins)),
            actedWithinMinutes: avgResponseMins < 60 ? avgResponseMins : null,
          ),
        );

    test('returns unknown for < 5 observations', () {
      final profile = classifier.classify(makeRecords(3, 10));
      expect(profile.style, TraderStyle.unknown);
      expect(profile.isReliable, isFalse);
    });

    test('scalper style when average response < 15 min', () {
      final profile = classifier.classify(makeRecords(10, 5));
      expect(profile.style, TraderStyle.scalper);
      expect(profile.mostUsedMethod, 'michoMethodBuy');
    });

    test('momentum style when response > 7200 min', () {
      final profile = classifier.classify(makeRecords(10, 8000));
      expect(profile.style, TraderStyle.positionTrader);
    });

    test('confidence increases with more observations', () {
      final p10 = classifier.classify(makeRecords(10, 60));
      final p50 = classifier.classify(makeRecords(50, 60));
      expect(p50.profileConfidence, greaterThan(p10.profileConfidence));
    });
  });

  // ─── S236 SentimentScore ─────────────────────────────────────────────────
  group('SentimentAggregator', () {
    const agg = SentimentAggregator(windowHours: 24);
    final now = DateTime(2026, 4, 9, 12);

    test('empty dataPoints returns neutral', () {
      final score = agg.aggregate('AAPL', [], now: now);
      expect(score.direction, SentimentDirection.neutral);
      expect(score.compositeScore, 0.0);
      expect(score.count, 0);
    });

    test('positive scores produce bullish direction', () {
      final points = [
        SentimentDataPoint(
            source: SentimentSource.newsArticle,
            score: 0.8,
            capturedAt: now.subtract(const Duration(hours: 1))),
        SentimentDataPoint(
            source: SentimentSource.socialMedia,
            score: 0.6,
            capturedAt: now.subtract(const Duration(hours: 2))),
      ];
      final score = agg.aggregate('AAPL', points, now: now);
      expect(score.direction, SentimentDirection.bullish);
      expect(score.isBullish, isTrue);
      expect(score.isBearish, isFalse);
    });

    test('negative scores produce bearish direction', () {
      final points = [
        SentimentDataPoint(
            source: SentimentSource.analystReport,
            score: -0.9,
            capturedAt: now.subtract(const Duration(hours: 3))),
      ];
      final score = agg.aggregate('AAPL', points, now: now);
      expect(score.isBearish, isTrue);
    });

    test('older-than-window data points are excluded', () {
      final points = [
        SentimentDataPoint(
            source: SentimentSource.newsArticle,
            score: 0.9,
            capturedAt: now.subtract(const Duration(hours: 30))),
      ];
      final score = agg.aggregate('AAPL', points, now: now);
      expect(score.count, 0);
    });
  });

  // ─── S237 CommunityWatchlist ──────────────────────────────────────────────
  group('CommunityWatchlist', () {
    final now = DateTime(2026, 4, 9);
    final list = CommunityWatchlist(
      id: 'wl-001',
      title: 'Tech Momentum',
      description: 'High-momentum tech stocks',
      tickers: const ['AAPL', 'MSFT', 'NVDA'],
      tags: const [CommunityWatchlistTag.techGrowth, CommunityWatchlistTag.momentum],
      votes: [
        CommunityWatchlistVote(userId: 'u1', isUpvote: true, votedAt: now),
        CommunityWatchlistVote(userId: 'u2', isUpvote: true, votedAt: now),
        CommunityWatchlistVote(userId: 'u3', isUpvote: false, votedAt: now),
      ],
      createdBy: 'trader123',
      createdAt: now,
      followerCount: 42,
    );

    test('netScore', () => expect(list.netScore, 1));

    test('approvalRate', () {
      expect(list.approvalRate, closeTo(2 / 3, 0.001));
    });

    test('equality', () {
      final clone = CommunityWatchlist(
        id: 'wl-001',
        title: 'Tech Momentum',
        description: 'High-momentum tech stocks',
        tickers: const ['AAPL', 'MSFT', 'NVDA'],
        tags: const [CommunityWatchlistTag.techGrowth, CommunityWatchlistTag.momentum],
        votes: list.votes,
        createdBy: 'trader123',
        createdAt: now,
        followerCount: 42,
      );
      expect(list, equals(clone));
    });
  });

  // ─── S238 LeaderboardEntry ────────────────────────────────────────────────
  group('LeaderboardRanker', () {
    const ranker = LeaderboardRanker();
    final now = DateTime(2026, 4, 9);

    LeaderboardEntry makeEntry(String name, double score) => LeaderboardEntry(
          pseudonym: name,
          metric: LeaderboardMetric.signalAccuracy,
          period: LeaderboardPeriod.monthly,
          rank: 1,
          score: score,
          signalCount: 10,
          updatedAt: now,
        );

    test('ranks by descending score', () {
      final ranked = ranker.rank([
        makeEntry('Alice', 80.0),
        makeEntry('Bob', 95.0),
        makeEntry('Carol', 70.0),
      ]);
      expect(ranked[0].pseudonym, 'Bob');
      expect(ranked[0].rank, 1);
      expect(ranked[1].pseudonym, 'Alice');
      expect(ranked[2].pseudonym, 'Carol');
      expect(ranked[2].rank, 3);
    });

    test('ties get same rank', () {
      final ranked = ranker.rank([
        makeEntry('Alice', 80.0),
        makeEntry('Bob', 80.0),
        makeEntry('Carol', 70.0),
      ]);
      expect(ranked[0].rank, 1);
      expect(ranked[1].rank, 1);
      expect(ranked[2].rank, 3);
    });

    test('isTopRanked', () {
      final ranked = ranker.rank([makeEntry('Alice', 100), makeEntry('Bob', 50)]);
      expect(ranked[0].isTopRanked, isTrue);
      expect(ranked[1].isTopRanked, isFalse);
    });

    test('empty list returns empty', () {
      expect(ranker.rank([]), isEmpty);
    });
  });

  // ─── S239 StreamingQuoteSession ──────────────────────────────────────────
  group('StreamingQuoteSession', () {
    const cfg = StreamingQuoteConfig(
      endpoint: 'wss://stream.example.com/quotes',
      protocol: StreamingProtocol.websocket,
      tickers: ['AAPL', 'MSFT'],
    );

    test('default config values', () {
      expect(cfg.heartbeatMs, 30000);
      expect(cfg.maxReconnectAttempts, 5);
      expect(cfg.authToken, isNull);
    });

    test('disconnected session is not active', () {
      const session = StreamingQuoteSession(
        config: cfg,
        state: StreamingSessionState.disconnected,
        reconnectAttempts: 0,
      );
      expect(session.isActive, isFalse);
    });

    test('connected session is active', () {
      final session = StreamingQuoteSession(
        config: cfg,
        state: StreamingSessionState.connected,
        reconnectAttempts: 0,
        connectedAt: DateTime.now(),
      );
      expect(session.isActive, isTrue);
    });

    test('equality', () {
      const s1 = StreamingQuoteSession(
        config: cfg,
        state: StreamingSessionState.disconnected,
        reconnectAttempts: 0,
      );
      const s2 = StreamingQuoteSession(
        config: cfg,
        state: StreamingSessionState.disconnected,
        reconnectAttempts: 0,
      );
      expect(s1, equals(s2));
    });
  });

  // ─── S240 DeviceSyncManifest ──────────────────────────────────────────────
  group('DeviceSyncManifest', () {
    final now = DateTime(2026, 4, 9);

    test('isFullySynced when all entries synced', () {
      final manifest = DeviceSyncManifest(
        deviceId: 'device-1',
        entries: const [
          DeviceSyncEntry(
            category: SyncCategory.watchlist,
            status: SyncStatus.synced,
            localVersion: 5,
            remoteVersion: 5,
          ),
        ],
        generatedAt: now,
      );
      expect(manifest.isFullySynced, isTrue);
      expect(manifest.pendingCategories, isEmpty);
    });

    test('pendingCategories lists non-synced', () {
      final manifest = DeviceSyncManifest(
        deviceId: 'device-2',
        entries: const [
          DeviceSyncEntry(
            category: SyncCategory.watchlist,
            status: SyncStatus.localAhead,
            localVersion: 6,
            remoteVersion: 5,
          ),
          DeviceSyncEntry(
            category: SyncCategory.appSettings,
            status: SyncStatus.synced,
            localVersion: 2,
            remoteVersion: 2,
          ),
        ],
        generatedAt: now,
      );
      expect(manifest.isFullySynced, isFalse);
      expect(manifest.pendingCategories, [SyncCategory.watchlist]);
    });
  });

  // ─── S241 CryptoAsset ─────────────────────────────────────────────────────
  group('CryptoAsset and CryptoPrice', () {
    const btc = CryptoAsset(
      symbol: 'BTC',
      name: 'Bitcoin',
      coinId: 'btc-bitcoin',
      exchange: CryptoExchange.coingecko,
    );

    test('default values', () {
      expect(btc.pricePrecision, 8);
      expect(btc.isStablecoin, isFalse);
    });

    test('price isPositiveDay', () {
      final price = CryptoPrice(
        asset: btc,
        priceUsd: 80000.0,
        volume24hUsd: 30e9,
        marketCapUsd: 1.6e12,
        change24hPct: 3.5,
        timestamp: DateTime(2026, 4, 9),
      );
      expect(price.isPositiveDay, isTrue);
    });

    test('negative day', () {
      final price = CryptoPrice(
        asset: btc,
        priceUsd: 75000.0,
        volume24hUsd: 28e9,
        marketCapUsd: 1.5e12,
        change24hPct: -2.1,
        timestamp: DateTime(2026, 4, 9),
      );
      expect(price.isPositiveDay, isFalse);
    });

    test('equality', () {
      const eth = CryptoAsset(
        symbol: 'ETH',
        name: 'Ethereum',
        coinId: 'eth-ethereum',
        exchange: CryptoExchange.coinpaprika,
        isStablecoin: false,
      );
      const eth2 = CryptoAsset(
        symbol: 'ETH',
        name: 'Ethereum',
        coinId: 'eth-ethereum',
        exchange: CryptoExchange.coinpaprika,
        isStablecoin: false,
      );
      expect(eth, equals(eth2));
    });
  });

  // ─── S242 ThemePreset ─────────────────────────────────────────────────────
  group('ThemeRegistry', () {
    test('has 11 presets', () {
      expect(ThemeRegistry.presets.length, 11);
    });

    test('byId returns midnight for unknown id', () {
      final p = ThemeRegistry.byId('nonexistent');
      expect(p.id, 'midnight');
    });

    test('byId returns correct preset', () {
      final p = ThemeRegistry.byId('dracula');
      expect(p.name, 'Dracula');
      expect(p.isDark, isTrue);
    });

    test('all presets have unique ids', () {
      final ids = ThemeRegistry.presets.map((p) => p.id).toSet();
      expect(ids.length, ThemeRegistry.presets.length);
    });

    test('light theme exists', () {
      final light = ThemeRegistry.presets.where((p) => !p.isDark);
      expect(light.length, greaterThanOrEqualTo(1));
    });
  });

  // ─── S243 TaxLotCalculator ────────────────────────────────────────────────
  group('TaxLotCalculator', () {
    const calc = TaxLotCalculator();
    final lot1 = TaxLot(
      lotId: 'lot-1',
      ticker: 'AAPL',
      acquiredAt: DateTime(2024, 1, 1),
      shares: 10,
      costBasisPerShare: 150.0,
    );
    final lot2 = TaxLot(
      lotId: 'lot-2',
      ticker: 'AAPL',
      acquiredAt: DateTime(2025, 6, 1),
      shares: 5,
      costBasisPerShare: 180.0,
    );

    test('FIFO sells oldest lot first', () {
      final result = calc.compute(
        ticker: 'AAPL',
        openLots: [lot1, lot2],
        sharesSold: 5,
        pricePerShare: 200.0,
        soldAt: DateTime(2026, 4, 9),
        method: TaxLotMethod.fifo,
      );
      expect(result, isNotNull);
      expect(result!.costBasis, closeTo(5 * 150.0, 0.01));
      expect(result.realizedGain, closeTo(5 * 200.0 - 5 * 150.0, 0.01));
    });

    test('LIFO sells newest lot first', () {
      final result = calc.compute(
        ticker: 'AAPL',
        openLots: [lot1, lot2],
        sharesSold: 5,
        pricePerShare: 200.0,
        soldAt: DateTime(2026, 4, 9),
        method: TaxLotMethod.lifo,
      );
      expect(result, isNotNull);
      expect(result!.costBasis, closeTo(5 * 180.0, 0.01));
    });

    test('returns null when sharesSold exceeds available', () {
      final result = calc.compute(
        ticker: 'AAPL',
        openLots: [lot1],
        sharesSold: 20,
        pricePerShare: 200.0,
        soldAt: DateTime(2026, 4, 9),
      );
      expect(result, isNull);
    });

    test('long-term when held > 365 days', () {
      final result = calc.compute(
        ticker: 'AAPL',
        openLots: [lot1],
        sharesSold: 5,
        pricePerShare: 200.0,
        soldAt: DateTime(2026, 4, 9), // ~2 years after lot1
      );
      expect(result!.isLongTerm, isTrue);
    });

    test('totalCostBasis on lot', () {
      expect(lot1.totalCostBasis, closeTo(10 * 150.0, 0.001));
    });
  });

  // ─── S244 PortfolioOptimizer ──────────────────────────────────────────────
  group('PortfolioOptimizer', () {
    const optimizer = PortfolioOptimizer(iterations: 200);

    // Simple 2-asset return series
    final returnsA = List<double>.generate(50, (i) => 0.001 * (i % 3 - 1));
    final returnsB = List<double>.generate(50, (i) => 0.002 * (i % 5 - 2));

    test('equalWeight produces 50/50 for two assets', () {
      final result = optimizer.optimize(
        tickers: const ['A', 'B'],
        returns: [returnsA, returnsB],
        objective: OptimizationObjective.equalWeight,
      );
      expect(result, isNotNull);
      expect(result!.weights.length, 2);
      expect(result.weights[0].weight, closeTo(0.5, 0.001));
      expect(result.weights[1].weight, closeTo(0.5, 0.001));
    });

    test('weights sum to ~1.0 for maxSharpe', () {
      final result = optimizer.optimize(
        tickers: const ['A', 'B'],
        returns: [returnsA, returnsB],
        objective: OptimizationObjective.maxSharpe,
      );
      expect(result, isNotNull);
      final sum = result!.weights.fold<double>(0, (a, w) => a + w.weight);
      expect(sum, closeTo(1.0, 0.01));
    });

    test('weights sum to ~1.0 for riskParity', () {
      final result = optimizer.optimize(
        tickers: const ['A', 'B'],
        returns: [returnsA, returnsB],
        objective: OptimizationObjective.riskParity,
      );
      final sum = result!.weights.fold<double>(0, (a, w) => a + w.weight);
      expect(sum, closeTo(1.0, 0.01));
    });

    test('returns null for fewer than 2 tickers', () {
      final result = optimizer.optimize(
        tickers: const ['A'],
        returns: [returnsA],
        objective: OptimizationObjective.maxSharpe,
      );
      expect(result, isNull);
    });
  });

  // ─── S245 CandleAnnotation ────────────────────────────────────────────────
  group('CandleAnnotationBuilder', () {
    const builder = CandleAnnotationBuilder();
    final d1 = DateTime(2026, 3, 1);
    final d2 = DateTime(2026, 3, 5);
    final d3 = DateTime(2026, 2, 28);

    test('builds sorted annotations', () {
      final annotations = builder.build([
        (ticker: 'AAPL', date: d2, kind: AnnotationKind.consensusBuy, method: null),
        (ticker: 'AAPL', date: d3, kind: AnnotationKind.earningsDate, method: null),
        (ticker: 'AAPL', date: d1, kind: AnnotationKind.methodBuy, method: 'RSI'),
      ]);
      expect(annotations.length, 3);
      expect(annotations[0].candleDate, d3);
      expect(annotations[1].candleDate, d1);
      expect(annotations[2].candleDate, d2);
    });

    test('consensus BUY has triangleUp shape and isBuy=true', () {
      final annotations = builder.build([
        (ticker: 'AAPL', date: d1, kind: AnnotationKind.consensusBuy, method: null),
      ]);
      expect(annotations[0].shape, AnnotationShape.triangleUp);
      expect(annotations[0].isBuy, isTrue);
    });

    test('consensus SELL has triangleDown and isBuy=false', () {
      final annotations = builder.build([
        (ticker: 'AAPL', date: d1, kind: AnnotationKind.consensusSell, method: null),
      ]);
      expect(annotations[0].shape, AnnotationShape.triangleDown);
      expect(annotations[0].isBuy, isFalse);
    });

    test('method signals include method name in label', () {
      final annotations = builder.build([
        (ticker: 'AAPL', date: d1, kind: AnnotationKind.methodBuy, method: 'MACD'),
      ]);
      expect(annotations[0].label, 'MACD BUY');
    });

    test('equality', () {
      final a = CandleAnnotation(
        ticker: 'AAPL',
        candleDate: d1,
        kind: AnnotationKind.consensusBuy,
        shape: AnnotationShape.triangleUp,
        label: 'Consensus BUY',
      );
      final b = CandleAnnotation(
        ticker: 'AAPL',
        candleDate: d1,
        kind: AnnotationKind.consensusBuy,
        shape: AnnotationShape.triangleUp,
        label: 'Consensus BUY',
      );
      expect(a, equals(b));
    });
  });
}
