/// Bulk Ticker Parser — pure domain utility.
///
/// Parses comma-separated, space-separated, or newline-separated
/// ticker input text into a clean, deduplicated list of symbols.
library;

/// Result of parsing a bulk ticker input string.
class BulkParseResult {
  const BulkParseResult({required this.valid, required this.invalid});

  /// Successfully parsed ticker symbols (uppercased, deduplicated).
  final List<String> valid;

  /// Input tokens that failed validation.
  final List<String> invalid;

  /// Total number of tokens parsed.
  int get totalParsed => valid.length + invalid.length;

  /// Whether all tokens were valid.
  bool get allValid => invalid.isEmpty;
}

/// Parses raw ticker input text into validated symbol lists.
class BulkTickerParser {
  const BulkTickerParser();

  /// Parse [input] into ticker symbols.
  ///
  /// Splits on commas, semicolons, whitespace, and newlines.
  /// Validates each token: 1–10 uppercase letters/digits, with optional
  /// dot or dash for class shares (e.g., BRK.B, BF-B).
  ///
  /// Returns [BulkParseResult] with valid (deduplicated) and invalid tokens.
  BulkParseResult parse(String input) {
    if (input.trim().isEmpty) {
      return const BulkParseResult(valid: [], invalid: []);
    }

    final List<String> tokens = input
        .replaceAll(RegExp(r'[,;\n\r]+'), ' ')
        .split(RegExp(r'\s+'))
        .map((String s) => s.trim().toUpperCase())
        .where((String s) => s.isNotEmpty)
        .toList();

    final RegExp validPattern = RegExp(r'^[A-Z]{1,10}([.\-][A-Z0-9]{1,3})?$');
    final Set<String> seen = {};
    final List<String> valid = [];
    final List<String> invalid = [];

    for (final String token in tokens) {
      if (validPattern.hasMatch(token)) {
        if (seen.add(token)) {
          valid.add(token);
        }
      } else {
        invalid.add(token);
      }
    }

    return BulkParseResult(valid: valid, invalid: invalid);
  }
}
