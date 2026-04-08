import 'package:cross_tide/src/data/data.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('CacheStrategy', () {
    test('isFresh returns true within TTL', () {
      const strategy = CacheStrategy(ttl: Duration(hours: 4));
      final recent = DateTime.now().subtract(const Duration(hours: 1));
      expect(strategy.isFresh(recent), isTrue);
    });

    test('isFresh returns false beyond TTL', () {
      const strategy = CacheStrategy(ttl: Duration(hours: 4));
      final old = DateTime.now().subtract(const Duration(hours: 5));
      expect(strategy.isFresh(old), isFalse);
    });

    test('isStaleButUsable for stale-while-revalidate window', () {
      const strategy = CacheStrategy(
        ttl: Duration(hours: 4),
        staleTtl: Duration(hours: 24),
      );
      final stale = DateTime.now().subtract(const Duration(hours: 6));
      expect(strategy.isStaleButUsable(stale), isTrue);
    });

    test('isExpired beyond staleTtl', () {
      const strategy = CacheStrategy(
        ttl: Duration(hours: 4),
        staleTtl: Duration(hours: 24),
      );
      final expired = DateTime.now().subtract(const Duration(hours: 25));
      expect(strategy.isExpired(expired), isTrue);
    });

    test('predefined strategies have expected modes', () {
      expect(CacheStrategy.aggressive.mode, CacheMode.cacheFirst);
      expect(CacheStrategy.realtime.mode, CacheMode.networkOnly);
      expect(CacheStrategy.offline.mode, CacheMode.cacheOnly);
    });
  });
}
