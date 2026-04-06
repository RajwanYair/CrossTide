// Notification Service — Abstract interface + flutter_local_notifications impl.
//
// flutter_local_notifications v21+: initialize() and show() use named params.
// Windows: uses WindowsInitializationSettings (flutter_local_notifications_windows).
// Android: Notification channel with high importance.
import 'dart:io' show Platform;

import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:logger/logger.dart';

/// Abstract notification interface for testability.
abstract class INotificationService {
  Future<void> initialize({void Function(String? payload)? onTap});
  Future<void> showCrossUpAlert({
    required String ticker,
    required double close,
    required double sma200,
  });
  Future<void> showPriceTargetAlert({
    required String ticker,
    required double close,
    required double target,
  });
  Future<void> showPctMoveAlert({
    required String ticker,
    required double close,
    required double prevClose,
    required double thresholdPct,
  });

  /// Fires a volume spike notification.
  Future<void> showVolumeSpikeAlert({
    required String ticker,
    required double volume,
    required int avgVolume,
    required double ratio,
  });

  Future<void> cancelAll();
}

class LocalNotificationService implements INotificationService {
  LocalNotificationService({Logger? logger}) : _logger = logger ?? Logger();

  final Logger _logger;
  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  void Function(String? payload)? _onTap;

  static const _androidChannelId = 'cross_tide_cross_up';
  static const _androidChannelName = 'SMA200 Cross-Up Alerts';
  static const _androidChannelDesc =
      'Notifications when a stock crosses above its 200-day SMA';

  @override
  Future<void> initialize({void Function(String? payload)? onTap}) async {
    _onTap = onTap;

    const androidSettings = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );
    const linuxSettings = LinuxInitializationSettings(
      defaultActionName: 'Open',
    );
    const windowsSettings = WindowsInitializationSettings(
      appName: 'CrossTide',
      appUserModelId: 'com.crosstide.app',
      guid: '7a5a2a1b-3e4f-4c5d-8a9b-2c3d4e5f6a7b',
    );

    final initSettings = InitializationSettings(
      android: androidSettings,
      linux: Platform.isLinux ? linuxSettings : null,
      windows: Platform.isWindows ? windowsSettings : null,
    );

    await _plugin.initialize(
      settings: initSettings,
      onDidReceiveNotificationResponse: _handleNotificationTap,
    );

    // Request Android 13+ notification permission
    if (Platform.isAndroid) {
      final androidImpl = _plugin
          .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin
          >();
      if (androidImpl != null) {
        await androidImpl.requestNotificationsPermission();
      }
    }

    _logger.i('Notification service initialized');
  }

  void _handleNotificationTap(NotificationResponse response) {
    _logger.d('Notification tapped: ${response.payload}');
    _onTap?.call(response.payload);
  }

  @override
  Future<void> showCrossUpAlert({
    required String ticker,
    required double close,
    required double sma200,
  }) async {
    final id = ticker.hashCode.abs() % 100000;

    const androidDetails = AndroidNotificationDetails(
      _androidChannelId,
      _androidChannelName,
      channelDescription: _androidChannelDesc,
      importance: Importance.high,
      priority: Priority.high,
    );

    const details = NotificationDetails(android: androidDetails);

    try {
      await _plugin.show(
        id: id,
        title: '$ticker — SMA200 Cross-Up!',
        body:
            'Close: \$${close.toStringAsFixed(2)} crossed above '
            'SMA200: \$${sma200.toStringAsFixed(2)}',
        notificationDetails: details,
        payload: 'ticker:$ticker',
      );
      _logger.i('Notification shown for $ticker');
    } catch (e) {
      _logger.e('Failed to show notification for $ticker: $e');
    }
  }

  @override
  Future<void> showPriceTargetAlert({
    required String ticker,
    required double close,
    required double target,
  }) async {
    final id = (ticker.hashCode.abs() + target.hashCode.abs()) % 100000;
    const androidDetails = AndroidNotificationDetails(
      _androidChannelId,
      _androidChannelName,
      channelDescription: _androidChannelDesc,
      importance: Importance.high,
      priority: Priority.high,
    );
    const details = NotificationDetails(android: androidDetails);
    try {
      await _plugin.show(
        id: id,
        title: '$ticker — Price Target Hit! 🎯',
        body:
            'Close: \$${close.toStringAsFixed(2)} reached target '
            '\$${target.toStringAsFixed(2)}',
        notificationDetails: details,
        payload: 'ticker:$ticker',
      );
      _logger.i('Price target notification shown for $ticker @ \$$target');
    } catch (e) {
      _logger.e('Failed to show price target notification: $e');
    }
  }

  @override
  Future<void> showPctMoveAlert({
    required String ticker,
    required double close,
    required double prevClose,
    required double thresholdPct,
  }) async {
    final pct = ((close - prevClose) / prevClose) * 100;
    final sign = pct >= 0 ? '▲' : '▼';
    final id =
        (ticker.hashCode.abs() + thresholdPct.hashCode.abs() + 1) % 100000;
    const androidDetails = AndroidNotificationDetails(
      _androidChannelId,
      _androidChannelName,
      channelDescription: _androidChannelDesc,
      importance: Importance.high,
      priority: Priority.high,
    );
    const details = NotificationDetails(android: androidDetails);
    try {
      await _plugin.show(
        id: id,
        title: '$ticker — $sign${pct.abs().toStringAsFixed(1)}% Move!',
        body:
            'Close: \$${close.toStringAsFixed(2)} '
            '($sign${pct.abs().toStringAsFixed(1)}% from \$${prevClose.toStringAsFixed(2)})',
        notificationDetails: details,
        payload: 'ticker:$ticker',
      );
    } catch (e) {
      _logger.e('Failed to show pct-move notification: $e');
    }
  }

  @override
  Future<void> showVolumeSpikeAlert({
    required String ticker,
    required double volume,
    required int avgVolume,
    required double ratio,
  }) async {
    final id = (ticker.hashCode.abs() + 777) % 100000;
    const androidDetails = AndroidNotificationDetails(
      _androidChannelId,
      _androidChannelName,
      channelDescription: _androidChannelDesc,
      importance: Importance.high,
      priority: Priority.high,
    );
    const details = NotificationDetails(android: androidDetails);
    try {
      final volStr = volume >= 1e6
          ? '${(volume / 1e6).toStringAsFixed(1)}M'
          : '${(volume / 1e3).toStringAsFixed(0)}K';
      final avgStr = avgVolume >= 1e6
          ? '${(avgVolume / 1e6).toStringAsFixed(1)}M'
          : '${(avgVolume / 1e3).toStringAsFixed(0)}K';
      await _plugin.show(
        id: id,
        title: '$ticker — 📊 Volume Spike ${ratio.toStringAsFixed(1)}×!',
        body: 'Volume: $volStr vs 20-day avg: $avgStr',
        notificationDetails: details,
        payload: 'ticker:$ticker',
      );
      _logger.i(
        'Volume spike notification shown for $ticker (${ratio.toStringAsFixed(1)}×)',
      );
    } catch (e) {
      _logger.e('Failed to show volume spike notification: $e');
    }
  }

  @override
  Future<void> cancelAll() async {
    try {
      await _plugin.cancelAll();
    } catch (e) {
      // Windows: cancel may require MSIX package identity.
      _logger.w('cancelAll failed (expected on non-MSIX Windows): $e');
    }
  }
}
