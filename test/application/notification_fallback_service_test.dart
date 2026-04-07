import 'package:cross_tide/src/application/notification_fallback_service.dart';
import 'package:cross_tide/src/application/notification_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:logger/logger.dart';

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

/// Succeeds on every call and records invocations.
class _SucceedingService implements INotificationService {
  int initCalls = 0;
  int crossUpCalls = 0;
  int priceTargetCalls = 0;
  int pctMoveCalls = 0;
  int volumeSpikeCalls = 0;
  int michoBuyCalls = 0;
  int michoSellCalls = 0;
  int consensusBuyCalls = 0;
  int consensusSellCalls = 0;
  int cancelAllCalls = 0;

  @override
  Future<void> initialize({void Function(String?)? onTap}) async {
    initCalls++;
  }

  @override
  Future<void> showCrossUpAlert({
    required String ticker,
    required double close,
    required double sma200,
  }) async {
    crossUpCalls++;
  }

  @override
  Future<void> showPriceTargetAlert({
    required String ticker,
    required double close,
    required double target,
  }) async {
    priceTargetCalls++;
  }

  @override
  Future<void> showPctMoveAlert({
    required String ticker,
    required double close,
    required double prevClose,
    required double thresholdPct,
  }) async {
    pctMoveCalls++;
  }

  @override
  Future<void> showVolumeSpikeAlert({
    required String ticker,
    required double volume,
    required int avgVolume,
    required double ratio,
  }) async {
    volumeSpikeCalls++;
  }

  @override
  Future<void> showMichoBuyAlert({
    required String ticker,
    required double close,
    required double sma150,
  }) async {
    michoBuyCalls++;
  }

  @override
  Future<void> showMichoSellAlert({
    required String ticker,
    required double close,
    required double sma150,
  }) async {
    michoSellCalls++;
  }

  @override
  Future<void> showConsensusBuyAlert({
    required String ticker,
    required double close,
    required String description,
  }) async {
    consensusBuyCalls++;
  }

  @override
  Future<void> showConsensusSellAlert({
    required String ticker,
    required double close,
    required String description,
  }) async {
    consensusSellCalls++;
  }

  @override
  Future<void> cancelAll() async {
    cancelAllCalls++;
  }
}

/// Always throws on every call.
class _FailingService implements INotificationService {
  int initCalls = 0;
  int showCalls = 0;
  int cancelAllCalls = 0;

  @override
  Future<void> initialize({void Function(String?)? onTap}) async {
    initCalls++;
    throw Exception('init failed');
  }

  @override
  Future<void> showCrossUpAlert({
    required String ticker,
    required double close,
    required double sma200,
  }) async {
    showCalls++;
    throw Exception('showCrossUpAlert failed');
  }

  @override
  Future<void> showPriceTargetAlert({
    required String ticker,
    required double close,
    required double target,
  }) async {
    showCalls++;
    throw Exception('showPriceTargetAlert failed');
  }

  @override
  Future<void> showPctMoveAlert({
    required String ticker,
    required double close,
    required double prevClose,
    required double thresholdPct,
  }) async {
    showCalls++;
    throw Exception('showPctMoveAlert failed');
  }

  @override
  Future<void> showVolumeSpikeAlert({
    required String ticker,
    required double volume,
    required int avgVolume,
    required double ratio,
  }) async {
    showCalls++;
    throw Exception('showVolumeSpikeAlert failed');
  }

  @override
  Future<void> showMichoBuyAlert({
    required String ticker,
    required double close,
    required double sma150,
  }) async {
    showCalls++;
    throw Exception('showMichoBuyAlert failed');
  }

  @override
  Future<void> showMichoSellAlert({
    required String ticker,
    required double close,
    required double sma150,
  }) async {
    showCalls++;
    throw Exception('showMichoSellAlert failed');
  }

  @override
  Future<void> showConsensusBuyAlert({
    required String ticker,
    required double close,
    required String description,
  }) async {
    showCalls++;
    throw Exception('showConsensusBuyAlert failed');
  }

