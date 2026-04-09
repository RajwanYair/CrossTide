/// Device Sync Manifest — multi-device synchronisation state envelope.
library;

import 'package:equatable/equatable.dart';

/// Category of data that can be synced across devices.
enum SyncCategory {
  /// Watchlist ticker list and groups.
  watchlist,

  /// Alert settings and profiles per ticker.
  alertSettings,

  /// App-wide settings (theme, quiet hours, etc.).
  appSettings,

  /// Alert history log.
  alertHistory,

  /// Portfolio positions.
  portfolio,
}

/// Sync status for one category on one device.
enum SyncStatus {
  /// Local and remote are in agreement.
  synced,

  /// Local is ahead of remote — push pending.
  localAhead,

  /// Remote is ahead of local — pull pending.
  remoteAhead,

  /// Both sides changed — manual merge required.
  conflict,

  /// Default state; sync has never run.
  unknown,
}

/// Sync state for one [SyncCategory] on a single device.
class DeviceSyncEntry extends Equatable {
  const DeviceSyncEntry({
    required this.category,
    required this.status,
    required this.localVersion,
    required this.remoteVersion,
    this.lastSyncedAt,
  });

  final SyncCategory category;
  final SyncStatus status;

  /// Monotonically increasing local version counter.
  final int localVersion;

  /// Last known remote version counter.
  final int remoteVersion;

  final DateTime? lastSyncedAt;

  bool get needsSync => status != SyncStatus.synced;

  @override
  List<Object?> get props =>
      [category, status, localVersion, remoteVersion, lastSyncedAt];
}

/// Complete sync manifest for one device — lists the sync state of every
/// category so the sync service knows what to push or pull.
class DeviceSyncManifest extends Equatable {
  const DeviceSyncManifest({
    required this.deviceId,
    required this.entries,
    required this.generatedAt,
  });

  /// Stable device identifier (e.g. UUID generated on first run).
  final String deviceId;

  /// Per-category sync entries.
  final List<DeviceSyncEntry> entries;

  final DateTime generatedAt;

  /// Categories that need a push or pull operation.
  List<SyncCategory> get pendingCategories => entries
      .where((e) => e.needsSync)
      .map((e) => e.category)
      .toList();

  /// True when no sync is needed.
  bool get isFullySynced => pendingCategories.isEmpty;

  @override
  List<Object?> get props => [deviceId, entries, generatedAt];
}
