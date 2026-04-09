import 'package:cross_tide/src/domain/account_tier.dart';
import 'package:cross_tide/src/domain/alert_event_filter.dart';
import 'package:cross_tide/src/domain/alert_handler_config.dart';
import 'package:cross_tide/src/domain/alert_handler_plugin.dart';
import 'package:cross_tide/src/domain/backtest_optimizer.dart';
import 'package:cross_tide/src/domain/indicator_formula.dart';
import 'package:cross_tide/src/domain/container_service_config.dart';
import 'package:cross_tide/src/domain/copilot_query_result.dart';
import 'package:cross_tide/src/domain/custom_indicator_formula.dart';
import 'package:cross_tide/src/domain/natural_language_query.dart';
import 'package:cross_tide/src/domain/news_article.dart';
import 'package:cross_tide/src/domain/notification_timing_profile.dart';
import 'package:cross_tide/src/domain/pattern_recognition_result.dart';
import 'package:cross_tide/src/domain/plugin_descriptor.dart';
import 'package:cross_tide/src/domain/prometheus_endpoint_config.dart';
import 'package:cross_tide/src/domain/prometheus_metric.dart';
import 'package:cross_tide/src/domain/pwa_manifest_config.dart';
import 'package:cross_tide/src/domain/rest_api_config.dart';
import 'package:cross_tide/src/domain/signal_confidence_score.dart';
import 'package:cross_tide/src/domain/subscription_tier.dart';
import 'package:cross_tide/src/domain/widget_refresh_schedule.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  // ── S246: CopilotQueryResult ──────────────────────────────────────────────

  group('CopilotQueryResult', () {
    test('stores query, intent, answer, citations, confidence', () {
      final result = CopilotQueryResult(
        query: 'Why did AAPL alert?',
        intent: QueryIntent.signalExplanation,
        answer: 'Price crossed above SMA200.',
        citations: const [],
        confidence: 0.9,
        respondedAt: DateTime(2026),
      );
      expect(result.query, 'Why did AAPL alert?');
      expect(result.intent, QueryIntent.signalExplanation);
      expect(result.isHighConfidence, isTrue);
    });

    test('isHighConfidence false when confidence < 0.8', () {
      final result = CopilotQueryResult(
        query: 'q',
        intent: QueryIntent.unknown,
        answer: 'a',
        citations: const [],
        confidence: 0.5,
        respondedAt: DateTime(2026),
      );
      expect(result.isHighConfidence, isFalse);
    });

    test('asserts confidence in [0,1]', () {
      expect(
        () => CopilotQueryResult(
          query: 'q',
          intent: QueryIntent.unknown,
          answer: 'a',
          citations: const [],
          confidence: 1.5,
          respondedAt: DateTime(2026),
        ),
        throwsAssertionError,
      );
    });

    test('QueryCitation equality', () {
      const c1 = QueryCitation(source: 'Yahoo', excerpt: 'x');
      const c2 = QueryCitation(source: 'Yahoo', excerpt: 'x');
      expect(c1, equals(c2));
    });
  });

  // ── S247: NewsArticle / NewsFeedConfig ────────────────────────────────────

  group('NewsArticle', () {
    final article = NewsArticle(
      id: 'art1',
      ticker: 'MSFT',
      headline: 'MSFT beats earnings',
      source: NewsSource.yahooFinance,
      publishedAt: DateTime(2026, 4, 10),
      sentimentHint: NewsSentimentHint.positive,
      relevanceScore: 0.85,
    );

    test('constructs correctly', () {
      expect(article.ticker, 'MSFT');
      expect(article.isHighRelevance, isTrue);
    });

    test('isHighRelevance false when score < 0.7', () {
      final low = NewsArticle(
        id: 'art2',
        ticker: 'X',
        headline: 'h',
        source: NewsSource.rss,
        publishedAt: DateTime(2026),
        sentimentHint: NewsSentimentHint.neutral,
        relevanceScore: 0.5,
      );
      expect(low.isHighRelevance, isFalse);
    });

    test('NewsFeedConfig.defaults() has sensible values', () {
      final cfg = NewsFeedConfig.defaults();
      expect(cfg.enabled, isTrue);
      expect(cfg.maxArticlesPerTicker, 20);
      expect(cfg.sources, contains(NewsSource.yahooFinance));
    });

    test('equality holds', () {
      final a2 = NewsArticle(
        id: 'art1',
        ticker: 'MSFT',
        headline: 'MSFT beats earnings',
        source: NewsSource.yahooFinance,
        publishedAt: DateTime(2026, 4, 10),
        sentimentHint: NewsSentimentHint.positive,
        relevanceScore: 0.85,
      );
      expect(article, equals(a2));
    });
  });

  // ── S248: NaturalLanguageQuery ────────────────────────────────────────────

  group('NaturalLanguageQuery', () {
    test('isParsed true for known intent', () {
      final q = NaturalLanguageQuery(
        raw: 'show me oversold tech stocks',
        intent: NlQueryIntent.findOversold,
        constraints: const [],
        parsedAt: DateTime(2026),
        sectorHint: 'tech',
      );
      expect(q.isParsed, isTrue);
    });

    test('isParsed false for unknown intent', () {
      final q = NaturalLanguageQuery(
        raw: 'asdfghjkl',
        intent: NlQueryIntent.unknown,
        constraints: const [],
        parsedAt: DateTime(2026),
      );
      expect(q.isParsed, isFalse);
    });

    test('NlQueryConstraint equality', () {
      const c1 = NlQueryConstraint(field: 'rsi', operator: 'lt', value: '30');
      const c2 = NlQueryConstraint(field: 'rsi', operator: 'lt', value: '30');
      expect(c1, equals(c2));
    });
  });

  // ── S249: PatternRecognitionResult ───────────────────────────────────────

  group('PatternRecognitionResult', () {
    const fp = PatternFingerprint(
      category: PatternCategory.smaSetup,
      name: 'price_near_sma200',
      lookbackBars: 20,
      featureHash: 'abc123',
    );
    const outcome = PatternOutcome(
      totalMatches: 40,
      profitableMatches: 30,
      avgReturnPct: 4.2,
      avgHoldingDays: 5.5,
      maxGainPct: 18.0,
      maxLossPct: -6.0,
    );

    test('winRate computes correctly', () {
      expect(outcome.winRate, closeTo(0.75, 0.001));
    });

    test('winRate is 0 when no matches', () {
      const empty = PatternOutcome(
        totalMatches: 0,
        profitableMatches: 0,
        avgReturnPct: 0,
        avgHoldingDays: 0,
        maxGainPct: 0,
        maxLossPct: 0,
      );
      expect(empty.winRate, 0.0);
    });

    test('PatternRecognitionResult isHighConfidence', () {
      final r = PatternRecognitionResult(
        ticker: 'AAPL',
        fingerprint: fp,
        outcome: outcome,
        matchedAt: DateTime(2026),
        confidenceScore: 0.8,
      );
      expect(r.isHighConfidence, isTrue);
    });

    test('asserts confidenceScore in [0,1]', () {
      expect(
        () => PatternRecognitionResult(
          ticker: 'AAPL',
          fingerprint: fp,
          outcome: outcome,
          matchedAt: DateTime(2026),
          confidenceScore: -0.1,
        ),
        throwsAssertionError,
      );
    });
  });

  // ── S250: PluginDescriptor ────────────────────────────────────────────────

  group('PluginDescriptor', () {
    const v1 = PluginVersion(major: 1, minor: 2, patch: 3);
    const v2 = PluginVersion(major: 1, minor: 3, patch: 0);

    test('PluginVersion.parse parses semver', () {
      final v = PluginVersion.parse('2.5.1');
      expect(v.major, 2);
      expect(v.minor, 5);
      expect(v.patch, 1);
      expect(v.semver, '2.5.1');
    });

    test('isNewerThan returns true for newer minor', () {
      expect(v2.isNewerThan(v1), isTrue);
    });

    test('isNewerThan returns false for older', () {
      expect(v1.isNewerThan(v2), isFalse);
    });

    test('PluginDescriptor isUsable true when active', () {
      const d = PluginDescriptor(
        id: 'com.example.rsi_delta',
        name: 'RSI Delta',
        type: PluginType.indicator,
        version: v1,
        status: PluginStatus.active,
        author: 'Alice',
      );
      expect(d.isUsable, isTrue);
    });

    test('withStatus returns copy with new status', () {
      const d = PluginDescriptor(
        id: 'test',
        name: 'Test',
        type: PluginType.alertHandler,
        version: v1,
        status: PluginStatus.active,
        author: 'Bob',
      );
      final updated = d.withStatus(PluginStatus.inactive);
      expect(updated.status, PluginStatus.inactive);
      expect(updated.id, d.id);
    });
  });

  // ── S251: PrometheusEndpointConfig ───────────────────────────────────────

  group('PrometheusEndpointConfig', () {
    test('defaults() are sensible', () {
      final cfg = PrometheusEndpointConfig.defaults();
      expect(cfg.enabled, isFalse);
      expect(cfg.port, 9090);
      expect(cfg.authScheme, MetricsAuthScheme.none);
      expect(cfg.requiresAuth, isFalse);
    });

    test('requiresAuth true for bearerToken', () {
      const cfg = PrometheusEndpointConfig(
        enabled: true,
        port: 9091,
        path: '/metrics',
        authScheme: MetricsAuthScheme.bearerToken,
        scrapeIntervalSeconds: 15,
        tokenKeyRef: 'prom_token',
      );
      expect(cfg.requiresAuth, isTrue);
    });

    test('asserts port range', () {
      expect(
        () => PrometheusEndpointConfig(
          enabled: false,
          port: 0,
          path: '/metrics',
          authScheme: MetricsAuthScheme.none,
          scrapeIntervalSeconds: 15,
        ),
        throwsAssertionError,
      );
    });
  });

  // ── S233 (missed export): PrometheusMetric / PrometheusMetricsSnapshot ───

  group('PrometheusMetric', () {
    test('PrometheusMetric equality', () {
      const m1 = PrometheusMetric(
        name: 'crosstide_alerts_total',
        type: PrometheusMetricType.counter,
        help: 'Total alerts fired.',
        value: 42.0,
      );
      const m2 = PrometheusMetric(
        name: 'crosstide_alerts_total',
        type: PrometheusMetricType.counter,
        help: 'Total alerts fired.',
        value: 42.0,
      );
      expect(m1, equals(m2));
    });

    test('PrometheusMetricsSnapshot.toExpositionFormat() output', () {
      final snap = PrometheusMetricsSnapshot(
        instanceId: 'test_instance',
        collectedAt: DateTime(2026),
        metrics: const [
          PrometheusMetric(
            name: 'test_gauge',
            type: PrometheusMetricType.gauge,
            help: 'A test gauge.',
            value: 7.0,
          ),
        ],
      );
      final text = snap.toExpositionFormat();
      expect(text, contains('# HELP test_gauge A test gauge.'));
      expect(text, contains('test_gauge 7.0'));
    });
  });

  // ── S252: PwaManifestConfig ───────────────────────────────────────────────

  group('PwaManifestConfig', () {
    test('defaults() produce sane CrossTide manifest', () {
      final cfg = PwaManifestConfig.defaults();
      expect(cfg.name, 'CrossTide');
      expect(cfg.displayMode, PwaDisplayMode.standalone);
      expect(cfg.startUrl, '/');
    });

    test('PwaShortcutAction equality', () {
      const s1 = PwaShortcutAction(
        name: 'Alerts',
        urlPath: '/alerts',
        description: 'View alerts',
      );
      const s2 = PwaShortcutAction(
        name: 'Alerts',
        urlPath: '/alerts',
        description: 'View alerts',
      );
      expect(s1, equals(s2));
    });
  });

  // ── S253: AlertConfidenceScore ───────────────────────────────────────────

  group('AlertConfidenceScore', () {
    const factors = [
      ConfidenceFactor(
        type: ConfidenceFactorType.historicalWinRate,
        value: 0.8,
        weight: 0.5,
      ),
      ConfidenceFactor(
        type: ConfidenceFactorType.technicalAlignment,
        value: 0.6,
        weight: 0.5,
      ),
    ];

    test('computeScore returns weighted average', () {
      final score = AlertConfidenceScore.computeScore(factors);
      expect(score, closeTo(0.7, 0.001));
    });

    test('computeScore returns 0.0 for empty list', () {
      expect(AlertConfidenceScore.computeScore([]), 0.0);
    });

    test('isHighConfidence true when score >= 0.75', () {
      final s = AlertConfidenceScore(
        ticker: 'AAPL',
        signalType: 'micho_buy',
        factors: factors,
        overallScore: 0.85,
        computedAt: DateTime(2026),
      );
      expect(s.isHighConfidence, isTrue);
    });

    test('asserts overallScore in [0,1]', () {
      expect(
        () => AlertConfidenceScore(
          ticker: 'X',
          signalType: 's',
          factors: const [],
          overallScore: 1.1,
          computedAt: DateTime(2026),
        ),
        throwsAssertionError,
      );
    });
  });

  // ── S254: NotificationTimingProfile ──────────────────────────────────────

  group('NotificationTimingProfile', () {
    test('withObservation appends observation', () {
      const profile = NotificationTimingProfile(
        ticker: null,
        preferredWindows: [],
        observations: [],
        enabled: true,
      );
      final obs = EngagementObservation(
        window: EngagementWindow.marketOpen,
        engaged: true,
        observedAt: DateTime(2026),
      );
      final updated = profile.withObservation(obs);
      expect(updated.observations.length, 1);
      expect(updated.observations.first, obs);
    });

    test('derivePreferred ranks by engagement rate descending', () {
      final obsList = [
        EngagementObservation(
          window: EngagementWindow.earlyMorning,
          engaged: true,
          observedAt: DateTime(2026),
        ),
        EngagementObservation(
          window: EngagementWindow.earlyMorning,
          engaged: true,
          observedAt: DateTime(2026),
        ),
        EngagementObservation(
          window: EngagementWindow.evening,
          engaged: false,
          observedAt: DateTime(2026),
        ),
      ];
      final ranked = NotificationTimingProfile.derivePreferred(obsList);
      expect(ranked.first, EngagementWindow.earlyMorning);
    });
  });

  // ── S255: AlertHandlerConfig ──────────────────────────────────────────────

  group('AlertHandlerConfig', () {
    test('inApp() factory creates in-app handler', () {
      final h = AlertHandlerConfig.inApp();
      expect(h.sinkType, AlertSinkType.inApp);
      expect(h.enabled, isTrue);
      expect(h.requiresCredential, isFalse);
    });

    test('requiresCredential true for Discord', () {
      const h = AlertHandlerConfig(
        id: 'discord_1',
        name: 'Discord',
        sinkType: AlertSinkType.discord,
        enabled: true,
        maxRetries: 3,
        endpointUrl: 'https://discord.com/api/webhooks/x/y',
        credentialKeyRef: 'discord_token',
      );
      expect(h.requiresCredential, isTrue);
    });

    test('asserts maxRetries >= 0', () {
      expect(
        () => AlertHandlerConfig(
          id: 'x',
          name: 'X',
          sinkType: AlertSinkType.slack,
          enabled: true,
          maxRetries: -1,
        ),
        throwsAssertionError,
      );
    });
  });

  // ── S256: CustomIndicatorFormula ──────────────────────────────────────────

  group('CustomIndicatorFormula', () {
    const step1 = FormulaStep(
      operation: FormulaOperation.sma,
      operands: [FormulaOperand(name: 'close', period: 50)],
      outputName: 'sma50',
    );
    const step2 = FormulaStep(
      operation: FormulaOperation.crossAbove,
      operands: [
        FormulaOperand(name: 'close'),
        FormulaOperand(name: 'sma50'),
      ],
      outputName: 'crossAboveSma50',
    );

    test('outputName returns last step outputName', () {
      final f = CustomIndicatorFormula(
        id: 'cross_sma50',
        name: 'Cross Above SMA50',
        steps: const [step1, step2],
      );
      expect(f.outputName, 'crossAboveSma50');
    });

    test('asserts at least one step', () {
      expect(
        () => CustomIndicatorFormula(id: 'x', name: 'X', steps: const []),
        throwsAssertionError,
      );
    });

    test('FormulaOperand equality', () {
      const a = FormulaOperand(name: 'close', period: 50);
      const b = FormulaOperand(name: 'close', period: 50);
      expect(a, equals(b));
    });
  });

  // ── S257: RestApiConfig ───────────────────────────────────────────────────

  group('RestApiConfig', () {
    test('defaults() produce sensible config', () {
      final cfg = RestApiConfig.defaults();
      expect(cfg.enabled, isFalse);
      expect(cfg.port, 8080);
      expect(cfg.isPublic, isTrue);
      expect(cfg.routes.length, greaterThan(0));
    });

    test('isPublic false when authMode is apiKey', () {
      const cfg = RestApiConfig(
        enabled: true,
        port: 8080,
        basePath: '/api',
        authMode: RestApiAuthMode.apiKey,
        allowedOrigins: [],
        routes: [],
        credentialKeyRef: 'api_key',
      );
      expect(cfg.isPublic, isFalse);
    });

    test('asserts port in [1, 65535]', () {
      expect(
        () => RestApiConfig(
          enabled: false,
          port: 65536,
          basePath: '/api',
          authMode: RestApiAuthMode.none,
          allowedOrigins: const [],
          routes: const [],
        ),
        throwsAssertionError,
      );
    });
  });

  // ── S258: SubscriptionTier ────────────────────────────────────────────────

  group('SubscriptionTier', () {
    test('free() has maxTickers 10, lacks unlimitedTickers', () {
      final t = SubscriptionTier.free();
      expect(t.maxTickers, 10);
      expect(t.hasFeature(TierFeature.unlimitedTickers), isFalse);
    });

    test('pro() has unlimitedTickers feature, maxTickers 100', () {
      final t = SubscriptionTier.pro();
      expect(t.maxTickers, 100);
      expect(t.hasFeature(TierFeature.unlimitedTickers), isTrue);
    });

    test('enterprise() has pluginSystem feature, unlimited tickers', () {
      final t = SubscriptionTier.enterprise();
      expect(t.maxTickers, -1);
      expect(t.hasFeature(TierFeature.pluginSystem), isTrue);
    });

    test('isActiveAt true before expiry', () {
      final t = SubscriptionTier.pro(
        expiresAt: DateTime(2030),
      );
      expect(t.isActiveAt(DateTime(2026)), isTrue);
    });

    test('isActiveAt false after expiry', () {
      final t = SubscriptionTier.pro(
        expiresAt: DateTime(2025),
      );
      expect(t.isActiveAt(DateTime(2026)), isFalse);
    });
  });

  // ── S259: ContainerComposeConfig ─────────────────────────────────────────

  group('ContainerComposeConfig', () {
    test('devStack() has 4 services', () {
      final cfg = ContainerComposeConfig.devStack();
      expect(cfg.services.length, 4);
      expect(cfg.projectName, 'crosstide-dev');
    });

    test('servicesWithRole returns postgres', () {
      final cfg = ContainerComposeConfig.devStack();
      final dbs = cfg.servicesWithRole(ServiceRole.database);
      expect(dbs.length, 1);
      expect(dbs.first.name, 'postgres');
    });

    test('ContainerService imageRef combines image and tag', () {
      const svc = ContainerService(
        name: 'redis',
        image: 'redis',
        tag: '7-alpine',
        ports: ['6379:6379'],
        role: ServiceRole.cache,
      );
      expect(svc.imageRef, 'redis:7-alpine');
    });
  });

  // ── S260: WidgetRefreshSchedule ───────────────────────────────────────────

  group('WidgetRefreshSchedule', () {
    test('RefreshIntervalMinutes extension returns correct minutes', () {
      expect(RefreshInterval.min15.minutes, 15);
      expect(RefreshInterval.hour1.minutes, 60);
      expect(RefreshInterval.hour24.minutes, 1440);
    });

    test('isOverdueAt true when never refreshed', () {
      const schedule = WidgetRefreshSchedule(
        widgetId: 'w1',
        triggers: [RefreshTrigger.timer],
        interval: RefreshInterval.hour1,
        enabled: true,
      );
      expect(schedule.isOverdueAt(DateTime(2026, 4, 10)), isTrue);
    });

    test('isOverdueAt false when refreshed recently', () {
      final now = DateTime(2026, 4, 10, 12, 0);
      final schedule = WidgetRefreshSchedule(
        widgetId: 'w1',
        triggers: const [RefreshTrigger.timer],
        interval: RefreshInterval.hour1,
        enabled: true,
        lastRefreshedAt: now.subtract(const Duration(minutes: 30)),
      );
      expect(schedule.isOverdueAt(now), isFalse);
    });

    test('isOverdueAt true when elapsed exceeds interval', () {
      final now = DateTime(2026, 4, 10, 12, 0);
      final schedule = WidgetRefreshSchedule(
        widgetId: 'w1',
        triggers: const [RefreshTrigger.timer],
        interval: RefreshInterval.min15,
        enabled: true,
        lastRefreshedAt: now.subtract(const Duration(minutes: 20)),
      );
      expect(schedule.isOverdueAt(now), isTrue);
    });

    test('equality based on all fields', () {
      const s1 = WidgetRefreshSchedule(
        widgetId: 'w2',
        triggers: [RefreshTrigger.onBoot],
        interval: RefreshInterval.hour4,
        enabled: false,
      );
      const s2 = WidgetRefreshSchedule(
        widgetId: 'w2',
        triggers: [RefreshTrigger.onBoot],
        interval: RefreshInterval.hour4,
        enabled: false,
      );
      expect(s1, equals(s2));
    });
  });

  // ── AccountTier (extra) ───────────────────────────────────────────────────

  group('AccountTier', () {
    test('free() has maxWatchlistTickers 10 and no premium features', () {
      final t = AccountTier.free();
      expect(t.plan, TierPlan.free);
      expect(t.maxWatchlistTickers, 10);
      expect(t.hasStreamingQuotes, isFalse);
    });

    test('pro() has streamingQuotes and multiDeviceSync', () {
      final t = AccountTier.pro();
      expect(t.plan, TierPlan.pro);
      expect(t.hasStreamingQuotes, isTrue);
      expect(t.hasMultiDeviceSync, isTrue);
    });

    test('enterprise() has unlimited tickers and prioritySupport', () {
      final t = AccountTier.enterprise();
      expect(t.maxWatchlistTickers, -1);
      expect(t.hasPrioritySupport, isTrue);
    });
  });

  // ── AlertEventFilter (extra) ──────────────────────────────────────────────

  group('AlertEventFilter', () {
    test('all() factory has no active filters', () {
      const f = AlertEventFilter.all();
      expect(f.isFiltered, isFalse);
    });

    test('isFiltered true when ticker is set', () {
      const f = AlertEventFilter(ticker: 'AAPL');
      expect(f.isFiltered, isTrue);
    });

    test('copyWith updates only specified fields', () {
      const base = AlertEventFilter.all();
      final updated = base.copyWith(ticker: 'MSFT', onlyTriggered: true);
      expect(updated.ticker, 'MSFT');
      expect(updated.onlyTriggered, isTrue);
      expect(updated.alertTypes, isEmpty);
    });
  });

  // ── AlertHandlerPlugin (extra) ────────────────────────────────────────────

  group('AlertHandlerPlugin', () {
    test('disabled() factory creates disabled plugin', () {
      final p = AlertHandlerPlugin.disabled(PluginSinkType.discord, 'Discord');
      expect(p.sinkType, PluginSinkType.discord);
      expect(p.enabled, isFalse);
    });

    test('enable() returns enabled copy', () {
      final p = AlertHandlerPlugin.disabled(PluginSinkType.slack, 'Slack');
      final enabled = p.enable();
      expect(enabled.enabled, isTrue);
      expect(enabled.id, p.id);
    });

    test('PluginCredential equality', () {
      const c1 = PluginCredential(key: 'token', storageKeyRef: 'ref1');
      const c2 = PluginCredential(key: 'token', storageKeyRef: 'ref1');
      expect(c1, equals(c2));
    });
  });

  // ── BacktestOptimizer (extra) ─────────────────────────────────────────────

  group('BacktestOptimizer', () {
    test('ParameterRange stepCount is correct', () {
      const range = ParameterRange(
        name: 'smaPeriod',
        min: 50,
        max: 200,
        step: 10,
      );
      expect(range.stepCount, 16);
    });

    test('ParameterRange asserts min <= max', () {
      expect(
        () => ParameterRange(name: 'p', min: 100, max: 10, step: 1),
        throwsAssertionError,
      );
    });

    test('totalCombinations multiplies step counts', () {
      const r1 = ParameterRange(name: 'r1', min: 0, max: 10, step: 5);
      const r2 = ParameterRange(name: 'r2', min: 0, max: 4, step: 2);
      const opt = BacktestOptimizer(
        parameterRanges: [r1, r2],
        optimizeFor: OptimizationMetric.sharpeRatio,
      );
      expect(opt.totalCombinations, greaterThan(0));
    });
  });

  // ── IndicatorFormula (extra) ──────────────────────────────────────────────

  group('IndicatorFormula', () {
    test('FormulaNode.sma factory creates correct node', () {
      final node = FormulaNode.sma(50);
      expect(node.type, FormulaNodeType.sma);
      expect(node.period, 50);
      expect(node.isLeaf, isTrue);
    });

    test('FormulaNode.add creates non-leaf node', () {
      final left = FormulaNode.sma(50);
      final right = FormulaNode.ema(20);
      final added = FormulaNode.add(left, right);
      expect(added.type, FormulaNodeType.add);
      expect(added.isLeaf, isFalse);
    });

    test('FormulaNode equality', () {
      final n1 = FormulaNode.sma(20);
      final n2 = FormulaNode.sma(20);
      expect(n1, equals(n2));
    });
  });
}
