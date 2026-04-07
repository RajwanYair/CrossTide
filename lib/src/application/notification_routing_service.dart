/// Notification Routing Service — application-layer orchestration.
///
/// Uses [NotificationChannelRanker] to select the best notification
/// channel based on current channel health and user preferences.
library;

import '../domain/domain.dart';

/// Orchestrates notification channel selection + fallback.
class NotificationRoutingService {
  const NotificationRoutingService({
    NotificationChannelRanker ranker = const NotificationChannelRanker(),
  }) : _ranker = ranker;

  final NotificationChannelRanker _ranker;

  /// Determine the preferred channel.  Returns `null` when all channels
  /// have zero effective score.
  RankedChannel? selectChannel(List<ChannelStatus> statuses) {
    final List<RankedChannel> ranked = _ranker.rank(statuses);
    if (ranked.isEmpty) return null;
    return ranked.first;
  }

  /// Return all channels ordered by descending priority.
  List<RankedChannel> rankAll(List<ChannelStatus> statuses) {
    return _ranker.rank(statuses);
  }
}
