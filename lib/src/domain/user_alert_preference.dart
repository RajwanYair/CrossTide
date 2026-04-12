import 'package:equatable/equatable.dart';

/// Per-user preference for how alert notifications are delivered.
class UserAlertPreference extends Equatable {
  const UserAlertPreference({
    required this.userId,
    required this.enablePushNotifications,
    required this.enableInAppBanner,
    required this.quietHoursStart,
    required this.quietHoursEnd,
    required this.maxAlertsPerDay,
    this.preferredChannels = const [],
  });

  final String userId;
  final bool enablePushNotifications;
  final bool enableInAppBanner;

  /// Quiet hours start time as "HH:mm" (24-hour).
  final String quietHoursStart;

  /// Quiet hours end time as "HH:mm" (24-hour).
  final String quietHoursEnd;

  /// Maximum alerts to send per day (0 = unlimited).
  final int maxAlertsPerDay;

  /// Ordered list of preferred delivery channel names.
  final List<String> preferredChannels;

  UserAlertPreference copyWith({
    String? userId,
    bool? enablePushNotifications,
    bool? enableInAppBanner,
    String? quietHoursStart,
    String? quietHoursEnd,
    int? maxAlertsPerDay,
    List<String>? preferredChannels,
  }) => UserAlertPreference(
    userId: userId ?? this.userId,
    enablePushNotifications:
        enablePushNotifications ?? this.enablePushNotifications,
    enableInAppBanner: enableInAppBanner ?? this.enableInAppBanner,
    quietHoursStart: quietHoursStart ?? this.quietHoursStart,
    quietHoursEnd: quietHoursEnd ?? this.quietHoursEnd,
    maxAlertsPerDay: maxAlertsPerDay ?? this.maxAlertsPerDay,
    preferredChannels: preferredChannels ?? this.preferredChannels,
  );

  @override
  List<Object?> get props => [
    userId,
    enablePushNotifications,
    enableInAppBanner,
    quietHoursStart,
    quietHoursEnd,
    maxAlertsPerDay,
    preferredChannels,
  ];
}
