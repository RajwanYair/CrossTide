import 'package:cross_tide/src/data/providers/market_data_provider.dart';
import 'package:cross_tide/src/domain/entities.dart';

/// Simple mock provider that returns predefined candles.
class MockProvider implements IMarketDataProvider {
  MockProvider({required this.candles});

  final List<DailyCandle> candles;

  @override
  String get name => 'Mock';

  @override
  String get id => 'mock';

  @override
  Future<List<DailyCandle>> fetchDailyHistory(String ticker) async {
    return candles;
  }
}

/// Provider that always throws.
class FailingProvider implements IMarketDataProvider {
  @override
  String get name => 'Failing';

  @override
  String get id => 'failing';

  @override
  Future<List<DailyCandle>> fetchDailyHistory(String ticker) async {
    throw const MarketDataException('simulated failure');
  }
}
