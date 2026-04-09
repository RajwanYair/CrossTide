/// Notification Sound Profile — per-ticker sound customization entity.
library;

import 'package:equatable/equatable.dart';

/// Sound types available for alerts.
enum AlertSoundType {
  /// System default notification sound.
  systemDefault,

  /// Short ding tone.
  ding,

  /// Three-note chime.
  chime,

  /// Gentle bell.
  bell,

  /// Vibration only (silent).
  vibrationOnly,

  /// No sound or vibration.
  silent,
}

/// Priority level that controls heads-up display and bypass of Do Not Disturb.
enum AlertSoundPriority {
  /// Standard notification; respects Do Not Disturb.
  normal,

  /// High priority; heads-up notification on Android.
  high,

  /// Critical; bypasses Do Not Disturb (requires OS permission).
  urgent,
}

/// Per-ticker sound and vibration configuration for alert notifications.
class NotificationSoundProfile extends Equatable {
  const NotificationSoundProfile({
    required this.ticker,
    required this.soundType,
    required this.priority,
    this.repeatCount = 1,
  }) : assert(repeatCount >= 1 && repeatCount <= 5,
            'repeatCount must be 1–5');

  /// Creates a silent profile for [ticker].
  factory NotificationSoundProfile.silent(String ticker) =>
      NotificationSoundProfile(
        ticker: ticker,
        soundType: AlertSoundType.silent,
        priority: AlertSoundPriority.normal,
      );

  /// Ticker symbol this profile applies to.
  final String ticker;

  /// Sound effect to play.
  final AlertSoundType soundType;

  /// Notification priority.
  final AlertSoundPriority priority;

  /// Number of times to repeat the sound (1–5).
  final int repeatCount;

  /// Returns true when the profile produces audible output.
  bool get isAudible =>
      soundType != AlertSoundType.silent &&
      soundType != AlertSoundType.vibrationOnly;

  @override
  List<Object?> get props => [ticker, soundType, priority, repeatCount];
}
