import 'package:equatable/equatable.dart';

/// A per-platform rendering performance budget specifying frame-time and
/// jank detection thresholds.
class PlatformPerformanceBudget extends Equatable {
  const PlatformPerformanceBudget({
    required this.platformName,
    required this.targetFrameTimeMs,
    required this.jankThresholdMs,
    required this.maxDroppedFramesPerSecond,
    required this.memoryCeilingMb,
    required this.startupTimeBudgetMs,
  });

  /// Platform name, e.g. "Android", "Windows".
  final String platformName;

  /// Target frame render time (typically 16.6 ms for 60 fps).
  final double targetFrameTimeMs;

  /// Frame time above which a frame is classified as janky.
  final double jankThresholdMs;

  /// Maximum tolerated janky frames per second.
  final int maxDroppedFramesPerSecond;

  /// Maximum app memory footprint in megabytes.
  final int memoryCeilingMb;

  /// Maximum time from cold start to first meaningful frame (ms).
  final int startupTimeBudgetMs;

  PlatformPerformanceBudget copyWith({
    String? platformName,
    double? targetFrameTimeMs,
    double? jankThresholdMs,
    int? maxDroppedFramesPerSecond,
    int? memoryCeilingMb,
    int? startupTimeBudgetMs,
  }) => PlatformPerformanceBudget(
    platformName: platformName ?? this.platformName,
    targetFrameTimeMs: targetFrameTimeMs ?? this.targetFrameTimeMs,
    jankThresholdMs: jankThresholdMs ?? this.jankThresholdMs,
    maxDroppedFramesPerSecond:
        maxDroppedFramesPerSecond ?? this.maxDroppedFramesPerSecond,
    memoryCeilingMb: memoryCeilingMb ?? this.memoryCeilingMb,
    startupTimeBudgetMs: startupTimeBudgetMs ?? this.startupTimeBudgetMs,
  );

  @override
  List<Object?> get props => [
    platformName,
    targetFrameTimeMs,
    jankThresholdMs,
    maxDroppedFramesPerSecond,
    memoryCeilingMb,
    startupTimeBudgetMs,
  ];
}
