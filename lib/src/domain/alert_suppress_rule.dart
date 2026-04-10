import 'package:equatable/equatable.dart';

/// Reason an alert suppression rule was triggered.
enum SuppressReason { quietHours, marketClosed, userMuted, cooldown, override }

/// A rule that suppresses alerts within a given time window.
class AlertSuppressRule extends Equatable {
  const AlertSuppressRule({
    required this.id,
    required this.label,
    required this.startHour,
    required this.endHour,
    required this.reason,
    this.daysOfWeek = const [1, 2, 3, 4, 5, 6, 7],
    this.isActive = true,
  }) : assert(startHour >= 0 && startHour <= 23, 'startHour 0–23'),
       assert(endHour >= 0 && endHour <= 23, 'endHour 0–23');

  final String id;
  final String label;

  /// Hour of day (0–23) when suppression begins.
  final int startHour;

  /// Hour of day (0–23) when suppression ends (exclusive).
  final int endHour;
  final SuppressReason reason;

  /// ISO weekday numbers (1=Mon … 7=Sun) when this rule applies.
  final List<int> daysOfWeek;
  final bool isActive;

  bool get coversWeekend => daysOfWeek.contains(6) || daysOfWeek.contains(7);

  bool get coversWeekdays => daysOfWeek.any((final int d) => d >= 1 && d <= 5);

  /// Whether this rule applies at a given [DateTime].
  bool appliesAt(DateTime dt) {
    if (!isActive) return false;
    if (!daysOfWeek.contains(dt.weekday)) return false;
    final int h = dt.hour;
    if (startHour <= endHour) {
      return h >= startHour && h < endHour;
    }
    // Overnight window (e.g. 22:00–06:00)
    return h >= startHour || h < endHour;
  }

  AlertSuppressRule activate() => AlertSuppressRule(
    id: id,
    label: label,
    startHour: startHour,
    endHour: endHour,
    reason: reason,
    daysOfWeek: daysOfWeek,
    isActive: true,
  );

  AlertSuppressRule deactivate() => AlertSuppressRule(
    id: id,
    label: label,
    startHour: startHour,
    endHour: endHour,
    reason: reason,
    daysOfWeek: daysOfWeek,
    isActive: false,
  );

  @override
  List<Object?> get props => [
    id,
    label,
    startHour,
    endHour,
    reason,
    daysOfWeek,
    isActive,
  ];
}
