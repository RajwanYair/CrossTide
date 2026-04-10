import 'package:equatable/equatable.dart';

/// Specifies the intended purpose of an alert delivery window.
enum DeliveryWindowType {
  /// Suppress all non-critical alerts (user's quiet hours).
  quietHours,

  /// Preferred window for batched alert delivery.
  activeHours,

  /// Critical alerts bypass all suppression windows.
  emergency,

  /// User-defined custom window.
  custom,
}

/// Defines a recurring time window for alert delivery or suppression.
///
/// Times are represented as minutes from midnight in the user's local timezone.
class AlertDeliveryWindow extends Equatable {
  const AlertDeliveryWindow({
    required this.windowType,
    required this.startMinuteOfDay,
    required this.endMinuteOfDay,
    required this.activeDaysOfWeek,
    this.label,
  });

  final DeliveryWindowType windowType;

  /// Start of window as minutes from midnight (0–1439).
  final int startMinuteOfDay;

  /// End of window as minutes from midnight (0–1439). May be < start
  /// when the window spans midnight.
  final int endMinuteOfDay;

  /// Days of week this window applies (1 = Monday, 7 = Sunday).
  final Set<int> activeDaysOfWeek;

  final String? label;

  /// Whether [minuteOfDay] falls inside this window.
  bool containsMinute(int minuteOfDay) {
    if (startMinuteOfDay <= endMinuteOfDay) {
      return minuteOfDay >= startMinuteOfDay && minuteOfDay <= endMinuteOfDay;
    }
    // Wraps midnight.
    return minuteOfDay >= startMinuteOfDay || minuteOfDay <= endMinuteOfDay;
  }

  /// Convenience: standard business-hours window (09:00–17:00, Mon–Fri).
  static const AlertDeliveryWindow businessHours = AlertDeliveryWindow(
    windowType: DeliveryWindowType.activeHours,
    startMinuteOfDay: 540,
    endMinuteOfDay: 1020,
    activeDaysOfWeek: {1, 2, 3, 4, 5},
    label: 'Business Hours',
  );

  /// Convenience: overnight quiet window (22:00–07:00, every day).
  static const AlertDeliveryWindow overnightQuiet = AlertDeliveryWindow(
    windowType: DeliveryWindowType.quietHours,
    startMinuteOfDay: 1320,
    endMinuteOfDay: 420,
    activeDaysOfWeek: {1, 2, 3, 4, 5, 6, 7},
    label: 'Overnight Quiet',
  );

  @override
  List<Object?> get props => [
    windowType,
    startMinuteOfDay,
    endMinuteOfDay,
    activeDaysOfWeek,
    label,
  ];
}
