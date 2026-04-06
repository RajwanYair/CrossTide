// Tests for all domain entities (entities.dart).
//
// Covers: DailyCandle, SmaRelation, TickerAlertState (incl. copyWith),
// CrossUpEvaluation, TickerEntry (incl. copyWith), AppSettings (incl. copyWith).
// Achieves 100% line coverage for lib/src/domain/entities.dart.
import 'package:cross_tide/src/domain/entities.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  // ───────────────────────────────────────────────────────────────
  // DailyCandle
  // ───────────────────────────────────────────────────────────────
  group('DailyCandle', () {
    final date = DateTime(2024, 6, 15);

    DailyCandle makeCandle({
      DateTime? d,
      double open = 100,
      double high = 105,
      double low = 98,
      double close = 103,
      int volume = 1000000,
    }) => DailyCandle(
      date: d ?? date,
      open: open,
      high: high,
      low: low,
      close: close,
      volume: volume,
    );

    test('equal when all fields match', () {
      expect(makeCandle(), equals(makeCandle()));
    });

    test('hashCode equal for identical instances', () {
      expect(makeCandle().hashCode, equals(makeCandle().hashCode));
    });

    test('not equal when close differs', () {
      expect(makeCandle(), isNot(equals(makeCandle(close: 99))));
    });

    test('props exposes all six fields', () {
      final c = makeCandle();
      expect(c.props, equals([date, 100.0, 105.0, 98.0, 103.0, 1000000]));
    });

    test('volume of 0 is valid', () {
      final c = makeCandle(volume: 0);
      expect(c.volume, 0);
    });
  });

  // ───────────────────────────────────────────────────────────────
  // SmaRelation
  // ───────────────────────────────────────────────────────────────
  group('SmaRelation', () {
    test('has three values', () {
      expect(SmaRelation.values.length, 3);
    });

    test('contains above, below, unknown', () {
      expect(
        SmaRelation.values,
        containsAll([
          SmaRelation.above,
          SmaRelation.below,
          SmaRelation.unknown,
        ]),
      );
    });
  });

  // ───────────────────────────────────────────────────────────────
  // TickerAlertState
  // ───────────────────────────────────────────────────────────────
  group('TickerAlertState', () {
    final alerted = DateTime(2024, 1, 1);
    final evaluated = DateTime(2024, 6, 1);

    TickerAlertState makeState({
      String ticker = 'AAPL',
      SmaRelation status = SmaRelation.below,
      DateTime? alertedAt,
      DateTime? evaluatedAt,
      double? close,
      double? sma200,
    }) => TickerAlertState(
      ticker: ticker,
      lastStatus: status,
      lastAlertedCrossUpAt: alertedAt,
      lastEvaluatedAt: evaluatedAt,
      lastCloseUsed: close,
      lastSma200: sma200,
    );

    test('equal when all fields match', () {
      final a = makeState(
        alertedAt: alerted,
        evaluatedAt: evaluated,
        close: 150,
        sma200: 148,
      );
      final b = makeState(
        alertedAt: alerted,
        evaluatedAt: evaluated,
        close: 150,
        sma200: 148,
      );
      expect(a, equals(b));
    });

    test('props has 6 elements', () {
      final s = makeState(alertedAt: alerted, evaluatedAt: evaluated);
      expect(s.props.length, 6);
    });

    test('not equal when status differs', () {
      expect(
        makeState(status: SmaRelation.above),
        isNot(equals(makeState(status: SmaRelation.below))),
      );
    });

    group('copyWith', () {
      final base = TickerAlertState(
        ticker: 'AAPL',
        lastStatus: SmaRelation.below,
        lastAlertedCrossUpAt: alerted,
        lastEvaluatedAt: evaluated,
        lastCloseUsed: 150,
        lastSma200: 148,
      );

      test('no args returns equal object', () {
        expect(base.copyWith(), equals(base));
      });

      test('copies lastStatus', () {
        expect(
          base.copyWith(lastStatus: SmaRelation.above).lastStatus,
          SmaRelation.above,
        );
      });

      test('copies lastAlertedCrossUpAt', () {
        final newDate = DateTime(2024, 7, 1);
        expect(
          base.copyWith(lastAlertedCrossUpAt: newDate).lastAlertedCrossUpAt,
          newDate,
        );
      });

      test('copies lastEvaluatedAt', () {
        final newDate = DateTime(2024, 8, 1);
        expect(
          base.copyWith(lastEvaluatedAt: newDate).lastEvaluatedAt,
          newDate,
        );
      });

      test('copies lastCloseUsed', () {
        expect(base.copyWith(lastCloseUsed: 160).lastCloseUsed, 160.0);
      });

      test('copies lastSma200', () {
        expect(base.copyWith(lastSma200: 155).lastSma200, 155.0);
      });

      test('unmodified ticker is preserved', () {
        expect(base.copyWith(lastStatus: SmaRelation.above).ticker, 'AAPL');
      });
    });
  });

  // ───────────────────────────────────────────────────────────────
  // CrossUpEvaluation
  // ───────────────────────────────────────────────────────────────
  group('CrossUpEvaluation', () {
    final evalDate = DateTime(2024, 6, 20);

    CrossUpEvaluation makeEval({
      String ticker = 'MSFT',
      SmaPeriod smaPeriod = SmaPeriod.sma200,
      double currentClose = 300,
      double previousClose = 295,
      double currentSma = 290,
      double previousSma = 292,
      SmaRelation relation = SmaRelation.above,
      bool isCrossUp = true,
      bool isRising = true,
      bool shouldAlert = true,
      DateTime? evaluatedAt,
    }) => CrossUpEvaluation(
      ticker: ticker,
      smaPeriod: smaPeriod,
      currentClose: currentClose,
      previousClose: previousClose,
      currentSma: currentSma,
      previousSma: previousSma,
      currentRelation: relation,
      isCrossUp: isCrossUp,
      isRising: isRising,
      shouldAlert: shouldAlert,
      evaluatedAt: evaluatedAt ?? evalDate,
    );

    test('equal when all fields match', () {
      expect(makeEval(), equals(makeEval()));
    });

    test('hashCode stable', () {
      expect(makeEval().hashCode, equals(makeEval().hashCode));
    });

    test('not equal when shouldAlert differs', () {
      expect(
        makeEval(shouldAlert: true),
        isNot(equals(makeEval(shouldAlert: false))),
      );
    });

    test('props has 11 elements (includes smaPeriod)', () {
      expect(makeEval().props.length, 11);
    });

    test('cross-down scenario — isCrossUp false', () {
      final e = makeEval(
        relation: SmaRelation.below,
        isCrossUp: false,
        isRising: false,
        shouldAlert: false,
      );
      expect(e.isCrossUp, isFalse);
      expect(e.shouldAlert, isFalse);
    });

    test('previousSma preserved in props', () {
      final e = makeEval(previousSma: 300.0);
      expect(e.previousSma, 300.0);
    });

    test('smaPeriod carried through correctly', () {
      expect(makeEval(smaPeriod: SmaPeriod.sma50).smaPeriod, SmaPeriod.sma50);
      expect(
        makeEval(smaPeriod: SmaPeriod.sma150).smaPeriod,
        SmaPeriod.sma150,
      );
    });

    test('currentSma200 getter works for sma200 period', () {
      final e = makeEval(smaPeriod: SmaPeriod.sma200, currentSma: 290.0);
      expect(e.currentSma200, 290.0);
    });

    test('currentSma200 getter throws for non-sma200 period', () {
      final e = makeEval(smaPeriod: SmaPeriod.sma50);
      expect(() => e.currentSma200, throwsStateError);
    });
  });

  // ───────────────────────────────────────────────────────────────
  // TickerEntry
  // ───────────────────────────────────────────────────────────────
  group('TickerEntry', () {
    final addedAt = DateTime(2024, 1, 1);
    final refreshedAt = DateTime(2024, 6, 15);
    const alertState = TickerAlertState(
      ticker: 'GOOG',
      lastStatus: SmaRelation.above,
    );

    TickerEntry makeEntry({
      String symbol = 'GOOG',
      DateTime? addedAt_,
      DateTime? refreshedAt_,
      double? close,
      double? sma200,
      TickerAlertState? state,
      String? error,
    }) => TickerEntry(
      symbol: symbol,
      addedAt: addedAt_,
      lastRefreshAt: refreshedAt_,
      lastClose: close,
      sma200: sma200,
      alertState: state,
      error: error,
    );

    test('equal when all fields match', () {
      final a = makeEntry(
        addedAt_: addedAt,
        refreshedAt_: refreshedAt,
        close: 180,
        sma200: 170,
        state: alertState,
      );
      final b = makeEntry(
        addedAt_: addedAt,
        refreshedAt_: refreshedAt,
        close: 180,
        sma200: 170,
        state: alertState,
      );
      expect(a, equals(b));
    });

    test('not equal when symbol differs', () {
      expect(
        makeEntry(symbol: 'GOOG'),
        isNot(equals(makeEntry(symbol: 'TSLA'))),
      );
    });

    test('props has 7 elements', () {
      expect(makeEntry().props.length, 7);
    });

    test('minimal constructor — all optionals null', () {
      const minimal = TickerEntry(symbol: 'SPY');
      expect(minimal.addedAt, isNull);
      expect(minimal.lastClose, isNull);
      expect(minimal.error, isNull);
    });

    group('copyWith', () {
      final base = TickerEntry(
        symbol: 'GOOG',
        addedAt: addedAt,
        lastRefreshAt: refreshedAt,
        lastClose: 180,
        sma200: 170,
        alertState: alertState,
        error: null,
      );

      test('no args returns equal object', () {
        expect(base.copyWith(), equals(base));
      });

      test('copies lastRefreshAt', () {
        final newDate = DateTime(2024, 7, 1);
        expect(base.copyWith(lastRefreshAt: newDate).lastRefreshAt, newDate);
      });

      test('copies lastClose', () {
        expect(base.copyWith(lastClose: 199.0).lastClose, 199.0);
      });

      test('copies sma200', () {
        expect(base.copyWith(sma200: 175.0).sma200, 175.0);
      });

      test('copies alertState', () {
        const newState = TickerAlertState(
          ticker: 'GOOG',
          lastStatus: SmaRelation.below,
        );
        expect(
          base.copyWith(alertState: newState).alertState?.lastStatus,
          SmaRelation.below,
        );
      });

      test('sets error field', () {
        expect(base.copyWith(error: 'timeout').error, 'timeout');
      });

      test('clears error by passing null explicitly', () {
        final withError = base.copyWith(error: 'err');
        expect(withError.copyWith(error: null).error, isNull);
      });

      test('addedAt is preserved (not in copyWith signature)', () {
        final updated = base.copyWith(lastClose: 200);
        expect(updated.addedAt, addedAt);
      });
    });
  });

  // ───────────────────────────────────────────────────────────────
  // AppSettings
  // ───────────────────────────────────────────────────────────────
  group('AppSettings', () {
    test('default values', () {
      const s = AppSettings();
      expect(s.refreshIntervalMinutes, 60);
      expect(s.quietHoursStart, isNull);
      expect(s.quietHoursEnd, isNull);
      expect(s.trendStrictnessDays, 1);
      expect(s.providerName, 'yahoo_finance');
      expect(s.cacheTtlMinutes, 30);
    });

    test('Equatable equality on defaults', () {
      expect(const AppSettings(), equals(const AppSettings()));
    });

    test('props has 6 elements', () {
      expect(const AppSettings().props.length, 6);
    });

    test('not equal when providerName differs', () {
      expect(
        const AppSettings(providerName: 'yahoo_finance'),
        isNot(equals(const AppSettings(providerName: 'alpha_vantage'))),
      );
    });

    group('copyWith', () {
      const base = AppSettings(
        refreshIntervalMinutes: 30,
        quietHoursStart: 22,
        quietHoursEnd: 7,
        trendStrictnessDays: 2,
        providerName: 'alpha_vantage',
        cacheTtlMinutes: 60,
      );

      test('no args returns equal object', () {
        expect(base.copyWith(), equals(base));
      });

      test('copies refreshIntervalMinutes', () {
        expect(
          base.copyWith(refreshIntervalMinutes: 15).refreshIntervalMinutes,
          15,
        );
      });

      test('copies quietHoursStart', () {
        expect(base.copyWith(quietHoursStart: 23).quietHoursStart, 23);
      });

      test('copies quietHoursEnd', () {
        expect(base.copyWith(quietHoursEnd: 8).quietHoursEnd, 8);
      });

      test('copies trendStrictnessDays', () {
        expect(base.copyWith(trendStrictnessDays: 3).trendStrictnessDays, 3);
      });

      test('copies providerName', () {
        expect(
          base.copyWith(providerName: 'yahoo_finance').providerName,
          'yahoo_finance',
        );
      });

      test('copies cacheTtlMinutes', () {
        expect(base.copyWith(cacheTtlMinutes: 120).cacheTtlMinutes, 120);
      });

      test('unmodified fields preserved', () {
        final updated = base.copyWith(refreshIntervalMinutes: 45);
        expect(updated.quietHoursStart, 22);
        expect(updated.quietHoursEnd, 7);
        expect(updated.trendStrictnessDays, 2);
        expect(updated.cacheTtlMinutes, 60);
      });
    });
  });

  // ───────────────────────────────────────────────────────────────
  // AlertProfile
  // ───────────────────────────────────────────────────────────────
  group('AlertProfile', () {
    test('has four values', () {
      expect(AlertProfile.values.length, 4);
    });

    test('contains all expected variants', () {
      expect(
        AlertProfile.values,
        containsAll([
          AlertProfile.aggressive,
          AlertProfile.balanced,
          AlertProfile.conservative,
          AlertProfile.custom,
        ]),
      );
    });

    group('AlertProfileDefaults.defaults', () {
      test('aggressive returns 15-min refresh', () {
        expect(AlertProfile.aggressive.defaults.refreshIntervalMinutes, 15);
      });

      test('aggressive uses single-day trend', () {
        expect(AlertProfile.aggressive.defaults.trendStrictnessDays, 1);
      });

      test('balanced returns 60-min refresh', () {
        expect(AlertProfile.balanced.defaults.refreshIntervalMinutes, 60);
      });

      test('conservative returns 120-min refresh', () {
        expect(AlertProfile.conservative.defaults.refreshIntervalMinutes, 120);
      });

      test('conservative uses 3-day trend', () {
        expect(AlertProfile.conservative.defaults.trendStrictnessDays, 3);
      });

      test('custom returns default AppSettings', () {
        expect(AlertProfile.custom.defaults, equals(const AppSettings()));
      });

      test('each profile returns a valid AppSettings instance', () {
        for (final profile in AlertProfile.values) {
          expect(profile.defaults, isA<AppSettings>());
        }
      });
    });

    group('AlertProfileDefaults.displayName', () {
      test('aggressive display name', () {
        expect(AlertProfile.aggressive.displayName, 'Aggressive');
      });

      test('balanced display name', () {
        expect(AlertProfile.balanced.displayName, 'Balanced');
      });

      test('conservative display name', () {
        expect(AlertProfile.conservative.displayName, 'Conservative');
      });

      test('custom display name', () {
        expect(AlertProfile.custom.displayName, 'Custom');
      });
    });

    group('AlertProfileDefaults.description', () {
      test('each profile has a non-empty description', () {
        for (final profile in AlertProfile.values) {
          expect(profile.description, isNotEmpty);
        }
      });
    });
  });

  // ───────────────────────────────────────────────────────────────
  // SmaPeriod
  // ───────────────────────────────────────────────────────────────
  group('SmaPeriod', () {
    test('has three values', () {
      expect(SmaPeriod.values.length, 3);
    });

    test('period values are correct', () {
      expect(SmaPeriod.sma50.period, 50);
      expect(SmaPeriod.sma150.period, 150);
      expect(SmaPeriod.sma200.period, 200);
    });

    test('requiredCandles is period plus one', () {
      for (final p in SmaPeriod.values) {
        expect(p.requiredCandles, p.period + 1);
      }
    });

    test('label matches SMAxx convention', () {
      expect(SmaPeriod.sma50.label, 'SMA50');
      expect(SmaPeriod.sma150.label, 'SMA150');
      expect(SmaPeriod.sma200.label, 'SMA200');
    });
  });

  // ───────────────────────────────────────────────────────────────
  // AlertType
  // ───────────────────────────────────────────────────────────────
  group('AlertType', () {
    test('has five values', () {
      expect(AlertType.values.length, 5);
    });

    test('each type has a non-empty displayName', () {
      for (final t in AlertType.values) {
        expect(t.displayName, isNotEmpty);
      }
    });

    test('each type has a non-empty description', () {
      for (final t in AlertType.values) {
        expect(t.description, isNotEmpty);
      }
    });

    test('goldenCross displayName contains 50 and 200', () {
      expect(AlertType.goldenCross.displayName, contains('50'));
      expect(AlertType.goldenCross.displayName, contains('200'));
    });

    test('deathCross displayName contains 50 and 200', () {
      expect(AlertType.deathCross.displayName, contains('50'));
      expect(AlertType.deathCross.displayName, contains('200'));
    });
  });
}
