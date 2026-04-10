import 'package:equatable/equatable.dart';

/// Crowd sentiment survey response option.
enum SentimentResponse { veryBullish, bullish, neutral, bearish, veryBearish }

/// A single participant's response in a crowd sentiment survey.
class SentimentResponseEntry extends Equatable {
  const SentimentResponseEntry({
    required this.participantId,
    required this.response,
    required this.respondedAt,
  });

  final String participantId;
  final SentimentResponse response;
  final DateTime respondedAt;

  @override
  List<Object?> get props => [participantId, response, respondedAt];
}

/// Aggregated results of a crowd sentiment survey for a ticker.
class CrowdSentimentSurvey extends Equatable {
  const CrowdSentimentSurvey({
    required this.surveyId,
    required this.ticker,
    required this.responses,
    required this.closedAt,
  });

  final String surveyId;
  final String ticker;
  final List<SentimentResponseEntry> responses;
  final DateTime closedAt;

  int get totalResponses => responses.length;

  /// Bull count: veryBullish + bullish.
  int get bullCount => responses
      .where(
        (r) =>
            r.response == SentimentResponse.veryBullish ||
            r.response == SentimentResponse.bullish,
      )
      .length;

  /// Bear count: veryBearish + bearish.
  int get bearCount => responses
      .where(
        (r) =>
            r.response == SentimentResponse.veryBearish ||
            r.response == SentimentResponse.bearish,
      )
      .length;

  /// Bull percentage (0–100). Returns 0 when no responses.
  double get bullPct =>
      totalResponses > 0 ? bullCount / totalResponses * 100 : 0;

  /// Returns true when bulls are the majority (> 50 %).
  bool get isBullishMajority => bullCount > bearCount;

  @override
  List<Object?> get props => [surveyId, ticker, responses, closedAt];
}
