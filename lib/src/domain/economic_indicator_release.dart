import 'package:equatable/equatable.dart';

import 'economic_calendar_event.dart';

/// Category of economic indicator.
enum EconomicIndicatorCategory {
  inflation,
  employment,
  growth,
  housing,
  manufacturing,
  tradeBalance,
  centralBank,
  consumerSentiment,
}

/// A scheduled release of an economic indicator (e.g. CPI, NFP, GDP).
class EconomicIndicatorRelease extends Equatable {
  const EconomicIndicatorRelease({
    required this.releaseId,
    required this.name,
    required this.country,
    required this.category,
    required this.impactLevel,
    required this.releaseTime,
    this.previous,
    this.forecast,
    this.actual,
    this.unit = '',
  });

  final String releaseId;
  final String name;

  /// ISO 3166-1 alpha-2 country code (e.g. 'US', 'EU', 'GB').
  final String country;
  final EconomicIndicatorCategory category;
  final EconomicImpactLevel impactLevel;
  final DateTime releaseTime;

  /// Previous period value.
  final double? previous;

  /// Consensus forecast.
  final double? forecast;

  /// Actual reported value (null until released).
  final double? actual;

  /// Unit description (e.g. '%', 'K', 'B USD').
  final String unit;

  bool get isHighImpact => impactLevel == EconomicImpactLevel.high;
  bool get isReleased => actual != null;
  bool get hasForecast => forecast != null;
  bool get hasPrevious => previous != null;

  /// Returns the surprise (actual − forecast) if both are available.
  double? get surprise {
    if (actual == null || forecast == null) return null;
    return actual! - forecast!;
  }

  /// True if the actual beat the forecast.
  bool get isBeat {
    final s = surprise;
    if (s == null) return false;
    return s > 0;
  }

  @override
  List<Object?> get props => [
    releaseId,
    name,
    country,
    category,
    impactLevel,
    releaseTime,
    previous,
    forecast,
    actual,
    unit,
  ];
}
