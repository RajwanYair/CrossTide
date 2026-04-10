import 'package:equatable/equatable.dart';

/// Membership entry of a ticker within a peer group.
class PeerGroupMember extends Equatable {
  const PeerGroupMember({required this.ticker, required this.correlationScore});

  final String ticker;

  /// Pairwise correlation score relative to reference ticker (−1.0 to 1.0).
  final double correlationScore;

  @override
  List<Object?> get props => [ticker, correlationScore];
}

/// A named peer group with correlation-ranked members.
class TickerPeerGroup extends Equatable {
  const TickerPeerGroup({
    required this.referenceTicker,
    required this.groupName,
    required this.members,
    required this.updatedAt,
  });

  final String referenceTicker;
  final String groupName;

  /// Members sorted by descending correlation (most correlated first).
  final List<PeerGroupMember> members;

  final DateTime updatedAt;

  int get size => members.length;

  /// Returns the top N most correlated peers.
  List<PeerGroupMember> topPeers(int n) => members.take(n).toList();

  /// Returns the member with the highest correlation, or null if empty.
  PeerGroupMember? get closestPeer => members.isEmpty ? null : members.first;

  @override
  List<Object?> get props => [referenceTicker, groupName, members, updatedAt];
}
