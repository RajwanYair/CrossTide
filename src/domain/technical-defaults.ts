/**
 * Technical indicator default constants.
 * Ported from Dart: lib/src/domain/technical_defaults.dart
 */
export const DEFAULTS = {
  period: 14,
  rsiOversold: 30,
  rsiOverbought: 70,
  mfiOversold: 20,
  mfiOverbought: 80,
  williamsROversold: -80,
  williamsROverbought: -20,
  cciOversold: -100,
  cciOverbought: 100,
  sma200Period: 200,
  sma150Period: 150,
  sma50Period: 50,
  macdFastPeriod: 12,
  macdSlowPeriod: 26,
  macdSignalPeriod: 9,
  bollingerPeriod: 20,
  bollingerMultiplier: 2.0,
} as const;
