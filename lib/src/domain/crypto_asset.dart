/// Crypto Asset — cryptocurrency asset entity and price data.
library;

import 'package:equatable/equatable.dart';

/// Exchange or data source that provides crypto price data.
enum CryptoExchange {
  /// Coinpaprika public API.
  coinpaprika,

  /// CoinGecko public API.
  coingecko,

  /// Binance spot market.
  binance,

  /// Coinbase exchange.
  coinbase,

  /// Generic / unknown.
  other,
}

/// A cryptocurrency asset descriptor.
class CryptoAsset extends Equatable {
  const CryptoAsset({
    required this.symbol,
    required this.name,
    required this.coinId,
    required this.exchange,
    this.pricePrecision = 8,
    this.isStablecoin = false,
  });

  /// Ticker symbol (e.g. `BTC`, `ETH`).
  final String symbol;

  /// Human-readable name (e.g. `Bitcoin`).
  final String name;

  /// Provider-specific coin identifier (e.g. `btc-bitcoin`).
  final String coinId;

  final CryptoExchange exchange;

  /// Decimal places used for price display (default 8 for most altcoins).
  final int pricePrecision;

  /// True for stablecoins (USDT, USDC, DAI, etc.).
  final bool isStablecoin;

  @override
  List<Object?> get props =>
      [symbol, name, coinId, exchange, pricePrecision, isStablecoin];
}

/// A price snapshot for a [CryptoAsset].
class CryptoPrice extends Equatable {
  const CryptoPrice({
    required this.asset,
    required this.priceUsd,
    required this.volume24hUsd,
    required this.marketCapUsd,
    required this.change24hPct,
    required this.timestamp,
  });

  final CryptoAsset asset;

  /// USD price of one unit.
  final double priceUsd;

  /// 24-hour trading volume in USD.
  final double volume24hUsd;

  /// Market capitalisation in USD.
  final double marketCapUsd;

  /// 24-hour % price change (e.g. 3.5 = +3.5%).
  final double change24hPct;

  final DateTime timestamp;

  /// True when the 24-hour change is positive.
  bool get isPositiveDay => change24hPct > 0;

  @override
  List<Object?> get props => [
        asset,
        priceUsd,
        volume24hUsd,
        marketCapUsd,
        change24hPct,
        timestamp,
      ];
}
