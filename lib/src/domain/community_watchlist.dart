/// Community Watchlist — community-curated ticker lists with social metadata.
library;

import 'package:equatable/equatable.dart';

/// Tag applied to a community watchlist for discovery.
enum CommunityWatchlistTag {
  /// Primarily S&P 500 large-cap tickers.
  largeCap,

  /// Small- and mid-cap growth candidates.
  smallCap,

  /// Dividend income focus.
  dividendIncome,

  /// High-growth technology sector.
  techGrowth,

  /// Energy sector.
  energy,

  /// Healthcare and biotech.
  healthcare,

  /// Crypto-adjacent or fintech.
  crypto,

  /// ETF-focused basket.
  etfs,

  /// Momentum / breakout candidates.
  momentum,

  /// Mean-reversion candidates.
  meanReversion,
}

/// A user-submitted tag-and-vote on a community watchlist.
class CommunityWatchlistVote extends Equatable {
  const CommunityWatchlistVote({
    required this.userId,
    required this.isUpvote,
    required this.votedAt,
  });

  final String userId;
  final bool isUpvote;
  final DateTime votedAt;

  @override
  List<Object?> get props => [userId, isUpvote, votedAt];
}

/// A community-curated watchlist that any user can follow.
class CommunityWatchlist extends Equatable {
  const CommunityWatchlist({
    required this.id,
    required this.title,
    required this.description,
    required this.tickers,
    required this.tags,
    required this.votes,
    required this.createdBy,
    required this.createdAt,
    this.followerCount = 0,
  });

  final String id;
  final String title;
  final String description;

  /// Ticker symbols in this watchlist.
  final List<String> tickers;

  /// Descriptive tags for search/filter.
  final List<CommunityWatchlistTag> tags;

  final List<CommunityWatchlistVote> votes;

  /// Pseudonymous creator identifier.
  final String createdBy;

  final DateTime createdAt;

  /// Number of users currently following this list.
  final int followerCount;

  /// Net score (upvotes − downvotes).
  int get netScore =>
      votes.fold(0, (a, v) => a + (v.isUpvote ? 1 : -1));

  /// Upvote percentage (0.0–1.0), or 0.0 when no votes.
  double get approvalRate {
    if (votes.isEmpty) return 0.0;
    final ups = votes.where((v) => v.isUpvote).length;
    return ups / votes.length;
  }

  @override
  List<Object?> get props => [
        id,
        title,
        description,
        tickers,
        tags,
        votes,
        createdBy,
        createdAt,
        followerCount,
      ];
}
