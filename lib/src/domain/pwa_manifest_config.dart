/// PWA Manifest Config — Progressive Web App manifest metadata for the web target.
library;

import 'package:equatable/equatable.dart';

/// How the PWA is displayed when launched from the home screen.
enum PwaDisplayMode {
  /// Standalone app window without browser chrome.
  standalone,

  /// Full-screen with no system UI.
  fullscreen,

  /// Minimal browser UI (back/forward buttons only).
  minimalUi,

  /// Regular browser tab.
  browser,
}

/// Preferred screen orientation for the PWA.
enum PwaOrientation {
  /// System determines orientation.
  any,

  /// Lock to portrait.
  portrait,

  /// Lock to landscape.
  landscape,
}

/// A quick-action shortcut shown in the PWA install menu.
class PwaShortcutAction extends Equatable {
  const PwaShortcutAction({
    required this.name,
    required this.urlPath,
    required this.description,
  });

  /// Label displayed in the shortcut list.
  final String name;

  /// Relative URL path (e.g. '/watchlist', '/alerts').
  final String urlPath;

  final String description;

  @override
  List<Object?> get props => [name, urlPath, description];
}

/// Full Progressive Web App manifest configuration.
class PwaManifestConfig extends Equatable {
  const PwaManifestConfig({
    required this.name,
    required this.shortName,
    required this.themeColor,
    required this.backgroundColor,
    required this.displayMode,
    required this.orientation,
    required this.shortcuts,
    this.startUrl = '/',
  });

  /// Sensible defaults for the CrossTide web companion.
  factory PwaManifestConfig.defaults() => const PwaManifestConfig(
    name: 'CrossTide',
    shortName: 'CrossTide',
    themeColor: '#1565C0',
    backgroundColor: '#0D1117',
    displayMode: PwaDisplayMode.standalone,
    orientation: PwaOrientation.any,
    shortcuts: [],
  );

  /// Full application name.
  final String name;

  /// Short name for home-screen icon labels (≤ 12 chars recommended).
  final String shortName;

  /// CSS hex colour for the browser/OS chrome (e.g. '#1565C0').
  final String themeColor;

  /// Splash-screen background colour.
  final String backgroundColor;

  final PwaDisplayMode displayMode;
  final PwaOrientation orientation;

  /// Optional quick-action shortcuts.
  final List<PwaShortcutAction> shortcuts;

  /// Start URL relative to the app root (default '/').
  final String startUrl;

  @override
  List<Object?> get props => [
    name,
    shortName,
    themeColor,
    backgroundColor,
    displayMode,
    orientation,
    shortcuts,
    startUrl,
  ];
}
