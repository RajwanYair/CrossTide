import 'package:equatable/equatable.dart';

/// Identifies the host operating system and platform version.
class PlatformBuildInfo extends Equatable {
  const PlatformBuildInfo({
    required this.osName,
    required this.osVersion,
    required this.appVersion,
    required this.buildNumber,
    required this.flutterVersion,
    required this.dartVersion,
    required this.isDebugBuild,
  });

  /// e.g. "Windows", "Android", "iOS"
  final String osName;

  /// e.g. "Windows 11 (22631)", "Android 14"
  final String osVersion;

  final String appVersion;
  final String buildNumber;
  final String flutterVersion;
  final String dartVersion;
  final bool isDebugBuild;

  PlatformBuildInfo copyWith({
    String? osName,
    String? osVersion,
    String? appVersion,
    String? buildNumber,
    String? flutterVersion,
    String? dartVersion,
    bool? isDebugBuild,
  }) => PlatformBuildInfo(
    osName: osName ?? this.osName,
    osVersion: osVersion ?? this.osVersion,
    appVersion: appVersion ?? this.appVersion,
    buildNumber: buildNumber ?? this.buildNumber,
    flutterVersion: flutterVersion ?? this.flutterVersion,
    dartVersion: dartVersion ?? this.dartVersion,
    isDebugBuild: isDebugBuild ?? this.isDebugBuild,
  );

  @override
  List<Object?> get props => [
    osName,
    osVersion,
    appVersion,
    buildNumber,
    flutterVersion,
    dartVersion,
    isDebugBuild,
  ];
}
