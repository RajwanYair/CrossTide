/// Alert Cooldown Manager — Pure domain logic.
///
/// Enforces a minimum cooldown period between alerts for the same
/// ticker + method combination to prevent alert fatigue.
library;

import 'package:equatable/equatable.dart';

/// Records when an alert was last fired for a ticker + method pair.
class AlertCooldownEntry extends Equatable {
  const AlertCooldownEntry({
    required this.ticker,
    required this.methodName,
    required this.lastFiredAt,
    required this.cooldownMinutes,
  });

  final String ticker;
  final String methodName;
  final DateTime lastFiredAt;

  /// Cooldown duration in minutes. Default: 240 (4 hours).
  final int cooldownMinutes;

  /// Whether the cooldown has elapsed as of [now].
  bool canFireAt(DateTime now) {
    final Duration elapsed = now.difference(lastFiredAt);
    return elapsed.inMinutes >= cooldownMinutes;
  }

  /// Minutes remaining until the cooldown expires. 0 if already elapsed.
  int minutesRemaining(DateTime now) {
    final int elapsed = now.difference(lastFiredAt).inMinutes;
    final int remaining = cooldownMinutes - elapsed;
    return remaining > 0 ? remaining : 0;
  }

  @override
  List<Object?> get props => [ticker, methodName, lastFiredAt, cooldownMinutes];
}

/// Manages alert cooldowns across multiple ticker/method pairs.
class AlertCooldownManager {
  const AlertCooldownManager();

  /// Default cooldown: 4 hours (240 minutes).
  static const int defaultCooldownMinutes = 240;

  /// Check if an alert can fire, given the current cooldown entries.
  bool canFire({
    required String ticker,
    required String methodName,
    required List<AlertCooldownEntry> entries,
    required DateTime now,
  }) {
    for (final AlertCooldownEntry entry in entries) {
      if (entry.ticker == ticker && entry.methodName == methodName) {
        return entry.canFireAt(now);
      }
    }
    // No entry found — first alert, always allowed.
    return true;
  }

  /// Create or update a cooldown entry after an alert fires.
  AlertCooldownEntry recordFire({
    required String ticker,
    required String methodName,
    required DateTime firedAt,
    int cooldownMinutes = defaultCooldownMinutes,
  }) {
    return AlertCooldownEntry(
      ticker: ticker,
      methodName: methodName,
      lastFiredAt: firedAt,
      cooldownMinutes: cooldownMinutes,
    );
  }

  /// Remove expired cooldown entries (housekeeping).
  List<AlertCooldownEntry> pruneExpired(
    List<AlertCooldownEntry> entries,
    DateTime now,
  ) {
    return entries.where((AlertCooldownEntry e) => !e.canFireAt(now)).toList();
  }
}