  @override
  Future<void> showConsensusSellAlert({
    required String ticker,
    required double close,
    required String description,
  }) async {
    showCalls++;
    throw Exception('showConsensusSellAlert failed');
  }

  @override
  Future<void> cancelAll() async {
    cancelAllCalls++;
    throw Exception('cancelAll failed');
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

NotificationFallbackService _make(List<INotificationService> chain) =>
    NotificationFallbackService(
      chain: chain,
      logger: Logger(printer: SimplePrinter(), level: Level.off),
    );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

void main() {
  group('NotificationFallbackService', () {
    test('first delegate succeeds → second delegate not called', () async {
      final first = _SucceedingService();
      final second = _SucceedingService();
      final svc = _make([first, second]);

      await svc.showCrossUpAlert(ticker: 'AAPL', close: 150, sma200: 140);

      expect(first.crossUpCalls, 1);
      expect(second.crossUpCalls, 0, reason: 'second should not be called');
    });

    test(
      'first delegate fails → second delegate called and succeeds',
      () async {
        final failing = _FailingService();
        final succeeding = _SucceedingService();
        final svc = _make([failing, succeeding]);

        await expectLater(
          svc.showCrossUpAlert(ticker: 'AAPL', close: 150, sma200: 140),
          completes,
        );

        expect(failing.showCalls, 1);
        expect(succeeding.crossUpCalls, 1);
      },
    );

    test('all delegates fail → no exception thrown (silent log)', () async {
      final svc = _make([_FailingService(), _FailingService()]);

      await expectLater(
        svc.showCrossUpAlert(ticker: 'AAPL', close: 150, sma200: 140),
        completes,
      );
    });

    test('empty chain → completes without error', () async {
      final svc = _make([]);
      await expectLater(
        svc.showCrossUpAlert(ticker: 'AAPL', close: 150, sma200: 140),
        completes,
      );
    });

    test('initialize calls all delegates regardless of failures', () async {
      final failing = _FailingService();
      final succeeding = _SucceedingService();
      final svc = _make([failing, succeeding]);

      await svc.initialize();

      expect(failing.initCalls, 1);
      expect(
        succeeding.initCalls,
        1,
        reason: 'initialize must attempt all delegates',
      );
    });

    test('showPriceTargetAlert fallback works', () async {
      final svc = _make([_FailingService(), _SucceedingService()]);
      await expectLater(
        svc.showPriceTargetAlert(ticker: 'MSFT', close: 300, target: 290),
        completes,
      );
    });

    test('showPctMoveAlert fallback works', () async {
      final svc = _make([_FailingService(), _SucceedingService()]);
      await expectLater(
        svc.showPctMoveAlert(
          ticker: 'TSLA',
          close: 200,
          prevClose: 190,
          thresholdPct: 5,
        ),
        completes,
      );
    });

    test('showVolumeSpikeAlert fallback works', () async {
      final svc = _make([_FailingService(), _SucceedingService()]);
      await expectLater(
        svc.showVolumeSpikeAlert(
          ticker: 'NVDA',
          volume: 50000000,
          avgVolume: 30000000,
          ratio: 1.67,
        ),
        completes,
      );
    });

    test('showMichoBuyAlert fallback works', () async {
      final svc = _make([_FailingService(), _SucceedingService()]);
      await expectLater(
        svc.showMichoBuyAlert(ticker: 'AMZN', close: 185, sma150: 170),
        completes,
      );
    });

    test('showMichoSellAlert fallback works', () async {
      final svc = _make([_FailingService(), _SucceedingService()]);
      await expectLater(
        svc.showMichoSellAlert(ticker: 'META', close: 490, sma150: 500),
        completes,
      );
    });

    test('cancelAll fallback works', () async {
      final svc = _make([_FailingService(), _SucceedingService()]);
      await expectLater(svc.cancelAll(), completes);
    });

    test('first delegate fails on cancelAll → second called', () async {
      final failing = _FailingService();
      final succeeding = _SucceedingService();
      final svc = _make([failing, succeeding]);

      await svc.cancelAll();

      expect(failing.cancelAllCalls, 1);
      expect(succeeding.cancelAllCalls, 1);
    });
  });
}
