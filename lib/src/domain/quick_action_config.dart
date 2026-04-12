import 'package:equatable/equatable.dart';

/// Platform for which this quick action is defined.
enum QuickActionPlatform { android, windows, all }

/// A home-screen or taskbar quick action shortcut configuration.
class QuickActionConfig extends Equatable {
  const QuickActionConfig({
    required this.actionId,
    required this.label,
    required this.iconAssetPath,
    required this.deepLinkTarget,
    required this.platform,
    required this.displayOrder,
    this.enabled = true,
    this.shortcutType,
  });

  final String actionId;
  final String label;
  final String iconAssetPath;

  /// Deep link URI triggered when this action is tapped.
  final String deepLinkTarget;

  final QuickActionPlatform platform;

  /// Display order among quick actions (1-based).
  final int displayOrder;

  final bool enabled;

  /// Platform-specific shortcut type identifier.
  final String? shortcutType;

  QuickActionConfig copyWith({
    String? actionId,
    String? label,
    String? iconAssetPath,
    String? deepLinkTarget,
    QuickActionPlatform? platform,
    int? displayOrder,
    bool? enabled,
    String? shortcutType,
  }) => QuickActionConfig(
    actionId: actionId ?? this.actionId,
    label: label ?? this.label,
    iconAssetPath: iconAssetPath ?? this.iconAssetPath,
    deepLinkTarget: deepLinkTarget ?? this.deepLinkTarget,
    platform: platform ?? this.platform,
    displayOrder: displayOrder ?? this.displayOrder,
    enabled: enabled ?? this.enabled,
    shortcutType: shortcutType ?? this.shortcutType,
  );

  @override
  List<Object?> get props => [
    actionId,
    label,
    iconAssetPath,
    deepLinkTarget,
    platform,
    displayOrder,
    enabled,
    shortcutType,
  ];
}
