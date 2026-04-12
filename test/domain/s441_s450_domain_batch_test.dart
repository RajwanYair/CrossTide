import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  // ── S441: UserInsightCard ─────────────────────────────────────────────────
  group('UserInsightCard', () {
    test('isActionable true when visible and high-priority', () {
      const UserInsightCard card = UserInsightCard(
        cardId: 'c1',
        type: InsightCardType.riskWarning,
        title: 'Concentration Risk',
        body: 'AAPL exceeds 25% threshold',
        priorityScore: 0.85,
      );
      expect(card.isWarning, isTrue);
      expect(card.isHighPriority, isTrue);
      expect(card.isActionable, isTrue);
      expect(card.isDismissed, isFalse);
    });

    test('isActionable false when dismissed', () {
      const UserInsightCard card = UserInsightCard(
        cardId: 'c2',
        type: InsightCardType.opportunity,
        title: 'Buy signal',
        body: 'RSI oversold',
        priorityScore: 0.90,
        isDismissed: true,
      );
      expect(card.isActionable, isFalse);
    });

    test('isHighPriority false when score < 0.7', () {
      const UserInsightCard card = UserInsightCard(
        cardId: 'c3',
        type: InsightCardType.reminder,
        title: 'Earnings next week',
        body: 'MSFT reports Q2 results',
        priorityScore: 0.50,
      );
      expect(card.isHighPriority, isFalse);
      expect(card.isActionable, isFalse);
    });

    test('equality', () {
      const UserInsightCard a = UserInsightCard(
        cardId: 'c1',
        type: InsightCardType.performance,
        title: 'Good week',
        body: 'Portfolio up 3%',
        priorityScore: 0.70,
      );
      const UserInsightCard b = UserInsightCard(
        cardId: 'c1',
        type: InsightCardType.performance,
        title: 'Good week',
        body: 'Portfolio up 3%',
        priorityScore: 0.70,
      );
      expect(a, equals(b));
    });
  });

  // ── S442: UserPreferenceProfile ───────────────────────────────────────────
  group('UserPreferenceProfile', () {
    test('hasExplicitTheme false for system preference', () {
      const UserPreferenceProfile profile = UserPreferenceProfile(
        userId: 'u1',
        colorScheme: ColorSchemePreference.system,
        defaultCurrency: 'USD',
        decimalPrecision: 2,
        showPercentages: true,
        compactNumbers: false,
      );
      expect(profile.hasExplicitTheme, isFalse);
      expect(profile.prefersDark, isFalse);
    });

    test('prefersDark true for dark scheme', () {
      const UserPreferenceProfile profile = UserPreferenceProfile(
        userId: 'u2',
        colorScheme: ColorSchemePreference.dark,
        defaultCurrency: 'EUR',
        decimalPrecision: 4,
        showPercentages: true,
        compactNumbers: true,
      );
      expect(profile.prefersDark, isTrue);
      expect(profile.hasExplicitTheme, isTrue);
    });

    test('prefersDark true for highContrast scheme', () {
      const UserPreferenceProfile profile = UserPreferenceProfile(
        userId: 'u3',
        colorScheme: ColorSchemePreference.highContrast,
        defaultCurrency: 'GBP',
        decimalPrecision: 2,
        showPercentages: false,
        compactNumbers: true,
      );
      expect(profile.prefersDark, isTrue);
    });

    test('equality', () {
      const UserPreferenceProfile a = UserPreferenceProfile(
        userId: 'u1',
        colorScheme: ColorSchemePreference.system,
        defaultCurrency: 'USD',
        decimalPrecision: 2,
        showPercentages: true,
        compactNumbers: false,
      );
      const UserPreferenceProfile b = UserPreferenceProfile(
        userId: 'u1',
        colorScheme: ColorSchemePreference.system,
        defaultCurrency: 'USD',
        decimalPrecision: 2,
        showPercentages: true,
        compactNumbers: false,
      );
      expect(a, equals(b));
    });
  });

  // ── S443: ChartAnnotationPreset ───────────────────────────────────────────
  group('ChartAnnotationPreset', () {
    test('isLine true for horizontalLine', () {
      const ChartAnnotationPreset preset = ChartAnnotationPreset(
        presetId: 'p1',
        name: 'Support',
        type: AnnotationPresetType.horizontalLine,
        colorHex: '00CC66',
        lineWidthPx: 1.5,
      );
      expect(preset.isLine, isTrue);
      expect(preset.isThickLine, isFalse);
      expect(preset.isDashed, isFalse);
    });

    test('isLine true for trendLine', () {
      const ChartAnnotationPreset preset = ChartAnnotationPreset(
        presetId: 'p2',
        name: 'Uptrend',
        type: AnnotationPresetType.trendLine,
        colorHex: 'FF8800',
        lineWidthPx: 2.0,
        isDashed: true,
      );
      expect(preset.isLine, isTrue);
      expect(preset.isThickLine, isTrue);
      expect(preset.isDashed, isTrue);
    });

    test('isLine false for textLabel', () {
      const ChartAnnotationPreset preset = ChartAnnotationPreset(
        presetId: 'p3',
        name: 'Event marker',
        type: AnnotationPresetType.textLabel,
        colorHex: '0000FF',
        lineWidthPx: 1.0,
      );
      expect(preset.isLine, isFalse);
    });

    test('equality', () {
      const ChartAnnotationPreset a = ChartAnnotationPreset(
        presetId: 'p1',
        name: 'Support',
        type: AnnotationPresetType.horizontalLine,
        colorHex: '00CC66',
        lineWidthPx: 1.5,
      );
      const ChartAnnotationPreset b = ChartAnnotationPreset(
        presetId: 'p1',
        name: 'Support',
        type: AnnotationPresetType.horizontalLine,
        colorHex: '00CC66',
        lineWidthPx: 1.5,
      );
      expect(a, equals(b));
    });
  });

  // ── S444: SearchHistoryEntry ──────────────────────────────────────────────
  group('SearchHistoryEntry', () {
    test('hasSelection true when ticker selected', () {
      final SearchHistoryEntry entry = SearchHistoryEntry(
        entryId: 'sh1',
        query: 'apple',
        searchedAt: DateTime(2025, 5, 1),
        resultCount: 5,
        selectedTicker: 'AAPL',
      );
      expect(entry.hasSelection, isTrue);
      expect(entry.hasResults, isTrue);
    });

    test('hasSelection false when no selection', () {
      final SearchHistoryEntry entry = SearchHistoryEntry(
        entryId: 'sh2',
        query: 'xyz',
        searchedAt: DateTime(2025, 5, 2),
        resultCount: 0,
      );
      expect(entry.hasSelection, isFalse);
      expect(entry.hasResults, isFalse);
    });

    test('equality', () {
      final SearchHistoryEntry a = SearchHistoryEntry(
        entryId: 'sh1',
        query: 'apple',
        searchedAt: DateTime(2025, 5, 1),
        resultCount: 5,
        selectedTicker: 'AAPL',
      );
      final SearchHistoryEntry b = SearchHistoryEntry(
        entryId: 'sh1',
        query: 'apple',
        searchedAt: DateTime(2025, 5, 1),
        resultCount: 5,
        selectedTicker: 'AAPL',
      );
      expect(a, equals(b));
    });
  });

  // ── S445: WatchlistQuickFilter ────────────────────────────────────────────
  group('WatchlistQuickFilter', () {
    test('hasSignalFilter true when requireBuySignal is set', () {
      const WatchlistQuickFilter filter = WatchlistQuickFilter(
        filterId: 'f1',
        label: 'BUY signals',
        minRsiThreshold: 30.0,
        maxRsiThreshold: 70.0,
        requireBuySignal: true,
        requireSellSignal: false,
      );
      expect(filter.hasSignalFilter, isTrue);
      expect(filter.hasSectorFilter, isFalse);
      expect(filter.rsiRange, closeTo(40.0, 0.01));
    });

    test('hasSectorFilter true when sector set', () {
      const WatchlistQuickFilter filter = WatchlistQuickFilter(
        filterId: 'f2',
        label: 'Tech only',
        minRsiThreshold: 0.0,
        maxRsiThreshold: 100.0,
        requireBuySignal: false,
        requireSellSignal: false,
        sectorFilter: 'Technology',
      );
      expect(filter.hasSectorFilter, isTrue);
      expect(filter.hasSignalFilter, isFalse);
    });

    test('equality', () {
      const WatchlistQuickFilter a = WatchlistQuickFilter(
        filterId: 'f1',
        label: 'BUY signals',
        minRsiThreshold: 30.0,
        maxRsiThreshold: 70.0,
        requireBuySignal: true,
        requireSellSignal: false,
      );
      const WatchlistQuickFilter b = WatchlistQuickFilter(
        filterId: 'f1',
        label: 'BUY signals',
        minRsiThreshold: 30.0,
        maxRsiThreshold: 70.0,
        requireBuySignal: true,
        requireSellSignal: false,
      );
      expect(a, equals(b));
    });
  });

  // ── S446: UserSessionMetric ───────────────────────────────────────────────
  group('UserSessionMetric', () {
    test('isLongSession true when duration > 300s', () {
      final UserSessionMetric metric = UserSessionMetric(
        sessionId: 'sess1',
        userId: 'u1',
        startedAt: DateTime(2025, 6, 1, 9, 0),
        durationSeconds: 600,
        screenViewCount: 12,
        alertsReviewed: 3,
      );
      expect(metric.isLongSession, isTrue);
      expect(metric.hasAlertEngagement, isTrue);
      expect(metric.avgSecondsPerScreen, closeTo(50.0, 0.01));
    });

    test('isLongSession false when duration <= 300s', () {
      final UserSessionMetric metric = UserSessionMetric(
        sessionId: 'sess2',
        userId: 'u2',
        startedAt: DateTime(2025, 6, 1, 10, 0),
        durationSeconds: 120,
        screenViewCount: 3,
        alertsReviewed: 0,
      );
      expect(metric.isLongSession, isFalse);
      expect(metric.hasAlertEngagement, isFalse);
    });

    test('avgSecondsPerScreen zero when no screens', () {
      final UserSessionMetric metric = UserSessionMetric(
        sessionId: 'sess3',
        userId: 'u3',
        startedAt: DateTime(2025, 6, 1),
        durationSeconds: 60,
        screenViewCount: 0,
        alertsReviewed: 0,
      );
      expect(metric.avgSecondsPerScreen, equals(0.0));
    });

    test('equality', () {
      final UserSessionMetric a = UserSessionMetric(
        sessionId: 'sess1',
        userId: 'u1',
        startedAt: DateTime(2025, 6, 1, 9, 0),
        durationSeconds: 300,
        screenViewCount: 6,
        alertsReviewed: 1,
      );
      final UserSessionMetric b = UserSessionMetric(
        sessionId: 'sess1',
        userId: 'u1',
        startedAt: DateTime(2025, 6, 1, 9, 0),
        durationSeconds: 300,
        screenViewCount: 6,
        alertsReviewed: 1,
      );
      expect(a, equals(b));
    });
  });

  // ── S447: FeatureUsageRecord ──────────────────────────────────────────────
  group('FeatureUsageRecord', () {
    test('isWidelyAdopted true when >= 100 users', () {
      final FeatureUsageRecord record = FeatureUsageRecord(
        featureId: 'consensus_engine',
        featureName: 'Consensus Engine',
        totalActivations: 5000,
        uniqueUsers: 150,
        lastActivatedAt: DateTime(2025, 4, 15),
      );
      expect(record.isWidelyAdopted, isTrue);
      expect(record.hasUsage, isTrue);
      expect(record.activationsPerUser, closeTo(33.33, 0.01));
    });

    test('isWidelyAdopted false when < 100 users', () {
      final FeatureUsageRecord record = FeatureUsageRecord(
        featureId: 'paper_trade',
        featureName: 'Paper Trading',
        totalActivations: 50,
        uniqueUsers: 20,
        lastActivatedAt: DateTime(2025, 4, 10),
        isExperimental: true,
      );
      expect(record.isWidelyAdopted, isFalse);
      expect(record.isExperimental, isTrue);
    });

    test('activationsPerUser zero when no users', () {
      final FeatureUsageRecord record = FeatureUsageRecord(
        featureId: 'new_feature',
        featureName: 'New Feature',
        totalActivations: 0,
        uniqueUsers: 0,
        lastActivatedAt: DateTime(2025, 1, 1),
      );
      expect(record.activationsPerUser, equals(0.0));
      expect(record.hasUsage, isFalse);
    });

    test('equality', () {
      final FeatureUsageRecord a = FeatureUsageRecord(
        featureId: 'feat1',
        featureName: 'Feature 1',
        totalActivations: 100,
        uniqueUsers: 50,
        lastActivatedAt: DateTime(2025, 4, 1),
      );
      final FeatureUsageRecord b = FeatureUsageRecord(
        featureId: 'feat1',
        featureName: 'Feature 1',
        totalActivations: 100,
        uniqueUsers: 50,
        lastActivatedAt: DateTime(2025, 4, 1),
      );
      expect(a, equals(b));
    });
  });

  // ── S448: AppRuntimeContext ───────────────────────────────────────────────
  group('AppRuntimeContext', () {
    test('isAndroid true for android platform', () {
      final AppRuntimeContext ctx = AppRuntimeContext(
        appVersion: '2.11.0',
        buildNumber: 25,
        platform: 'android',
        locale: 'en_US',
        isDebugBuild: false,
        capturedAt: DateTime(2025, 4, 13),
      );
      expect(ctx.isAndroid, isTrue);
      expect(ctx.isWindows, isFalse);
      expect(ctx.isReleaseBuild, isTrue);
    });

    test('isWindows true for windows platform', () {
      final AppRuntimeContext ctx = AppRuntimeContext(
        appVersion: '2.11.0',
        buildNumber: 25,
        platform: 'windows',
        locale: 'en_US',
        isDebugBuild: true,
        capturedAt: DateTime(2025, 4, 13),
      );
      expect(ctx.isWindows, isTrue);
      expect(ctx.isAndroid, isFalse);
      expect(ctx.isReleaseBuild, isFalse);
    });

    test('equality', () {
      final AppRuntimeContext a = AppRuntimeContext(
        appVersion: '2.11.0',
        buildNumber: 25,
        platform: 'android',
        locale: 'en_US',
        isDebugBuild: false,
        capturedAt: DateTime(2025, 4, 13),
      );
      final AppRuntimeContext b = AppRuntimeContext(
        appVersion: '2.11.0',
        buildNumber: 25,
        platform: 'android',
        locale: 'en_US',
        isDebugBuild: false,
        capturedAt: DateTime(2025, 4, 13),
      );
      expect(a, equals(b));
    });
  });

  // ── S449: SpreadSnapshot ──────────────────────────────────────────────────
  group('SpreadSnapshot', () {
    test('spread, midPrice, spreadBps computed correctly', () {
      final SpreadSnapshot snap = SpreadSnapshot(
        snapshotId: 'sp1',
        ticker: 'SPY',
        capturedAt: DateTime(2025, 4, 1),
        bidPrice: 499.98,
        askPrice: 500.02,
        bidSize: 500,
        askSize: 400,
      );
      expect(snap.spread, closeTo(0.04, 0.001));
      expect(snap.midPrice, closeTo(500.0, 0.001));
      expect(snap.spreadBps, closeTo(0.8, 0.1));
      expect(snap.isTight, isTrue);
    });

    test('isTight false for wide spread', () {
      final SpreadSnapshot snap = SpreadSnapshot(
        snapshotId: 'sp2',
        ticker: 'SMCO',
        capturedAt: DateTime(2025, 4, 2),
        bidPrice: 10.00,
        askPrice: 10.20,
        bidSize: 100,
        askSize: 100,
      );
      expect(snap.spreadBps, closeTo(197.0, 2.0));
      expect(snap.isTight, isFalse);
    });

    test('equality', () {
      final SpreadSnapshot a = SpreadSnapshot(
        snapshotId: 'sp1',
        ticker: 'SPY',
        capturedAt: DateTime(2025, 4, 1),
        bidPrice: 499.98,
        askPrice: 500.02,
        bidSize: 500,
        askSize: 400,
      );
      final SpreadSnapshot b = SpreadSnapshot(
        snapshotId: 'sp1',
        ticker: 'SPY',
        capturedAt: DateTime(2025, 4, 1),
        bidPrice: 499.98,
        askPrice: 500.02,
        bidSize: 500,
        askSize: 400,
      );
      expect(a, equals(b));
    });
  });

  // ── S450: DrawdownBudget ──────────────────────────────────────────────────
  group('DrawdownBudget', () {
    test('isBreached true when currentDrawdown > maxDrawdown', () {
      const DrawdownBudget budget = DrawdownBudget(
        portfolioId: 'p1',
        maxDrawdownPercent: 10.0,
        currentDrawdownPercent: 15.0,
        level: DrawdownBudgetLevel.critical,
      );
      expect(budget.isBreached, isTrue);
      expect(budget.remainingBudget, equals(0.0));
      expect(budget.isCritical, isTrue);
    });

    test('remainingBudget computed when not breached', () {
      const DrawdownBudget budget = DrawdownBudget(
        portfolioId: 'p2',
        maxDrawdownPercent: 15.0,
        currentDrawdownPercent: 8.0,
        level: DrawdownBudgetLevel.safe,
      );
      expect(budget.isBreached, isFalse);
      expect(budget.remainingBudget, closeTo(7.0, 0.01));
      expect(budget.isCritical, isFalse);
    });

    test('DrawdownBudgetLevel enum has 4 values', () {
      expect(DrawdownBudgetLevel.values.length, equals(4));
    });

    test('equality', () {
      const DrawdownBudget a = DrawdownBudget(
        portfolioId: 'p1',
        maxDrawdownPercent: 10.0,
        currentDrawdownPercent: 12.0,
        level: DrawdownBudgetLevel.warning,
      );
      const DrawdownBudget b = DrawdownBudget(
        portfolioId: 'p1',
        maxDrawdownPercent: 10.0,
        currentDrawdownPercent: 12.0,
        level: DrawdownBudgetLevel.warning,
      );
      expect(a, equals(b));
    });
  });
}
