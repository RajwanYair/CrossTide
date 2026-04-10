import 'package:equatable/equatable.dart';

/// Category of a macro-economic calendar event.
enum EconomicEventCategory {
  inflation,
  employment,
  centralBank,
  gdp,
  trade,
  housing,
  consumerSentiment,
  other,
}

/// Market impact level expected from an economic event.
enum EconomicImpactLevel { low, medium, high }

/// A macro-economic calendar event (CPI, FOMC, NFP, GDP, etc.).
class EconomicCalendarEvent extends Equatable {
  const EconomicCalendarEvent({
    required this.id,
    required this.title,
    required this.category,
    required this.impactLevel,
    required this.scheduledAt,
    this.actualValue,
    this.forecastValue,
    this.previousValue,
    this.currency = 'USD',
    this.country = 'US',
  });

  final String id;
  final String title;
  final EconomicEventCategory category;
  final EconomicImpactLevel impactLevel;
  final DateTime scheduledAt;
  final double? actualValue;
  final double? forecastValue;
  final double? previousValue;
  final String currency;
  final String country;

  bool get isReleased => actualValue != null;
  bool get isHighImpact => impactLevel == EconomicImpactLevel.high;

  /// Surprise = actual − forecast, or null if not yet released.
  double? get surprise => (actualValue != null && forecastValue != null)
      ? actualValue! - forecastValue!
      : null;

  bool get isPositiveSurprise => surprise != null && surprise! > 0;

  bool get isDue => !isReleased;

  @override
  List<Object?> get props => [
    id,
    title,
    category,
    impactLevel,
    scheduledAt,
    actualValue,
    forecastValue,
    previousValue,
    currency,
    country,
  ];
}
