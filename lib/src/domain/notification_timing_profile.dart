/// Notification Timing Profile — smart timing for notification delivery.
library;

import 'package:equatable/equatable.dart';

/// Named time-of-day window for notification engagement tracking.
enum EngagementWindow {
  /// Before 9:00 AM local time.
  earlyMorning,

  /// Market open (9:30–11:00 AM).
  marketOpen,

  /// Mid-session (11:00 AM–2:00 PM).
  midSession,

  /// Market close (2:00–4:00 PM).
  marketClose,

  /// After-hours (4:00–7:00 PM).
  afterHours,

  /// Evening (7:00 PM onwards).
  evening,
}

/// A single recorded interaction event with a notification.
class EngagementObservation extends Equatable {
  const EngagementObservation({
    required this.window,
    required this.engaged,
    required this.observedAt,
  });

  final EngagementWindow window;

  /// True when the user opened/tapped the notification; false when dismissed.
  final bool engaged;

  final DateTime observedAt;

  @override
  List<Object?> get props => [window, engaged, observedAt];
}

/// Inferred smart notification timing profile based on historical engagement.
///
/// The app records [EngagementObservation]s and derives [preferredWindows]
/// so notifications can be held until the user is most likely to engage.
class NotificationTimingProfile extends Equatable {
  const NotificationTimingProfile({
    required this.ticker,
    required this.preferredWindows,
    required this.observations,
    required this.enabled,
  });

  /// Profile is ticker-neutral (all tickers) when [ticker] is null.
  final String? ticker;

  /// Windows ranked by engagement rate; first entry is most preferred.
  final List<EngagementWindow> preferredWindows;

  final List<EngagementObservation> observations;

  /// When false, notifications are sent immediately without smart timing.
  final bool enabled;

  /// Returns a profile with the new [obs] appended to [observations].
  NotificationTimingProfile withObservation(EngagementObservation obs) =>
      NotificationTimingProfile(
        ticker: ticker,
        preferredWindows: preferredWindows,
        observations: [...observations, obs],
        enabled: enabled,
      );

  /// Derives preferred windows from engagement rate, highest first.
  static List<EngagementWindow> derivePreferred(
    List<EngagementObservation> observations,
  ) {
    final counts = <EngagementWindow, ({int total, int engaged})>{};
    for (final EngagementWindow w in EngagementWindow.values) {
      counts[w] = (total: 0, engaged: 0);
    }
    for (final EngagementObservation o in observations) {
      final prev = counts[o.window]!;
      counts[o.window] = (
        total: prev.total + 1,
        engaged: prev.engaged + (o.engaged ? 1 : 0),
      );
    }
    final sorted = EngagementWindow.values.toList()
      ..sort((EngagementWindow a, EngagementWindow b) {
        final ra = counts[a]!;
        final rb = counts[b]!;
        final rateA = ra.total == 0 ? 0.0 : ra.engaged / ra.total;
        final rateB = rb.total == 0 ? 0.0 : rb.engaged / rb.total;
        return rateB.compareTo(rateA);
      });
    return sorted;
  }

  @override
  List<Object?> get props => [ticker, preferredWindows, observations, enabled];
}
