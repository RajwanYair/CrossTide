import 'package:equatable/equatable.dart';

/// Configuration for a static chart layout preset.
///
/// Controls visible panels, indicator placement, and panel sizing ratios
/// so that users can save and switch between preferred chart arrangements.
class ChartLayoutConfig extends Equatable {
  /// Creates a [ChartLayoutConfig].
  const ChartLayoutConfig({
    required this.layoutId,
    required this.name,
    required this.mainPanelIndicators,
    required this.subPanels,
    this.isDefault = false,
  });

  /// Unique identifier for this layout.
  final String layoutId;

  /// Human-readable name (e.g. `'Multi-Method View'`).
  final String name;

  /// Indicator keys rendered directly on the main price panel.
  final List<String> mainPanelIndicators;

  /// Ordered list of sub-panel keys shown below the main panel.
  final List<String> subPanels;

  /// Whether this layout is the user's active default.
  final bool isDefault;

  /// Total number of panels (main + sub-panels).
  int get totalPanels => 1 + subPanels.length;

  @override
  List<Object?> get props => [
    layoutId,
    name,
    mainPanelIndicators,
    subPanels,
    isDefault,
  ];
}
