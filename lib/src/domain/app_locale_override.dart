import 'package:equatable/equatable.dart';

/// A user-configured locale override, letting a specific locale be forced
/// independently of the device system locale.
class AppLocaleOverride extends Equatable {
  const AppLocaleOverride({
    required this.userId,
    required this.localeCode,
    required this.numberFormatLocale,
    required this.useSystemLocale,
    required this.appliedAt,
  });

  final String userId;

  /// BCP-47 locale string (e.g. "en-US", "de-DE").  Ignored when
  /// [useSystemLocale] is `true`.
  final String localeCode;

  /// Locale used for number and currency formatting (e.g. "en-US").
  final String numberFormatLocale;

  /// When `true`, the app follows the device locale; [localeCode] is ignored.
  final bool useSystemLocale;

  final DateTime appliedAt;

  AppLocaleOverride copyWith({
    String? userId,
    String? localeCode,
    String? numberFormatLocale,
    bool? useSystemLocale,
    DateTime? appliedAt,
  }) => AppLocaleOverride(
    userId: userId ?? this.userId,
    localeCode: localeCode ?? this.localeCode,
    numberFormatLocale: numberFormatLocale ?? this.numberFormatLocale,
    useSystemLocale: useSystemLocale ?? this.useSystemLocale,
    appliedAt: appliedAt ?? this.appliedAt,
  );

  @override
  List<Object?> get props => [
    userId,
    localeCode,
    numberFormatLocale,
    useSystemLocale,
    appliedAt,
  ];
}
