import 'package:cross_tide/src/domain/trade_idea_record.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('TradeIdeaRecord', () {
    test('equality', () {
      final a = TradeIdeaRecord(
        ideaId: 'ti1',
        ticker: 'MSFT',
        direction: TradeIdeaDirection.long,
        conviction: TradeIdeaConviction.high,
        thesis: 'Strong cloud growth',
        createdAt: DateTime(2025, 6, 1),
      );
      final b = TradeIdeaRecord(
        ideaId: 'ti1',
        ticker: 'MSFT',
        direction: TradeIdeaDirection.long,
        conviction: TradeIdeaConviction.high,
        thesis: 'Strong cloud growth',
        createdAt: DateTime(2025, 6, 1),
      );
      expect(a, b);
    });

    test('copyWith changes thesis', () {
      final base = TradeIdeaRecord(
        ideaId: 'ti1',
        ticker: 'MSFT',
        direction: TradeIdeaDirection.long,
        conviction: TradeIdeaConviction.high,
        thesis: 'Strong cloud growth',
        createdAt: DateTime(2025, 6, 1),
      );
      final updated = base.copyWith(thesis: 'AI tailwinds strong');
      expect(updated.thesis, 'AI tailwinds strong');
    });

    test('props length is 11', () {
      final obj = TradeIdeaRecord(
        ideaId: 'ti1',
        ticker: 'MSFT',
        direction: TradeIdeaDirection.long,
        conviction: TradeIdeaConviction.high,
        thesis: 'Strong cloud growth',
        createdAt: DateTime(2025, 6, 1),
      );
      expect(obj.props.length, 11);
    });
  });
}
