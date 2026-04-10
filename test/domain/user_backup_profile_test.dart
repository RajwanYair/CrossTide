import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  final createdAt = DateTime(2026, 4, 10);

  group('UserBackupProfile', () {
    test('isFullBackup is true when all categories present', () {
      final profile = UserBackupProfile(
        profileId: 'bk-1',
        createdAt: createdAt,
        appVersion: '2.4.0',
        categories: BackupCategory.values.toSet(),
        watchlistTickers: const ['AAPL', 'MSFT'],
        settingsJson: '{}',
      );
      expect(profile.isFullBackup, isTrue);
    });

    test('hasWatchlist is true when watchlist category present', () {
      final profile = UserBackupProfile(
        profileId: 'bk-2',
        createdAt: createdAt,
        appVersion: '2.4.0',
        categories: const {BackupCategory.watchlist},
        watchlistTickers: const ['AAPL'],
        settingsJson: '{}',
      );
      expect(profile.hasWatchlist, isTrue);
      expect(profile.hasAlertProfiles, isFalse);
    });

    test('tickerCount returns watchlist length', () {
      final profile = UserBackupProfile(
        profileId: 'bk-3',
        createdAt: createdAt,
        appVersion: '2.4.0',
        categories: const {BackupCategory.watchlist},
        watchlistTickers: const ['AAPL', 'MSFT', 'GOOG'],
        settingsJson: '{}',
      );
      expect(profile.tickerCount, equals(3));
    });

    test('equality holds for same props', () {
      final a = UserBackupProfile(
        profileId: 'bk-4',
        createdAt: createdAt,
        appVersion: '2.0',
        categories: const {BackupCategory.appSettings},
        watchlistTickers: const [],
        settingsJson: '{}',
      );
      final b = UserBackupProfile(
        profileId: 'bk-4',
        createdAt: createdAt,
        appVersion: '2.0',
        categories: const {BackupCategory.appSettings},
        watchlistTickers: const [],
        settingsJson: '{}',
      );
      expect(a, equals(b));
    });
  });
}
