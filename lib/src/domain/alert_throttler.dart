/// Alert Throttler — cooldown logic to prevent alert flooding.
///
/// Ensures the same alert type for a ticker is not fired more than
/// once within a configurable cooldown window.
library;

import 'package:equatable/equatable.dart';

/// Record of a fired alert for throttling purposes.
class AlertFiring extends Equatable {
  const AlertFiring({
    required this.ticker,
    required this.alertType,
    required this.firedAt,
  });

  final String ticker;
  final String alertType;
  final DateTime firedAt;

  @override
  List<Object?> get props => [ticker, alertType, firedAt];
}

/// Whether an alert should be suppressed or allowed.
class ThrottleDecision extends Equatable {
  const ThrottleDecision({
    required this.allowed,
    required this.reason,
    this.lastFiredAt,
    this.cooldownRemaining,
  });

  /// Whether the alert is allowed to fire.
  final bool allowed;

  /// Human-readable reason for the decision.
  final String reason;

  /// When the alert was last fired (null if never).
  final DateTime? lastFiredAt;

  /// Duration remaining in cooldown (null if allowed).
  final Duration? cooldownRemaining;

  @override
  List<Object?> get props => [allowed, reason, lastFiredAt, cooldownRemaining];
}

/// Stateless throttle evaluator — given history, decides whether to allow.
class AlertThrottler {
  const AlertThrottler({this.defaultCooldown = const Duration(hours: 1)});

  /// Default cooldown between same alert type + ticker firings.
  final Duration defaultCooldown;

  /// Check whether an alert should be allowed.
  ///
  /// [history] is the list of past firings for this ticker.
  /// [now] is the current timestamp.
  ThrottleDecision evaluate({
    required String ticker,
    required String alertType,
    required List<AlertFiring> history,
    required DateTime now,
    Duration? cooldown,
  }) {
    final cd = cooldown ?? defaultCooldown;

    // Find the most recent firing for this ticker + alertType
    DateTime? lastFired;
    for (final AlertFiring f in history) {
      if (f.ticker == ticker && f.alertType == alertType) {
        if (lastFired == null || f.firedAt.isAfter(lastFired)) {
          lastFired = f.firedAt;
        }
      }
    }

    if (lastFired == null) {
      return const ThrottleDecision(
        allowed: true,
        reason: 'No previous firing found.',
      );
    }

    final elapsed = now.difference(lastFired);
    if (elapsed >= cd) {
      return ThrottleDecision(
        allowed: true,
        reason: 'Cooldown elapsed.',
        lastFiredAt: lastFired,
      );
    }

    return ThrottleDecision(
      allowed: false,
      reason: 'Cooldown active.',
      lastFiredAt: lastFired,
      cooldownRemaining: cd - elapsed,
    );
  }

  /// Batch evaluate: check multiple alerts against history.
  Map<String, ThrottleDecision> evaluateBatch({
    required List<({String ticker, String alertType})> requests,
    required List<AlertFiring> history,
    required DateTime now,
    Duration? cooldown,
  }) {
    final results = <String, ThrottleDecision>{};
    for (final request in requests) {
      final key = '${request.ticker}:${request.alertType}';
      results[key] = evaluate(
        ticker: request.ticker,
        alertType: request.alertType,
        history: history,
        now: now,
        cooldown: cooldown,
      );
    }
    return results;
  }
}
