import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('TickerTagEntry', () {
    test('creates tag with all fields', () {
      const tag = TickerTagEntry(
        tagId: 'tag-1',
        label: 'Growth',
        colorHex: '#00FF00',
        emoji: '🌱',
        description: 'High-growth stocks',
      );
      expect(tag.hasEmoji, isTrue);
      expect(tag.hasDescription, isTrue);
      expect(tag.displayLabel, '🌱 Growth');
    });

    test('creates tag without optional fields', () {
      const tag = TickerTagEntry(
        tagId: 'tag-2',
        label: 'Value',
        colorHex: '#0000FF',
      );
      expect(tag.hasEmoji, isFalse);
      expect(tag.displayLabel, 'Value');
    });
  });

  group('TickerTagRegistry', () {
    const tags = [
      TickerTagEntry(tagId: 'a', label: 'A', colorHex: '#FF0000'),
      TickerTagEntry(tagId: 'b', label: 'B', colorHex: '#00FF00'),
      TickerTagEntry(tagId: 'c', label: 'C', colorHex: '#FF0000'),
    ];

    const registry = TickerTagRegistry(tags: tags);

    test('count returns number of tags', () {
      expect(registry.count, 3);
    });

    test('tagFor returns tag or null', () {
      expect(registry.tagFor('a')!.label, 'A');
      expect(registry.tagFor('z'), isNull);
    });

    test('tagsWithColor filters by color', () {
      expect(registry.tagsWithColor('#FF0000').length, 2);
      expect(registry.tagsWithColor('#0000FF').length, 0);
    });
  });

  group('TickerTagAssignment', () {
    test('reports hasTags and hasTag', () {
      const assignment = TickerTagAssignment(
        symbol: 'AAPL',
        tagIds: ['a', 'b'],
      );
      expect(assignment.hasTags, isTrue);
      expect(assignment.tagCount, 2);
      expect(assignment.hasTag('a'), isTrue);
      expect(assignment.hasTag('z'), isFalse);
    });

    test('equality holds for identical assignments', () {
      const a = TickerTagAssignment(symbol: 'X', tagIds: ['t1']);
      const b = TickerTagAssignment(symbol: 'X', tagIds: ['t1']);
      expect(a, equals(b));
    });
  });
}
