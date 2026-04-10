import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('IndicatorPresetConfig', () {
    const preset = IndicatorPresetConfig(
      presetId: 'rsi_14',
      indicatorKey: 'rsi',
      displayName: 'RSI (14)',
      parameters: {'period': '14', 'overbought': '70', 'oversold': '30'},
      isDefault: true,
    );

    test('parameter returns value for an existing key', () {
      expect(preset.parameter('period'), '14');
    });

    test('parameter returns null for a missing key', () {
      expect(preset.parameter('nonexistent'), isNull);
    });

    test('isDefault is true for default preset', () {
      expect(preset.isDefault, isTrue);
    });

    test('isDefault defaults to false', () {
      const p = IndicatorPresetConfig(
        presetId: 'macd_custom',
        indicatorKey: 'macd',
        displayName: 'MACD Custom',
        parameters: {'fast': '12', 'slow': '26'},
      );
      expect(p.isDefault, isFalse);
    });

    test('description defaults to null', () {
      expect(preset.description, isNull);
    });

    test('equality holds for same props', () {
      const copy = IndicatorPresetConfig(
        presetId: 'rsi_14',
        indicatorKey: 'rsi',
        displayName: 'RSI (14)',
        parameters: {'period': '14', 'overbought': '70', 'oversold': '30'},
        isDefault: true,
      );
      expect(preset, equals(copy));
    });
  });
}
