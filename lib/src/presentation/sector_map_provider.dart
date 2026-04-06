/// Provides a static sector → color map parsed from assets/sector_map.json.
library;

import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// FutureProvider: symbol → sector name, loaded from bundled JSON.
final sectorMapProvider = FutureProvider<Map<String, String>>((ref) async {
  final raw = await rootBundle.loadString('assets/sector_map.json');
  final map = (jsonDecode(raw) as Map<String, dynamic>).cast<String, String>();
  return map;
});

/// Maps GICS sector name to a representative color.
const sectorColors = <String, Color>{
  'Technology': Color(0xFF1565C0),
  'Healthcare': Color(0xFF2E7D32),
  'Financials': Color(0xFF6A1B9A),
  'Consumer Discretionary': Color(0xFFE65100),
  'Consumer Staples': Color(0xFF4CAF50),
  'Industrials': Color(0xFF1976D2),
  'Energy': Color(0xFF795548),
  'Materials': Color(0xFF009688),
  'Communication Services': Color(0xFFE91E63),
  'Utilities': Color(0xFF0097A7),
  'Real Estate': Color(0xFFFF7043),
};

Color sectorColor(String sector) =>
    sectorColors[sector] ?? const Color(0xFF9E9E9E);
