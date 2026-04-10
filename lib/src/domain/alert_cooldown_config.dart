import 'package:equatable/equatable.dart';

/// Cooldown scope determines whether cooldown is per-ticker or global.
enum CooldownScope { perTicker, perAlertType, global }

/// Configuration for alert cooldown and deduplication windows.
class AlertCooldownConfig extends Equatable {
  const AlertCooldownConfig({
    required this.cooldownDuration,
    required this.scope,
    this.maxAlertsPerWindow = 5,
    this.windowDuration = const Duration(hours: 1),
    this.suppressRepeatsWithinWindow = true,
  }) : assert(maxAlertsPerWindow > 0, 'maxAlertsPerWindow must be > 0');

  final Duration cooldownDuration;
  final CooldownScope scope;
  final int maxAlertsPerWindow;
  final Duration windowDuration;
  final bool suppressRepeatsWithinWindow;

  /// Default balanced cooldown: 1 hour, per-ticker, max 5 per hour.
  static const AlertCooldownConfig balanced = AlertCooldownConfig(
    cooldownDuration: Duration(hours: 1),
    scope: CooldownScope.perTicker,
  );

  /// Aggressive cooldown: 15 minutes, max 10 per hour.
  static const AlertCooldownConfig aggressive = AlertCooldownConfig(
    cooldownDuration: Duration(minutes: 15),
    scope: CooldownScope.perTicker,
    maxAlertsPerWindow: 10,
  );

  /// Conservative cooldown: 24 hours, max 2 per day.
  static const AlertCooldownConfig conservative = AlertCooldownConfig(
    cooldownDuration: Duration(hours: 24),
    scope: CooldownScope.perTicker,
    maxAlertsPerWindow: 2,
    windowDuration: Duration(hours: 24),
  );

  /// Whether the given fired count exceeds the window limit.
  bool isWindowExhausted(int firedCount) => firedCount >= maxAlertsPerWindow;

  /// Whether the elapsed time is within the cooldown window.
  bool isInCooldown(Duration elapsed) => elapsed < cooldownDuration;

  AlertCooldownConfig withCooldown(Duration newCooldown) => AlertCooldownConfig(
    cooldownDuration: newCooldown,
    scope: scope,
    maxAlertsPerWindow: maxAlertsPerWindow,
    windowDuration: windowDuration,
    suppressRepeatsWithinWindow: suppressRepeatsWithinWindow,
  );

  @override
  List<Object?> get props => [
    cooldownDuration,
    scope,
    maxAlertsPerWindow,
    windowDuration,
    suppressRepeatsWithinWindow,
  ];
}
