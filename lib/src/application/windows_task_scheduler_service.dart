/// Windows Task Scheduler Service — True OS-level background refresh.
///
/// Registers a Windows Scheduled Task via `schtasks.exe` that runs
/// the CrossTide executable in headless/refresh-only mode on a periodic
/// schedule, even when the app window is closed.
///
/// 100% open-source: no native plugins — uses `dart:io` Process to invoke
/// the built-in Windows `schtasks.exe` CLI.
///
/// On non-Windows platforms this is a no-op.
library;

import 'dart:io' show Platform, Process;

import 'package:logger/logger.dart';

const _taskName = 'CrossTide_BackgroundRefresh';

class WindowsTaskSchedulerService {
  WindowsTaskSchedulerService({Logger? logger}) : _logger = logger ?? Logger();

  final Logger _logger;

  /// Register a periodic Windows Scheduled Task.
  ///
  /// [intervalMinutes] — how often to run (min 15).
  /// [exePath] — full path to the CrossTide executable. Typically
  ///   `Platform.resolvedExecutable`.
  ///
  /// The task runs with the current user's credentials (no elevation needed)
  /// and passes `--background-refresh` as an argument so main.dart can
  /// detect headless mode and only run the refresh cycle.
  Future<bool> register({required int intervalMinutes, String? exePath}) async {
    if (!Platform.isWindows) return false;

    final exe = exePath ?? Platform.resolvedExecutable;
    final minutes = intervalMinutes.clamp(15, 1440);

    try {
      // Remove any existing task first (idempotent)
      await unregister();

      // Create the task
      //   /SC MINUTE /MO N = run every N minutes
      //   /TR "exe --background-refresh" = command to run
      //   /F = force creation even if task exists
      //   /RL LIMITED = run with standard (non-elevated) privileges
      final result = await Process.run('schtasks', [
        '/Create',
        '/TN',
        _taskName,
        '/SC',
        'MINUTE',
        '/MO',
        '$minutes',
        '/TR',
        '"$exe" --background-refresh',
        '/F',
        '/RL',
        'LIMITED',
      ]);

      if (result.exitCode == 0) {
        _logger.i(
          'Windows Scheduled Task "$_taskName" registered '
          '(every ${minutes}min)',
        );
        return true;
      } else {
        _logger.e(
          'schtasks /Create failed (exit ${result.exitCode}): '
          '${result.stderr}',
        );
        return false;
      }
    } catch (e, st) {
      _logger.e(
        'Failed to register Windows Scheduled Task',
        error: e,
        stackTrace: st,
      );
      return false;
    }
  }

  /// Remove the scheduled task. Safe to call even if no task exists.
  Future<bool> unregister() async {
    if (!Platform.isWindows) return false;

    try {
      final result = await Process.run('schtasks', [
        '/Delete',
        '/TN',
        _taskName,
        '/F',
      ]);

      // Exit code 0 = deleted, 1 = didn't exist — both fine
      if (result.exitCode == 0) {
        _logger.i('Windows Scheduled Task "$_taskName" removed');
      }
      return true;
    } catch (e) {
      _logger.w('Failed to remove scheduled task: $e');
      return false;
    }
  }

  /// Check whether the scheduled task currently exists.
  Future<bool> isRegistered() async {
    if (!Platform.isWindows) return false;

    try {
      final result = await Process.run('schtasks', [
        '/Query',
        '/TN',
        _taskName,
      ]);
      return result.exitCode == 0;
    } catch (_) {
      return false;
    }
  }

  /// Update the interval by re-registering the task.
  Future<bool> updateInterval(int minutes) async {
    return register(intervalMinutes: minutes);
  }
}
