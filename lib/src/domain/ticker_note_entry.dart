import 'package:equatable/equatable.dart';

/// A single rich-text note entry attached to a ticker.
class TickerNoteEntry extends Equatable {
  const TickerNoteEntry({
    required this.id,
    required this.symbol,
    required this.title,
    required this.body,
    required this.createdAt,
    this.updatedAt,
    this.tags = const [],
    this.isPinned = false,
  }) : assert(title.length > 0, 'title must not be empty'),
       assert(body.length > 0, 'body must not be empty');

  final String id;
  final String symbol;
  final String title;
  final String body;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final List<String> tags;
  final bool isPinned;

  bool get hasBeenEdited => updatedAt != null;
  bool get hasTags => tags.isNotEmpty;

  TickerNoteEntry pin() => TickerNoteEntry(
    id: id,
    symbol: symbol,
    title: title,
    body: body,
    createdAt: createdAt,
    updatedAt: updatedAt,
    tags: tags,
    isPinned: true,
  );

  TickerNoteEntry unpin() => TickerNoteEntry(
    id: id,
    symbol: symbol,
    title: title,
    body: body,
    createdAt: createdAt,
    updatedAt: updatedAt,
    tags: tags,
    isPinned: false,
  );

  TickerNoteEntry withUpdatedBody({
    required String newBody,
    required DateTime editedAt,
  }) => TickerNoteEntry(
    id: id,
    symbol: symbol,
    title: title,
    body: newBody,
    createdAt: createdAt,
    updatedAt: editedAt,
    tags: tags,
    isPinned: isPinned,
  );

  @override
  List<Object?> get props => [
    id,
    symbol,
    title,
    body,
    createdAt,
    updatedAt,
    tags,
    isPinned,
  ];
}
