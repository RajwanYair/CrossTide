/// Theme Preset — built-in colour palette presets for app theming.
library;

import 'package:equatable/equatable.dart';

/// Background rendering style.
enum ThemeBackgroundStyle {
  /// Flat solid background colour.
  flat,

  /// Subtle radial gradient.
  gradient,

  /// Dark background with subtle grid lines (trading-terminal look).
  grid,
}

/// A complete colour-scheme preset for the app.
///
/// Colour values are stored as ARGB integers (matching Flutter's `Color.value`
/// serialisation) so the domain layer stays Flutter-free.
class ThemePreset extends Equatable {
  const ThemePreset({
    required this.id,
    required this.name,
    required this.primaryArgb,
    required this.accentArgb,
    required this.backgroundArgb,
    required this.surfaceArgb,
    required this.backgroundStyle,
    required this.isDark,
  });

  /// Unique preset identifier (slug, e.g. `nord`, `dracula`).
  final String id;

  /// Display name.
  final String name;

  final int primaryArgb;
  final int accentArgb;
  final int backgroundArgb;
  final int surfaceArgb;
  final ThemeBackgroundStyle backgroundStyle;
  final bool isDark;

  @override
  List<Object?> get props => [
        id,
        name,
        primaryArgb,
        accentArgb,
        backgroundArgb,
        surfaceArgb,
        backgroundStyle,
        isDark,
      ];
}

/// Registry of all 11 built-in theme presets.
class ThemeRegistry {
  const ThemeRegistry._();

  static const List<ThemePreset> presets = [
    // ----- Dark themes -----
    ThemePreset(
      id: 'midnight',
      name: 'Midnight (default)',
      primaryArgb: 0xFF1565C0,
      accentArgb: 0xFF00BCD4,
      backgroundArgb: 0xFF0D1117,
      surfaceArgb: 0xFF161B22,
      backgroundStyle: ThemeBackgroundStyle.flat,
      isDark: true,
    ),
    ThemePreset(
      id: 'dracula',
      name: 'Dracula',
      primaryArgb: 0xFFBD93F9,
      accentArgb: 0xFFFF79C6,
      backgroundArgb: 0xFF282A36,
      surfaceArgb: 0xFF44475A,
      backgroundStyle: ThemeBackgroundStyle.flat,
      isDark: true,
    ),
    ThemePreset(
      id: 'nord',
      name: 'Nord',
      primaryArgb: 0xFF81A1C1,
      accentArgb: 0xFF88C0D0,
      backgroundArgb: 0xFF2E3440,
      surfaceArgb: 0xFF3B4252,
      backgroundStyle: ThemeBackgroundStyle.flat,
      isDark: true,
    ),
    ThemePreset(
      id: 'catppuccin',
      name: 'Catppuccin Mocha',
      primaryArgb: 0xFFCBA6F7,
      accentArgb: 0xFF89DCEB,
      backgroundArgb: 0xFF1E1E2E,
      surfaceArgb: 0xFF313244,
      backgroundStyle: ThemeBackgroundStyle.flat,
      isDark: true,
    ),
    ThemePreset(
      id: 'solarized_dark',
      name: 'Solarized Dark',
      primaryArgb: 0xFF268BD2,
      accentArgb: 0xFF2AA198,
      backgroundArgb: 0xFF002B36,
      surfaceArgb: 0xFF073642,
      backgroundStyle: ThemeBackgroundStyle.flat,
      isDark: true,
    ),
    ThemePreset(
      id: 'terminal',
      name: 'Trading Terminal',
      primaryArgb: 0xFF00E676,
      accentArgb: 0xFF00BCD4,
      backgroundArgb: 0xFF000000,
      surfaceArgb: 0xFF0A0A0A,
      backgroundStyle: ThemeBackgroundStyle.grid,
      isDark: true,
    ),
    ThemePreset(
      id: 'ocean',
      name: 'Deep Ocean',
      primaryArgb: 0xFF0288D1,
      accentArgb: 0xFF26C6DA,
      backgroundArgb: 0xFF0D1B2A,
      surfaceArgb: 0xFF1A2E3F,
      backgroundStyle: ThemeBackgroundStyle.gradient,
      isDark: true,
    ),
    // ----- Light themes -----
    ThemePreset(
      id: 'light',
      name: 'Clean Light',
      primaryArgb: 0xFF1565C0,
      accentArgb: 0xFF0097A7,
      backgroundArgb: 0xFFF5F5F5,
      surfaceArgb: 0xFFFFFFFF,
      backgroundStyle: ThemeBackgroundStyle.flat,
      isDark: false,
    ),
    ThemePreset(
      id: 'solarized_light',
      name: 'Solarized Light',
      primaryArgb: 0xFF268BD2,
      accentArgb: 0xFF2AA198,
      backgroundArgb: 0xFFFDF6E3,
      surfaceArgb: 0xFFEEE8D5,
      backgroundStyle: ThemeBackgroundStyle.flat,
      isDark: false,
    ),
    ThemePreset(
      id: 'high_contrast',
      name: 'High Contrast',
      primaryArgb: 0xFFFFFFFF,
      accentArgb: 0xFFFFFF00,
      backgroundArgb: 0xFF000000,
      surfaceArgb: 0xFF1A1A1A,
      backgroundStyle: ThemeBackgroundStyle.flat,
      isDark: true,
    ),
    ThemePreset(
      id: 'rose_pine',
      name: 'Rosé Pine',
      primaryArgb: 0xFFEBBCBA,
      accentArgb: 0xFF9CCFD8,
      backgroundArgb: 0xFF191724,
      surfaceArgb: 0xFF1F1D2E,
      backgroundStyle: ThemeBackgroundStyle.flat,
      isDark: true,
    ),
  ];

  /// Returns the preset with [id], or the midnight default when not found.
  static ThemePreset byId(String id) =>
      presets.firstWhere((p) => p.id == id, orElse: () => presets.first);
}
