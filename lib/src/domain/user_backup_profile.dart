import 'package:equatable/equatable.dart';

/// Categories of settings included in a user backup profile.
enum BackupCategory {
  watchlist,
  alertProfiles,
  appSettings,
  chartPreferences,
  screenerPresets,
}

/// Serialisable snapshot of all user-configurable preferences,
/// suitable for export/import or cloud backup.
class UserBackupProfile extends Equatable {
  const UserBackupProfile({
    required this.profileId,
    required this.createdAt,
    required this.appVersion,
    required this.categories,
    required this.watchlistTickers,
    required this.settingsJson,
    this.deviceId,
  });

  final String profileId;
  final DateTime createdAt;

  /// App semantic version when the backup was taken.
  final String appVersion;

  /// Which categories are represented in this backup.
  final Set<BackupCategory> categories;

  final List<String> watchlistTickers;

  /// JSON-encoded settings payload.
  final String settingsJson;

  final String? deviceId;

  bool get hasWatchlist => categories.contains(BackupCategory.watchlist);

  bool get hasAlertProfiles =>
      categories.contains(BackupCategory.alertProfiles);

  bool get isFullBackup => categories.length == BackupCategory.values.length;

  int get tickerCount => watchlistTickers.length;

  @override
  List<Object?> get props => [
    profileId,
    createdAt,
    appVersion,
    categories,
    watchlistTickers,
    settingsJson,
    deviceId,
  ];
}
