import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AlertStateMachine', () {
    const machine = AlertStateMachine();

    test('transitions from below to above on cross-up alert', () {
      const previous = TickerAlertState(
        ticker: 'AAPL',
        lastStatus: SmaRelation.below,
      );

      final evaluation = CrossUpEvaluation(
        ticker: 'AAPL',
        smaPeriod: SmaPeriod.sma200,
        currentClose: 150.0,
        previousClose: 148.0,
        currentSma: 149.0,
        previousSma: 149.5,
        currentRelation: SmaRelation.above,
        isCrossUp: true,
        isRising: true,
        shouldAlert: true,
        evaluatedAt: DateTime(2024, 6, 15),
      );

      final newState = machine.transition(previous, evaluation);

      expect(newState.lastStatus, SmaRelation.above);
      expect(newState.lastAlertedCrossUpAt, DateTime(2024, 6, 15));
      expect(newState.lastCloseUsed, 150.0);
      expect(newState.lastSma200, 149.0);
    });

    test('stays above without updating alert date when no new alert', () {
      final previous = TickerAlertState(
        ticker: 'AAPL',
        lastStatus: SmaRelation.above,
        lastAlertedCrossUpAt: DateTime(2024, 6, 10),
      );

      final evaluation = CrossUpEvaluation(
        ticker: 'AAPL',
        smaPeriod: SmaPeriod.sma200,
        currentClose: 155.0,
        previousClose: 152.0,
        currentSma: 149.0,
        previousSma: 148.5,
        currentRelation: SmaRelation.above,
        isCrossUp: false,
        isRising: true,
        shouldAlert: false,
        evaluatedAt: DateTime(2024, 6, 16),
      );

      final newState = machine.transition(previous, evaluation);

      expect(newState.lastStatus, SmaRelation.above);
      // Alert date should stay the same (from previous cross-up)
      expect(newState.lastAlertedCrossUpAt, DateTime(2024, 6, 10));
      expect(newState.lastCloseUsed, 155.0);
    });

    test('transitions from above to below on cross-down', () {
      final previous = TickerAlertState(
        ticker: 'AAPL',
        lastStatus: SmaRelation.above,
        lastAlertedCrossUpAt: DateTime(2024, 6, 10),
      );

      final evaluation = CrossUpEvaluation(
        ticker: 'AAPL',
        smaPeriod: SmaPeriod.sma200,
        currentClose: 145.0,
        previousClose: 148.0,
        currentSma: 149.0,
        previousSma: 149.0,
        currentRelation: SmaRelation.below,
        isCrossUp: false,
        isRising: false,
        shouldAlert: false,
        evaluatedAt: DateTime(2024, 6, 20),
      );

      final newState = machine.transition(previous, evaluation);

      expect(newState.lastStatus, SmaRelation.below);
      // Alert date preserved from history
      expect(newState.lastAlertedCrossUpAt, DateTime(2024, 6, 10));
    });
  });

  group('AlertStateMachine - Quiet Hours', () {
    const machine = AlertStateMachine();

    test('same-day window: inside quiet hours', () {
      expect(
        machine.isInQuietHours(
          now: DateTime(2024, 1, 1, 23, 30),
          quietStart: 22,
          quietEnd: 7,
        ),
        isTrue,
      );
    });

    test('same-day window: outside quiet hours', () {
      expect(
        machine.isInQuietHours(
          now: DateTime(2024, 1, 1, 12, 0),
          quietStart: 22,
          quietEnd: 7,
        ),
        isFalse,
      );
    });

    test('overnight window: inside (late night)', () {
      expect(
        machine.isInQuietHours(
          now: DateTime(2024, 1, 1, 23, 30),
          quietStart: 22,
          quietEnd: 7,
        ),
        isTrue,
      );
    });

    test('overnight window: inside (early morning)', () {
      expect(
        machine.isInQuietHours(
          now: DateTime(2024, 1, 1, 5, 0),
          quietStart: 22,
          quietEnd: 7,
        ),
        isTrue,
      );
    });

    test('quiet hours disabled (null)', () {
      expect(
        machine.isInQuietHours(
          now: DateTime(2024, 1, 1, 23, 0),
          quietStart: null,
          quietEnd: null,
        ),
        isFalse,
      );
    });

    test('daytime window: 9-17, hour=12 → inside', () {
      expect(
        machine.isInQuietHours(
          now: DateTime(2024, 1, 1, 12, 0),
          quietStart: 9,
          quietEnd: 17,
        ),
        isTrue,
      );
    });

    test('daytime window: 9-17, hour=18 → outside', () {
      expect(
        machine.isInQuietHours(
          now: DateTime(2024, 1, 1, 18, 0),
          quietStart: 9,
          quietEnd: 17,
        ),
        isFalse,
      );
    });
  });

  group('AlertStateMachine - Idempotent Multi-Cycle', () {
    const machine = AlertStateMachine();

    test(
      'full cycle: below → cross-up alert → above → below → cross-up alert',
      () {
        // 1. Start below
        var state = const TickerAlertState(
          ticker: 'TSLA',
          lastStatus: SmaRelation.below,
        );

        // 2. Cross-up occurs → should alert
        final crossUp1 = CrossUpEvaluation(
          ticker: 'TSLA',
          smaPeriod: SmaPeriod.sma200,
          currentClose: 250.0,
          previousClose: 245.0,
          currentSma: 248.0,
          previousSma: 248.0,
          currentRelation: SmaRelation.above,
          isCrossUp: true,
          isRising: true,
          shouldAlert: true,
          evaluatedAt: DateTime(2024, 1, 10),
        );
        state = machine.transition(state, crossUp1);
        expect(state.lastStatus, SmaRelation.above);
        expect(state.lastAlertedCrossUpAt, DateTime(2024, 1, 10));

        // 3. Stays above → no alert
        final staysAbove = CrossUpEvaluation(
          ticker: 'TSLA',
          smaPeriod: SmaPeriod.sma200,
          currentClose: 260.0,
          previousClose: 255.0,
          currentSma: 249.0,
          previousSma: 248.5,
          currentRelation: SmaRelation.above,
          isCrossUp: false,
          isRising: true,
          shouldAlert: false,
          evaluatedAt: DateTime(2024, 1, 15),
        );
        state = machine.transition(state, staysAbove);
        expect(state.lastStatus, SmaRelation.above);
        expect(state.lastAlertedCrossUpAt, DateTime(2024, 1, 10));

        // 4. Crosses back down
        final crossDown = CrossUpEvaluation(
          ticker: 'TSLA',
          smaPeriod: SmaPeriod.sma200,
          currentClose: 240.0,
          previousClose: 249.0,
          currentSma: 250.0,
          previousSma: 249.5,
          currentRelation: SmaRelation.below,
          isCrossUp: false,
          isRising: false,
          shouldAlert: false,
          evaluatedAt: DateTime(2024, 2, 1),
        );
        state = machine.transition(state, crossDown);
        expect(state.lastStatus, SmaRelation.below);

        // 5. New cross-up → should alert AGAIN
        final crossUp2 = CrossUpEvaluation(
          ticker: 'TSLA',
          smaPeriod: SmaPeriod.sma200,
          currentClose: 255.0,
          previousClose: 248.0,
          currentSma: 250.0,
          previousSma: 250.0,
          currentRelation: SmaRelation.above,
          isCrossUp: true,
          isRising: true,
          shouldAlert: true,
          evaluatedAt: DateTime(2024, 2, 15),
        );
        state = machine.transition(state, crossUp2);
        expect(state.lastStatus, SmaRelation.above);
        expect(state.lastAlertedCrossUpAt, DateTime(2024, 2, 15));
      },
    );
  });
}
