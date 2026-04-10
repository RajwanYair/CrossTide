import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('PeerGroupMember', () {
    test('equality holds for same props', () {
      const a = PeerGroupMember(ticker: 'MSFT', correlationScore: 0.92);
      const b = PeerGroupMember(ticker: 'MSFT', correlationScore: 0.92);
      expect(a, equals(b));
    });
  });

  group('TickerPeerGroup', () {
    TickerPeerGroup buildGroup() {
      return TickerPeerGroup(
        referenceTicker: 'AAPL',
        groupName: 'Big Tech',
        members: const [
          PeerGroupMember(ticker: 'MSFT', correlationScore: 0.92),
          PeerGroupMember(ticker: 'GOOGL', correlationScore: 0.85),
          PeerGroupMember(ticker: 'META', correlationScore: 0.78),
        ],
        updatedAt: DateTime(2024, 6, 1),
      );
    }

    test('size returns number of members', () {
      expect(buildGroup().size, 3);
    });

    test('closestPeer returns first member (highest correlation)', () {
      expect(buildGroup().closestPeer?.ticker, 'MSFT');
    });

    test('closestPeer is null for empty group', () {
      final empty = TickerPeerGroup(
        referenceTicker: 'X',
        groupName: 'Empty',
        members: const [],
        updatedAt: DateTime(2024, 1, 1),
      );
      expect(empty.closestPeer, isNull);
    });

    test('topPeers returns correct number of members', () {
      expect(buildGroup().topPeers(2).length, 2);
    });

    test('topPeers returns all when n exceeds member count', () {
      expect(buildGroup().topPeers(10).length, 3);
    });

    test('equality holds for same props', () {
      expect(buildGroup(), equals(buildGroup()));
    });
  });
}
