import 'package:equatable/equatable.dart';

/// Configuration that governs how news articles trigger alerts.
///
/// Filters news by keyword matching, minimum relevance score, and source
/// priority to reduce alert noise from low-quality or irrelevant articles.
class NewsAlertConfig extends Equatable {
  /// Creates a [NewsAlertConfig].
  const NewsAlertConfig({
    required this.configId,
    required this.keywords,
    required this.minRelevanceScore,
    required this.isEnabled,
    this.allowedSources = const [],
    this.blocklistSources = const [],
  });

  /// Unique identifier for this configuration.
  final String configId;

  /// Keywords that must appear for an alert to fire (case-insensitive).
  final List<String> keywords;

  /// Minimum relevance score threshold [0.0–1.0].
  final double minRelevanceScore;

  /// Whether news alerts are currently active.
  final bool isEnabled;

  /// Allowlist of source names; empty = accept all.
  final List<String> allowedSources;

  /// Sources to always suppress.
  final List<String> blocklistSources;

  /// Returns `true` when [source] is not in the blocklist and is either
  /// in the allowlist or the allowlist is empty.
  bool isSourcePermitted(String source) {
    if (blocklistSources.contains(source)) return false;
    if (allowedSources.isEmpty) return true;
    return allowedSources.contains(source);
  }

  /// Returns `true` when alerts are enabled and there are keywords defined.
  bool get isActive => isEnabled && keywords.isNotEmpty;

  @override
  List<Object?> get props => [
    configId,
    keywords,
    minRelevanceScore,
    isEnabled,
    allowedSources,
    blocklistSources,
  ];
}
