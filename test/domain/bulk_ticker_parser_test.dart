import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const BulkTickerParser parser = BulkTickerParser();

  group('BulkTickerParser', () {
    test('empty input returns empty result', () {
      final BulkParseResult result = parser.parse('');
      expect(result.valid, isEmpty);
      expect(result.invalid, isEmpty);
      expect(result.totalParsed, 0);
    });

    test('whitespace-only returns empty', () {
      final BulkParseResult result = parser.parse('   ');
      expect(result.valid, isEmpty);
      expect(result.allValid, isTrue);
    });

    test('comma-separated tickers', () {
      final BulkParseResult result = parser.parse('AAPL, MSFT, GOOG');
      expect(result.valid, ['AAPL', 'MSFT', 'GOOG']);
      expect(result.allValid, isTrue);
    });

    test('newline-separated tickers', () {
      final BulkParseResult result = parser.parse('AAPL\nMSFT\nGOOG');
      expect(result.valid, ['AAPL', 'MSFT', 'GOOG']);
    });

    test('semicolon-separated tickers', () {
      final BulkParseResult result = parser.parse('AAPL;MSFT;GOOG');
      expect(result.valid, ['AAPL', 'MSFT', 'GOOG']);
    });

    test('space-separated tickers', () {
      final BulkParseResult result = parser.parse('AAPL MSFT GOOG');
      expect(result.valid, ['AAPL', 'MSFT', 'GOOG']);
    });

    test('lowercased input is uppercased', () {
      final BulkParseResult result = parser.parse('aapl, msft');
      expect(result.valid, ['AAPL', 'MSFT']);
    });

    test('duplicates are removed', () {
      final BulkParseResult result = parser.parse('AAPL, MSFT, AAPL');
      expect(result.valid, ['AAPL', 'MSFT']);
    });

    test('class shares with dot accepted', () {
      final BulkParseResult result = parser.parse('BRK.B, AAPL');
      expect(result.valid, ['BRK.B', 'AAPL']);
      expect(result.allValid, isTrue);
    });

    test('class shares with dash accepted', () {
      final BulkParseResult result = parser.parse('BF-B');
      expect(result.valid, ['BF-B']);
    });

    test('invalid tokens are captured', () {
      final BulkParseResult result = parser.parse('AAPL, 123, MSFT');
      expect(result.valid, ['AAPL', 'MSFT']);
      expect(result.invalid, ['123']);
      expect(result.allValid, isFalse);
    });

    test('too-long symbols are invalid', () {
      final BulkParseResult result = parser.parse('ABCDEFGHIJKLM');
      expect(result.invalid, ['ABCDEFGHIJKLM']);
    });

    test('mixed separators work', () {
      final BulkParseResult result = parser.parse('AAPL,MSFT;GOOG TSLA\nNFLX');
      expect(result.valid, ['AAPL', 'MSFT', 'GOOG', 'TSLA', 'NFLX']);
    });

    test('totalParsed counts both valid and invalid', () {
      final BulkParseResult result = parser.parse('AAPL, 123, MSFT');
      expect(result.totalParsed, 3);
    });
  });
}
