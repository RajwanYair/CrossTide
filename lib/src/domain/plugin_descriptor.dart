/// Plugin Descriptor — metadata for a discoverable custom indicator or handler plugin.
library;

import 'package:equatable/equatable.dart';

/// The functional category of a plugin.
enum PluginType {
  /// Custom indicator (SMA, EMA, formula-based).
  indicator,

  /// Alert handler — sends notifications to a custom sink.
  alertHandler,

  /// Market data provider plugin.
  dataProvider,

  /// Post-processor that transforms or enriches signals.
  postProcessor,
}

/// Lifecycle status of an installed plugin.
enum PluginStatus {
  /// Plugin is loaded and available.
  active,

  /// Plugin is installed but disabled by the user.
  inactive,

  /// Plugin encountered a load or runtime error.
  error,

  /// A newer version is available.
  requiresUpdate,
}

/// Semantic version for a plugin.
class PluginVersion extends Equatable {
  const PluginVersion({
    required this.major,
    required this.minor,
    required this.patch,
  });

  /// Parses a semver string of the form "MAJOR.MINOR.PATCH".
  factory PluginVersion.parse(String semver) {
    final parts = semver.split('.');
    return PluginVersion(
      major: int.parse(parts[0]),
      minor: int.parse(parts[1]),
      patch: int.parse(parts[2]),
    );
  }

  final int major;
  final int minor;
  final int patch;

  String get semver => '$major.$minor.$patch';

  /// Returns true when this version is strictly newer than [other].
  bool isNewerThan(PluginVersion other) =>
      major > other.major ||
      (major == other.major && minor > other.minor) ||
      (major == other.major && minor == other.minor && patch > other.patch);

  @override
  List<Object?> get props => [major, minor, patch];
}

/// Metadata record for a single installed or discovered plugin.
class PluginDescriptor extends Equatable {
  const PluginDescriptor({
    required this.id,
    required this.name,
    required this.type,
    required this.version,
    required this.status,
    required this.author,
    this.description,
    this.minAppVersion,
  });

  /// Unique stable identifier (e.g. reverse-domain slug).
  final String id;
  final String name;
  final PluginType type;
  final PluginVersion version;
  final PluginStatus status;
  final String author;
  final String? description;

  /// Minimum CrossTide app version required (semver string), if specified.
  final String? minAppVersion;

  /// Returns true when the plugin can be used ([status] is [PluginStatus.active]).
  bool get isUsable => status == PluginStatus.active;

  /// Returns a copy of this descriptor with the given [newStatus].
  PluginDescriptor withStatus(PluginStatus newStatus) => PluginDescriptor(
    id: id,
    name: name,
    type: type,
    version: version,
    status: newStatus,
    author: author,
    description: description,
    minAppVersion: minAppVersion,
  );

  @override
  List<Object?> get props => [
    id,
    name,
    type,
    version,
    status,
    author,
    description,
    minAppVersion,
  ];
}
