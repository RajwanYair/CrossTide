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

  /// Fires a Micho Method BUY notification.
  Future<void> showMichoBuyAlert({
    required String ticker,
    required double close,
    required double sma150,
  });

  /// Fires a Micho Method SELL notification.
  Future<void> showMichoSellAlert({
    required String ticker,
    required double close,
    required double sma150,
  });

  /// Fires a Consensus BUY notification (Micho + other methods agree).
  Future<void> showConsensusBuyAlert({
    required String ticker,
    required double close,
    required String description,
  });

  /// Fires a Consensus SELL notification (Micho + other methods agree).
  Future<void> showConsensusSellAlert({
    required String ticker,
    required double close,
    required String description,
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

  /// Common helper — all public show* methods delegate here.
  Future<void> _showAlert({
    required int id,
    required String title,
    required String body,
    required String ticker,
    String? logLabel,
  }) async {
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
        title: title,
        body: body,
        notificationDetails: details,
        payload: 'ticker:$ticker',
      );
      _logger.i(logLabel ?? 'Notification shown for $ticker');
    } catch (e) {
      _logger.e('Failed to show notification for $ticker: $e');
    }
  }

  @override
  Future<void> showCrossUpAlert({
    required String ticker,
    required double close,
    required double sma200,
  }) => _showAlert(
    id: ticker.hashCode.abs() % 100000,
    title: '$ticker — SMA200 Cross-Up!',
    body:
        'Close: \$${close.toStringAsFixed(2)} crossed above '
        'SMA200: \$${sma200.toStringAsFixed(2)}',
    ticker: ticker,
  );

  @override
  Future<void> showPriceTargetAlert({
    required String ticker,
    required double close,
    required double target,
  }) => _showAlert(
    id: (ticker.hashCode.abs() + target.hashCode.abs()) % 100000,
    title: '$ticker — Price Target Hit! 🎯',
    body:
        'Close: \$${close.toStringAsFixed(2)} reached target '
        '\$${target.toStringAsFixed(2)}',
    ticker: ticker,
    logLabel: 'Price target notification shown for $ticker @ \$$target',
  );

  @override
  Future<void> showPctMoveAlert({
    required String ticker,
    required double close,
    required double prevClose,
    required double thresholdPct,
  }) async {
    final pct = ((close - prevClose) / prevClose) * 100;
    final sign = pct >= 0 ? '▲' : '▼';
    await _showAlert(
      id: (ticker.hashCode.abs() + thresholdPct.hashCode.abs() + 1) % 100000,
      title: '$ticker — $sign${pct.abs().toStringAsFixed(1)}% Move!',
      body:
          'Close: \$${close.toStringAsFixed(2)} '
          '($sign${pct.abs().toStringAsFixed(1)}% from \$${prevClose.toStringAsFixed(2)})',
      ticker: ticker,
    );
  }

  @override
  Future<void> showVolumeSpikeAlert({
    required String ticker,
    required double volume,
    required int avgVolume,
    required double ratio,
  }) async {
    final volStr = volume >= 1e6
        ? '${(volume / 1e6).toStringAsFixed(1)}M'
        : '${(volume / 1e3).toStringAsFixed(0)}K';
    final avgStr = avgVolume >= 1e6
        ? '${(avgVolume / 1e6).toStringAsFixed(1)}M'
        : '${(avgVolume / 1e3).toStringAsFixed(0)}K';
    await _showAlert(
      id: (ticker.hashCode.abs() + 777) % 100000,
      title: '$ticker — 📊 Volume Spike ${ratio.toStringAsFixed(1)}×!',
      body: 'Volume: $volStr vs 20-day avg: $avgStr',
      ticker: ticker,
      logLabel:
          'Volume spike notification shown for $ticker (${ratio.toStringAsFixed(1)}×)',
    );
  }

  @override
  Future<void> showMichoBuyAlert({
    required String ticker,
    required double close,
    required double sma150,
  }) => _showAlert(
    id: (ticker.hashCode.abs() + 150) % 100000,
    title: '$ticker — Micho Method BUY 📈',
    body:
        'Close: \$${close.toStringAsFixed(2)} crossed above '
        'MA150: \$${sma150.toStringAsFixed(2)}',
    ticker: ticker,
    logLabel: 'Micho BUY notification shown for $ticker',
  );

  @override
  Future<void> showMichoSellAlert({
    required String ticker,
    required double close,
    required double sma150,
  }) => _showAlert(
    id: (ticker.hashCode.abs() + 151) % 100000,
    title: '$ticker — Micho Method SELL 📉',
    body:
        'Close: \$${close.toStringAsFixed(2)} crossed below '
        'MA150: \$${sma150.toStringAsFixed(2)}',
    ticker: ticker,
    logLabel: 'Micho SELL notification shown for $ticker',
  );

  @override
  Future<void> showConsensusBuyAlert({
    required String ticker,
    required double close,
    required String description,
  }) => _showAlert(
    id: (ticker.hashCode.abs() + 200) % 100000,
    title: '$ticker — ✅ Consensus BUY',
    body: 'Close: \$${close.toStringAsFixed(2)} — $description',
    ticker: ticker,
    logLabel: 'Consensus BUY notification shown for $ticker',
  );

  @override
  Future<void> showConsensusSellAlert({
    required String ticker,
    required double close,
    required String description,
  }) => _showAlert(
    id: (ticker.hashCode.abs() + 201) % 100000,
    title: '$ticker — 🔴 Consensus SELL',
    body: 'Close: \$${close.toStringAsFixed(2)} — $description',
    ticker: ticker,
    logLabel: 'Consensus SELL notification shown for $ticker',
  );

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
