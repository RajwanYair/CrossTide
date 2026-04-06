import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../providers.dart';

/// Full-page audit log — shows every recorded settings change.
///
/// Entries are shown newest-first.  User can clear the log via the overflow
/// action.  The screen auto-refreshes when navigated to (provider invalidation).
class AuditLogScreen extends ConsumerWidget {
  const AuditLogScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final logAsync = ref.watch(auditLogProvider);
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Audit Log'),
        actions: [
          PopupMenuButton<String>(
            onSelected: (v) async {
              if (v == 'clear') {
                final ok = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Clear Audit Log?'),
                    content: const Text(
                      'All recorded settings changes will be permanently deleted.',
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, false),
                        child: const Text('Cancel'),
                      ),
                      FilledButton.tonal(
                        style: FilledButton.styleFrom(
                          backgroundColor: Colors.red.shade50,
                          foregroundColor: Colors.red.shade800,
                        ),
                        onPressed: () => Navigator.pop(ctx, true),
                        child: const Text('Clear'),
                      ),
                    ],
                  ),
                );
                if (ok == true && context.mounted) {
                  final service = ref.read(auditLogServiceProvider);
                  await service.clear();
                  ref.invalidate(auditLogProvider);
                }
              }
            },
            itemBuilder: (_) => const [
              PopupMenuItem(
                value: 'clear',
                child: Row(
                  children: [
                    Icon(Icons.delete_sweep_rounded, size: 18),
                    SizedBox(width: 8),
                    Text('Clear log'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: logAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (entries) {
          if (entries.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.history_edu_rounded, size: 64, color: cs.outline),
                  const SizedBox(height: 16),
                  Text(
                    'No changes recorded yet',
                    style: textTheme.bodyLarge?.copyWith(color: cs.outline),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Settings changes will appear here',
                    style: textTheme.bodySmall?.copyWith(color: cs.outline),
                  ),
                ],
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
            itemCount: entries.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (context, i) {
              final e = entries[i];
              final timeLabel = DateFormat(
                'MMM d, HH:mm:ss',
              ).format(e.timestamp.toLocal());
              return ListTile(
                dense: true,
                leading: CircleAvatar(
                  radius: 16,
                  backgroundColor: cs.primaryContainer,
                  child: Icon(
                    Icons.edit_note_rounded,
                    size: 16,
                    color: cs.onPrimaryContainer,
                  ),
                ),
                title: Text(
                  e.field,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (e.screen.isNotEmpty)
                      Text(
                        e.screen,
                        style: TextStyle(
                          fontSize: 11,
                          color: cs.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    RichText(
                      text: TextSpan(
                        style: TextStyle(
                          fontSize: 12,
                          color: cs.onSurfaceVariant,
                        ),
                        children: [
                          TextSpan(
                            text: e.oldValue.isEmpty ? '(empty)' : e.oldValue,
                            style: const TextStyle(
                              color: Colors.red,
                              decoration: TextDecoration.lineThrough,
                              decorationColor: Colors.red,
                            ),
                          ),
                          const TextSpan(text: '  →  '),
                          TextSpan(
                            text: e.newValue.isEmpty ? '(empty)' : e.newValue,
                            style: const TextStyle(color: Colors.green),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                trailing: Text(
                  timeLabel,
                  style: TextStyle(fontSize: 10, color: cs.outline),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
