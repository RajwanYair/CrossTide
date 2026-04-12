import 'package:equatable/equatable.dart';

/// User's preferred color scheme for the app.
enum ColorSchemePreference {
  /// Follow the OS light/dark setting.
  system,

  /// Force light mode.
  light,

  /// Force dark mode.
  dark,

  /// High-contrast accessibility mode.
  highContrast,
}

/// User interface preference profile stored per user account.
class UserPreferenceProfile extends Equatable {
  /// Creates a [UserPreferenceProfile].
  const UserPreferenceProfile({
    required this.userId,
    required this.colorScheme,
    required this.defaultCurrency,
    required this.decimalPrecision,
    required this.showPercentages,
    required this.compactNumbers,
  });

  /// User identifier.
  final String userId;

  /// Preferred color scheme.
  final ColorSchemePreference colorScheme;

  /// Base currency code (e.g. `'USD'`, `'EUR'`).
  final String defaultCurrency;

  /// Number of decimal places shown for prices.
  final int decimalPrecision;

  /// Whether to show percentage changes alongside absolute values.
  final bool showPercentages;

  /// Whether to format large numbers in compact notation (1.2M vs 1,200,000).
  final bool compactNumbers;

  /// Returns `true` when the user has chosen an explicit (non-system) scheme.
  bool get hasExplicitTheme => colorScheme != ColorSchemePreference.system;

  /// Returns `true` when the user prefers dark or high-contrast mode.
  bool get prefersDark =>
      colorScheme == ColorSchemePreference.dark ||
      colorScheme == ColorSchemePreference.highContrast;

  @override
  List<Object?> get props => [
    userId,
    colorScheme,
    defaultCurrency,
    decimalPrecision,
    showPercentages,
    compactNumbers,
  ];
}
