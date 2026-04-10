import 'package:equatable/equatable.dart';

/// Reason a trading halt was triggered.
enum TradingHaltReason {
  circuitBreaker,
  newsHalt,
  regulatoryHalt,
  volatilityPause,
  technicalIssue,
  pendingNews,
  ipoHalt,
  other,
}

/// Current status of a trading halt.
enum TradingHaltStatus { active, resumed, cancelled }

/// A trading halt or circuit-breaker event for a symbol or market-wide.
class TradingHaltEvent extends Equatable {
  const TradingHaltEvent({
    required this.eventId,
    required this.symbol,
    required this.exchange,
    required this.reason,
    required this.haltedAt,
    required this.status,
    this.resumedAt,
    this.notes,
    this.isMarketWide = false,
  });

  final String eventId;

  /// Ticker symbol; empty string for market-wide halts.
  final String symbol;
  final String exchange;
  final TradingHaltReason reason;
  final DateTime haltedAt;
  final TradingHaltStatus status;

  /// When trading resumed; `null` if still halted.
  final DateTime? resumedAt;
  final String? notes;

  /// True if the halt affects the entire exchange (circuit breaker).
  final bool isMarketWide;

  bool get isActive => status == TradingHaltStatus.active;
  bool get hasResumed => status == TradingHaltStatus.resumed;
  bool get hasNotes => notes != null && notes!.isNotEmpty;

  /// Duration of the halt; `null` if still active.
  Duration? get haltDuration {
    if (resumedAt == null) return null;
    return resumedAt!.difference(haltedAt);
  }

  @override
  List<Object?> get props => [
    eventId,
    symbol,
    exchange,
    reason,
    haltedAt,
    status,
    resumedAt,
    notes,
    isMarketWide,
  ];
}
