/// Notification Fallback Service
///
/// Wraps a prioritised chain of [INotificationService] delegates.
/// Each public method tries delegates left-to-right and stops on first
/// success.  If all delegates throw, the error is logged and swallowed so
/// callers are never interrupted by notification failures.
library;

import 'package:logger/logger.dart';

import 'notification_service.dart';

/// Tries each delegate in [chain] in order; stops on first success.
///
/// Example usage (wiring primary + silent-log fallback):
/// ```dart
/// final svc = NotificationFallbackService(
///   chain: [LocalNotificationService(), SilentLogNotificationService()],
/// );
/// ```
class NotificationFallbackService implements INotificationService {
  NotificationFallbackService({
    required List<INotificationService> chain,
    Logger? logger,
  }) : _chain = List.unmodifiable(chain),
       _logger = logger ?? Logger();

  final List<INotificationService> _chain;
  final Logger _logger;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  Future<void> _tryChain(
    Future<void> Function(INotificationService svc) action,
    String tag,
  ) async {
    final errors = <Object>[];
    for (final svc in _chain) {
      try {
        await action(svc);
        return; // success — stop
      } catch (e) {
        errors.add(e);
        _logger.w(
          'NotificationFallbackService: $tag failed on '
          '${svc.runtimeType}: $e — trying next delegate',
        );
      }
    }
    _logger.e(
      'NotificationFallbackService: $tag exhausted all delegates. '
      'Errors: $errors',
    );
  }

  // ---------------------------------------------------------------------------
  // INotificationService
  // ---------------------------------------------------------------------------

  @override
  Future<void> initialize({void Function(String? payload)? onTap}) async {
    for (final svc in _chain) {
      try {
        await svc.initialize(onTap: onTap);
      } catch (e) {
        _logger.w(
          'NotificationFallbackService: initialize failed on '
          '${svc.runtimeType}: $e',
        );
      }
    }
  }

  @override
  Future<void> showCrossUpAlert({
    required String ticker,
    required double close,
    required double sma200,
  }) => _tryChain(
    (svc) => svc.showCrossUpAlert(ticker: ticker, close: close, sma200: sma200),
    'showCrossUpAlert($ticker)',
  );

  @override
  Future<void> showPriceTargetAlert({
    required String ticker,
    required double close,
    required double target,
  }) => _tryChain(
    (svc) =>
        svc.showPriceTargetAlert(ticker: ticker, close: close, target: target),
    'showPriceTargetAlert($ticker)',
  );

  @override
  Future<void> showPctMoveAlert({
    required String ticker,
    required double close,
    required double prevClose,
    required double thresholdPct,
  }) => _tryChain(
    (svc) => svc.showPctMoveAlert(
      ticker: ticker,
      close: close,
      prevClose: prevClose,
      thresholdPct: thresholdPct,
    ),
    'showPctMoveAlert($ticker)',
  );

  @override
  Future<void> showVolumeSpikeAlert({
    required String ticker,
    required double volume,
    required int avgVolume,
    required double ratio,
  }) => _tryChain(
    (svc) => svc.showVolumeSpikeAlert(
      ticker: ticker,
      volume: volume,
      avgVolume: avgVolume,
      ratio: ratio,
    ),
    'showVolumeSpikeAlert($ticker)',
  );

  @override
  Future<void> showMichoBuyAlert({
    required String ticker,
    required double close,
    required double sma150,
  }) => _tryChain(
    (svc) =>
        svc.showMichoBuyAlert(ticker: ticker, close: close, sma150: sma150),
    'showMichoBuyAlert($ticker)',
  );

  @override
  Future<void> showMichoSellAlert({
    required String ticker,
    required double close,
    required double sma150,
  }) => _tryChain(
    (svc) =>
        svc.showMichoSellAlert(ticker: ticker, close: close, sma150: sma150),
    'showMichoSellAlert($ticker)',
  );

  @override
  Future<void> cancelAll() => _tryChain((svc) => svc.cancelAll(), 'cancelAll');
}
