import 'package:equatable/equatable.dart';

/// Runtime context snapshot of the app environment.
class AppRuntimeContext extends Equatable {
  /// Creates an [AppRuntimeContext].
  const AppRuntimeContext({
    required this.appVersion,
    required this.buildNumber,
    required this.platform,
    required this.locale,
    required this.isDebugBuild,
    required this.capturedAt,
  });

  /// Semantic version string (e.g. `'2.11.0'`).
  final String appVersion;

  /// Build number integer.
  final int buildNumber;

  /// Platform identifier (e.g. `'android'`, `'windows'`).
  final String platform;

  /// Active locale code (e.g. `'en_US'`).
  final String locale;

  /// Whether this is a debug (non-release) build.
  final bool isDebugBuild;

  /// When this context was captured.
  final DateTime capturedAt;

  /// Returns `true` when running on Android.
  bool get isAndroid => platform == 'android';

  /// Returns `true` when running on Windows.
  bool get isWindows => platform == 'windows';

  /// Returns `true` when running on a production (release) build.
  bool get isReleaseBuild => !isDebugBuild;

  @override
  List<Object?> get props => [
    appVersion,
    buildNumber,
    platform,
    locale,
    isDebugBuild,
    capturedAt,
  ];
}
