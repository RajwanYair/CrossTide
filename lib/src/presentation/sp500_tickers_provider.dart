/// Loads the bundled S&P 500 ticker list from assets.
library;

import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// FutureProvider that parses `assets/sp500_tickers.json` once and caches it.
final sp500TickersProvider = FutureProvider<List<String>>((ref) async {
  final raw = await rootBundle.loadString('assets/sp500_tickers.json');
  final list = (jsonDecode(raw) as List<dynamic>).cast<String>();
  return list..sort();
});
