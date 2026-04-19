/// Provider Circuit Breaker — Pure domain logic.
///
/// Implements the circuit breaker pattern for data provider reliability.
/// After [failureThreshold] consecutive failures, the circuit opens and
/// rejects requests for [resetTimeoutMinutes]. After the timeout, it
/// enters half-open state and allows a single probe request.
library;

import 'package:equatable/equatable.dart';

/// Circuit breaker states.
enum CircuitState { closed, open, halfOpen }

/// Immutable snapshot of a circuit breaker's state.
class CircuitBreakerSnapshot extends Equatable {
  const CircuitBreakerSnapshot({
    required this.providerId,
    required this.state,
    required this.consecutiveFailures,
    required this.lastFailureAt,
    required this.lastSuccessAt,
    required this.failureThreshold,
    required this.resetTimeoutMinutes,
  });

  factory CircuitBreakerSnapshot.initial({
    required String providerId,
    int failureThreshold = 5,
    int resetTimeoutMinutes = 10,
  }) {
    return CircuitBreakerSnapshot(
      providerId: providerId,
      state: CircuitState.closed,
      consecutiveFailures: 0,
      lastFailureAt: null,
      lastSuccessAt: null,
      failureThreshold: failureThreshold,
      resetTimeoutMinutes: resetTimeoutMinutes,
    );
  }

  final String providerId;
  final CircuitState state;
  final int consecutiveFailures;
  final DateTime? lastFailureAt;
  final DateTime? lastSuccessAt;
  final int failureThreshold;
  final int resetTimeoutMinutes;

  /// Whether the circuit currently allows requests.
  bool canAttempt(DateTime now) {
    switch (state) {
      case CircuitState.closed:
        return true;
      case CircuitState.halfOpen:
        return true;
      case CircuitState.open:
        if (lastFailureAt == null) return true;
        final Duration elapsed = now.difference(lastFailureAt!);
        return elapsed.inMinutes >= resetTimeoutMinutes;
    }
  }

  @override
  List<Object?> get props => [
    providerId,
    state,
    consecutiveFailures,
    lastFailureAt,
    lastSuccessAt,
    failureThreshold,
    resetTimeoutMinutes,
  ];
}

/// State machine for the circuit breaker pattern.
class CircuitBreakerEvaluator {
  const CircuitBreakerEvaluator();

  /// Transition after a successful request.
  CircuitBreakerSnapshot recordSuccess(
    CircuitBreakerSnapshot current,
    DateTime now,
  ) {
    return CircuitBreakerSnapshot(
      providerId: current.providerId,
      state: CircuitState.closed,
      consecutiveFailures: 0,
      lastFailureAt: current.lastFailureAt,
      lastSuccessAt: now,
      failureThreshold: current.failureThreshold,
      resetTimeoutMinutes: current.resetTimeoutMinutes,
    );
  }

  /// Transition after a failed request.
  CircuitBreakerSnapshot recordFailure(
    CircuitBreakerSnapshot current,
    DateTime now,
  ) {
    final int newFailures = current.consecutiveFailures + 1;
    final CircuitState newState;

    if (newFailures >= current.failureThreshold) {
      newState = CircuitState.open;
    } else if (current.state == CircuitState.halfOpen) {
      // Probe failed — re-open.
      newState = CircuitState.open;
    } else {
      newState = current.state;
    }

    return CircuitBreakerSnapshot(
      providerId: current.providerId,
      state: newState,
      consecutiveFailures: newFailures,
      lastFailureAt: now,
      lastSuccessAt: current.lastSuccessAt,
      failureThreshold: current.failureThreshold,
      resetTimeoutMinutes: current.resetTimeoutMinutes,
    );
  }

  /// Check and transition to half-open if timeout has elapsed.
  CircuitBreakerSnapshot checkTimeout(
    CircuitBreakerSnapshot current,
    DateTime now,
  ) {
    if (current.state != CircuitState.open) return current;
    if (!current.canAttempt(now)) return current;

    return CircuitBreakerSnapshot(
      providerId: current.providerId,
      state: CircuitState.halfOpen,
      consecutiveFailures: current.consecutiveFailures,
      lastFailureAt: current.lastFailureAt,
      lastSuccessAt: current.lastSuccessAt,
      failureThreshold: current.failureThreshold,
      resetTimeoutMinutes: current.resetTimeoutMinutes,
    );
  }
}
