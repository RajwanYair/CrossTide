/// Centralized technical indicator defaults — single source of truth.
///
/// Gathered from RSI, ATR, ADX, MFI, Stochastic, Williams %R, and other
/// calculators/detectors that all share common default periods and thresholds.
abstract final class TechnicalDefaults {
  /// Default look-back period for RSI, ATR, ADX, MFI, Stochastic, Williams %R.
  static const int defaultPeriod = 14;

  /// RSI oversold threshold (standard: 30).
  static const double rsiOversold = 30.0;

  /// RSI overbought threshold (standard: 70).
  static const double rsiOverbought = 70.0;

  /// MFI oversold threshold (standard: 20).
  static const double mfiOversold = 20.0;

  /// MFI overbought threshold (standard: 80).
  static const double mfiOverbought = 80.0;

  /// Williams %R oversold threshold (standard: −80).
  static const double williamsROversold = -80.0;

  /// Williams %R overbought threshold (standard: −20).
  static const double williamsROverbought = -20.0;

  /// CCI oversold threshold (standard: −100).
  static const double cciOversold = -100.0;

  /// CCI overbought threshold (standard: 100).
  static const double cciOverbought = 100.0;

  /// SMA200 look-back period.
  static const int sma200Period = 200;

  /// SMA150 look-back period (Micho Method).
  static const int sma150Period = 150;

  /// SMA50 look-back period.
  static const int sma50Period = 50;

  /// MACD fast EMA period (standard: 12).
  static const int macdFastPeriod = 12;

  /// MACD slow EMA period (standard: 26).
  static const int macdSlowPeriod = 26;

  /// MACD signal EMA period (standard: 9).
  static const int macdSignalPeriod = 9;

  /// Bollinger Band SMA period (standard: 20).
  static const int bollingerPeriod = 20;

  /// Bollinger Band standard deviation multiplier (standard: 2).
  static const double bollingerMultiplier = 2.0;
}
