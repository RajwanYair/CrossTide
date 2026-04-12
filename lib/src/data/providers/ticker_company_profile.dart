/// Lightweight company profile returned by [YahooFinanceProvider].
///
/// Used only in the data layer as a DTO between the provider and repository.
class TickerCompanyProfile {
  const TickerCompanyProfile({
    required this.symbol,
    this.longName,
    this.description,
    this.industry,
  });

  final String symbol;
  final String? longName;
  final String? description;

  /// Sector + industry string (e.g. 'Technology • Semiconductors').
  final String? industry;
}
