/// Crash Log Viewer — displays the on-disk crash.log file.
library;

import 'dart:io' show File;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../application/crash_log_service.dart';

class CrashLogScreen extends StatefulWidget {
  const CrashLogScreen({super.key});

  @override
  State<CrashLogScreen> createState() => _CrashLogScreenState();
}

class _CrashLogScreenState extends State<CrashLogScreen> {
  String? _content;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final path = CrashLogService.instance.logPath;
    if (path == null) {
      setState(() {
        _content = null;
        _loading = false;
      });
      return;
    }
    try {
      final file = File(path);
      final exists = await file.exists();
      if (!exists) {
        setState(() {
          _content = '';
          _loading = false;
        });
        return;
      }
      final raw = await file.readAsString();
      setState(() {
        _content = raw;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _content = 'Error reading log: $e';
        _loading = false;
      });
    }
  }

  Future<void> _clear(BuildContext context) async {
    final path = CrashLogService.instance.logPath;
    if (path == null) return;
    try {
      final file = File(path);
      if (await file.exists()) await file.delete();
    } catch (_) {}
    await _load();
    if (context.mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Crash log cleared')));
    }
  }

  void _copyToClipboard(BuildContext context) {
    final text = _content;
    if (text == null || text.isEmpty) return;
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Log copied to clipboard')));
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Crash Logs'),
        actions: [
          if (!_loading && _content != null && _content!.isNotEmpty) ...[
            IconButton(
              tooltip: 'Copy to clipboard',
              icon: const Icon(Icons.copy_rounded),
              onPressed: () => _copyToClipboard(context),
            ),
            IconButton(
              tooltip: 'Clear log',
              icon: const Icon(Icons.delete_sweep_rounded),
              onPressed: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Clear crash log?'),
                    content: const Text(
                      'This permanently deletes all crash reports.',
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, false),
                        child: const Text('Cancel'),
                      ),
                      FilledButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        child: const Text('Clear'),
                      ),
                    ],
                  ),
                );
                if (confirm == true && context.mounted) {
                  await _clear(context);
                }
              },
            ),
          ],
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : (_content == null || _content!.isEmpty)
          ? _EmptyState(hasPath: _content != null)
          : SingleChildScrollView(
              padding: const EdgeInsets.all(12),
              child: SelectableText(
                _content!,
                style: TextStyle(
                  fontFamily: 'monospace',
                  fontSize: 11.5,
                  height: 1.55,
                  color: cs.onSurface,
                ),
              ),
            ),
    );
  }
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.hasPath});

  /// true  = log exists but is empty; false = service not yet initialized
  final bool hasPath;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.bug_report_outlined, size: 72, color: cs.outlineVariant),
            const SizedBox(height: 16),
            Text(
              hasPath ? 'No crash reports yet' : 'Log file not initialized',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(color: cs.outline),
            ),
            const SizedBox(height: 8),
            Text(
              hasPath
                  ? 'Great news — the app has not crashed!'
                  : 'Restart the app and try again.',
              style: TextStyle(color: cs.outlineVariant),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
