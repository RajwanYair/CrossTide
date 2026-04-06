/// Fallback Provider — Tries providers in order, falls back on error.
///
/// Implements the chain-of-responsibility pattern: if the primary provider
/// throws a [MarketDataException] (or any error) the next provider in the
/// chain is tried. The first successful response wins.
///
/// Typical config: Yahoo Finance → Mock (offline fallback).
library;

import 'package:logger/logger.dart';

import '../../domain/entities.dart';
import 'market_data_provider.dart';

class FallbackMarketDataProvider implements IMarketDataProvider {
  FallbackMarketDataProvider({required this.providers, Logger? logger})
    : assert(providers.isNotEmpty, 'At least one provider required'),
      _logger = logger ?? Logger();

  final List<IMarketDataProvider> providers;
  final Logger _logger;

  @override
  String get name => 'Fallback (${providers.map((p) => p.name).join(' → ')})';

  @override
  String get id => providers.first.id;

  String? _lastUsedId;

  /// Which provider successfully served the most recent request, or null.
  String? get lastUsedProviderId => _lastUsedId;

  @override
  Future<List<DailyCandle>> fetchDailyHistory(String ticker) async {
    Object? lastError;
    for (final p in providers) {
      try {
        final candles = await p.fetchDailyHistory(ticker);
        if (_lastUsedId != p.id) {
          _logger.i('FallbackProvider: using ${p.name} for $ticker');
        }
        _lastUsedId = p.id;
        return candles;
      } catch (e) {
        _logger.w(
          'FallbackProvider: ${p.name} failed for $ticker — ${e.runtimeType}. '
          'Trying next provider.',
        );
        lastError = e;
      }
    }
    // All providers exhausted — rethrow the last error.
    throw MarketDataException(
      'All providers failed for $ticker. Last error: $lastError',
      isRetryable: true,
    );
  }
}
