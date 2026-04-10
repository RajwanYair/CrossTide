import 'package:equatable/equatable.dart';

/// A user-defined color + emoji label that can be attached to any ticker
/// symbol, enabling custom categorization beyond watchlist groups.
class TickerTagEntry extends Equatable {
  const TickerTagEntry({
    required this.tagId,
    required this.label,
    required this.colorHex,
    this.emoji,
    this.description,
  }) : assert(colorHex.length == 7, 'colorHex must be #RRGGBB form');

  final String tagId;
  final String label;

  /// Hex color in `#RRGGBB` format.
  final String colorHex;
  final String? emoji;
  final String? description;

  bool get hasEmoji => emoji != null && emoji!.isNotEmpty;
  bool get hasDescription => description != null && description!.isNotEmpty;

  /// Returns a display string like `🟢 Growth` or just `Growth`.
  String get displayLabel => hasEmoji ? '$emoji $label' : label;

  @override
  List<Object?> get props => [tagId, label, colorHex, emoji, description];
}

/// A registry of all user-defined ticker tags, keyed by [tagId].
class TickerTagRegistry extends Equatable {
  const TickerTagRegistry({required this.tags});

  final List<TickerTagEntry> tags;

  int get count => tags.length;

  /// Returns the tag with the given [tagId], or `null` if not found.
  TickerTagEntry? tagFor(String tagId) {
    for (final TickerTagEntry t in tags) {
      if (t.tagId == tagId) return t;
    }
    return null;
  }

  /// Returns all tags with the given [colorHex].
  List<TickerTagEntry> tagsWithColor(String colorHex) =>
      tags.where((final TickerTagEntry t) => t.colorHex == colorHex).toList();

  @override
  List<Object?> get props => [tags];
}

/// Associates a [symbol] with a set of tag IDs from the registry.
class TickerTagAssignment extends Equatable {
  const TickerTagAssignment({required this.symbol, required this.tagIds});

  final String symbol;
  final List<String> tagIds;

  bool get hasTags => tagIds.isNotEmpty;
  int get tagCount => tagIds.length;

  bool hasTag(final String tagId) => tagIds.contains(tagId);

  @override
  List<Object?> get props => [symbol, tagIds];
}
