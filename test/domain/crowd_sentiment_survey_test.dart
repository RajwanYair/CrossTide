import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('SentimentResponse', () {
    test('has 5 values', () {
      expect(SentimentResponse.values.length, 5);
    });
  });

  group('CrowdSentimentSurvey', () {
    CrowdSentimentSurvey buildSurvey() {
      return CrowdSentimentSurvey(
        surveyId: 's1',
        ticker: 'AAPL',
        responses: [
          SentimentResponseEntry(
            participantId: 'p1',
            response: SentimentResponse.veryBullish,
            respondedAt: DateTime(2024, 1, 1),
          ),
          SentimentResponseEntry(
            participantId: 'p2',
            response: SentimentResponse.bullish,
            respondedAt: DateTime(2024, 1, 1),
          ),
          SentimentResponseEntry(
            participantId: 'p3',
            response: SentimentResponse.bearish,
            respondedAt: DateTime(2024, 1, 1),
          ),
          SentimentResponseEntry(
            participantId: 'p4',
            response: SentimentResponse.neutral,
            respondedAt: DateTime(2024, 1, 1),
          ),
        ],
        closedAt: DateTime(2024, 1, 2),
      );
    }

    test('totalResponses is 4', () {
      expect(buildSurvey().totalResponses, 4);
    });

    test('bullCount counts veryBullish + bullish', () {
      expect(buildSurvey().bullCount, 2);
    });

    test('bearCount counts veryBearish + bearish', () {
      expect(buildSurvey().bearCount, 1);
    });

    test('bullPct is 50 with 2 bulls out of 4', () {
      expect(buildSurvey().bullPct, closeTo(50.0, 0.001));
    });

    test('isBullishMajority is true when bulls > bears', () {
      expect(buildSurvey().isBullishMajority, isTrue);
    });

    test('bullPct is 0 when no responses', () {
      final empty = CrowdSentimentSurvey(
        surveyId: 'empty',
        ticker: 'X',
        responses: const [],
        closedAt: DateTime(2024, 1, 1),
      );
      expect(empty.bullPct, 0.0);
    });

    test('equality holds for same props', () {
      expect(buildSurvey(), equals(buildSurvey()));
    });
  });
}
