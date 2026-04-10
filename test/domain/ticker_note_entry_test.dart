import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('TickerNoteEntry', () {
    final DateTime created = DateTime(2025, 1, 10);

    final TickerNoteEntry note = TickerNoteEntry(
      id: 'n1',
      symbol: 'AAPL',
      title: 'Breakout watch',
      body: 'Watch for SMA200 crossover next week.',
      createdAt: created,
      tags: const ['watchlist', 'signal'],
    );

    test('hasBeenEdited false without updatedAt', () {
      expect(note.hasBeenEdited, isFalse);
    });

    test('hasTags true when tags present', () {
      expect(note.hasTags, isTrue);
    });

    test('pin returns pinned copy', () {
      final TickerNoteEntry pinned = note.pin();
      expect(pinned.isPinned, isTrue);
      expect(note.isPinned, isFalse);
    });

    test('unpin returns unpinned copy', () {
      final TickerNoteEntry pinned = note.pin();
      final TickerNoteEntry unpinned = pinned.unpin();
      expect(unpinned.isPinned, isFalse);
    });

    test('withUpdatedBody updates body and sets updatedAt', () {
      final DateTime editTime = DateTime(2025, 2, 1);
      final TickerNoteEntry edited = note.withUpdatedBody(
        newBody: 'Updated observation.',
        editedAt: editTime,
      );
      expect(edited.body, 'Updated observation.');
      expect(edited.updatedAt, editTime);
      expect(edited.hasBeenEdited, isTrue);
      expect(note.body, 'Watch for SMA200 crossover next week.');
    });

    test('equality', () {
      final TickerNoteEntry same = TickerNoteEntry(
        id: 'n1',
        symbol: 'AAPL',
        title: 'Breakout watch',
        body: 'Watch for SMA200 crossover next week.',
        createdAt: created,
        tags: const ['watchlist', 'signal'],
      );
      expect(note, same);
    });
  });
}
