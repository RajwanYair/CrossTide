import 'package:equatable/equatable.dart';

/// Metrics collected for a single user session in the app.
class UserSessionMetric extends Equatable {
  /// Creates a [UserSessionMetric].
  const UserSessionMetric({
    required this.sessionId,
    required this.userId,
    required this.startedAt,
    required this.durationSeconds,
    required this.screenViewCount,
    required this.alertsReviewed,
  });

  /// Unique session identifier.
  final String sessionId;

  /// User identifier.
  final String userId;

  /// Session start timestamp.
  final DateTime startedAt;

  /// Total session duration in seconds.
  final int durationSeconds;

  /// Number of distinct screens viewed.
  final int screenViewCount;

  /// Number of alerts the user opened during this session.
  final int alertsReviewed;

  /// Returns `true` when the session lasted more than 5 minutes.
  bool get isLongSession => durationSeconds > 300;

  /// Returns `true` when the user engaged with at least one alert.
  bool get hasAlertEngagement => alertsReviewed > 0;

  /// Average seconds per screen view.
  double get avgSecondsPerScreen =>
      screenViewCount == 0 ? 0.0 : durationSeconds / screenViewCount;

  @override
  List<Object?> get props => [
    sessionId,
    userId,
    startedAt,
    durationSeconds,
    screenViewCount,
    alertsReviewed,
  ];
}
