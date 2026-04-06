/// System Tray Service — Windows system tray integration.
///
/// When the user closes the window, the app minimizes to the system tray
/// instead of quitting, keeping the refresh timer alive. Provides a tray
/// menu with: Show, Refresh Now, and Quit actions.
///
/// Uses `tray_manager` (MIT, pure Dart/FFI — no uuid conflicts).
/// On non-Windows platforms this is a no-op.
library;

import 'dart:io' show Platform;

import 'package:flutter/widgets.dart';
import 'package:logger/logger.dart';
import 'package:tray_manager/tray_manager.dart';

/// Manages the Windows system tray icon, tooltip, and context menu.
class SystemTrayService with TrayListener {
  SystemTrayService({
    Logger? logger,
    this.onShow,
    this.onRefreshNow,
    this.onQuit,
  }) : _logger = logger ?? Logger();

  final Logger _logger;

  /// Callback to bring the Flutter window back to the foreground.
  final VoidCallback? onShow;

  /// Callback to trigger an immediate refresh of all tickers.
  final Future<void> Function()? onRefreshNow;

  /// Callback to fully quit the application.
  final VoidCallback? onQuit;

  bool _initialized = false;

  /// Initialize the system tray icon. No-op on non-Windows platforms.
  Future<void> initialize() async {
    if (!Platform.isWindows) return;

    try {
      trayManager.addListener(this);

      await trayManager.setIcon('windows/runner/resources/app_icon.ico');
      await trayManager.setToolTip('CrossTide — SMA Crossover Monitor');

      await _buildMenu();
      _initialized = true;
      _logger.i('System tray initialized');
    } catch (e, st) {
      _logger.e('Failed to initialize system tray', error: e, stackTrace: st);
    }
  }

  Future<void> _buildMenu() async {
    final menu = Menu(
      items: [
        MenuItem(key: 'show', label: '📈 Show CrossTide'),
        MenuItem.separator(),
        MenuItem(key: 'refresh', label: '🔄 Refresh Now'),
        MenuItem.separator(),
        MenuItem(key: 'quit', label: '🚪 Quit'),
      ],
    );
    await trayManager.setContextMenu(menu);
  }

  @override
  void onTrayIconMouseDown() {
    // Left-click: bring window to front
    onShow?.call();
  }

  @override
  void onTrayIconRightMouseDown() {
    trayManager.popUpContextMenu();
  }

  @override
  void onTrayMenuItemClick(MenuItem menuItem) {
    switch (menuItem.key) {
      case 'show':
        onShow?.call();
      case 'refresh':
        onRefreshNow?.call();
      case 'quit':
        onQuit?.call();
    }
  }

  /// Release tray resources. Call on app shutdown.
  Future<void> dispose() async {
    if (!_initialized) return;
    trayManager.removeListener(this);
    await trayManager.destroy();
    _logger.i('System tray disposed');
  }
}
