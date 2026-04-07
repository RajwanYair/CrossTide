/// Alert History Screen — timeline of all fired alerts.
library;

import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../application/alert_history_exporter.dart';
import '../../domain/alert_metrics_calculator.dart';
import '../../domain/cross_up_anomaly_detector.dart';
import '../../domain/entities.dart';
import '../providers.dart';

// Date formatter used throughout this screen.
final _dateFmt = DateFormat('MMM d, yyyy h:mm a');

class AlertHistoryScreen extends ConsumerWidget {
  const AlertHistoryScreen({super.key});

  static const routeName = '/alert-history';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(alertHistoryProvider);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Alert History'),
        actions: [
          historyAsync.when(
            data: (entries) => entries.isEmpty
                ? const SizedBox.shrink()
                : PopupMenuButton<String>(
                    icon: const Icon(Icons.more_vert_rounded),
                    itemBuilder: (_) => [
                      const PopupMenuItem(
                        value: 'csv',
                        child: ListTile(
                          leading: Icon(Icons.table_chart_rounded),
                          title: Text('Export CSV'),
                          dense: true,
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'json',
                        child: ListTile(
                          leading: Icon(Icons.data_object_rounded),
                          title: Text('Export JSON'),
                          dense: true,
                        ),
                      ),
                      const PopupMenuDivider(),
                      const PopupMenuItem(
                        value: 'metrics',
                        child: ListTile(
                          leading: Icon(Icons.analytics_rounded),
                          title: Text('Export Metrics JSON'),
                          dense: true,
                        ),
                      ),
                      const PopupMenuDivider(),
                      const PopupMenuItem(
                        value: 'clear',
                        child: ListTile(
                          leading: Icon(Icons.delete_sweep_rounded),
                          title: Text('Clear all'),
                          dense: true,
                        ),
                      ),
                    ],
                    onSelected: (v) {
                      if (v == 'clear') {
                        _confirmClear(context, ref);
                      } else if (v == 'metrics') {
                        _exportMetrics(context, ref);
                      } else {
                        _export(
                          context,
                          ref,
                          format: v == 'csv'
                              ? ExportFormat.csv
                              : ExportFormat.json,
                        );
                      }
                    },
                  ),
            loading: () => const SizedBox.shrink(),
            error: (_, _) => const SizedBox.shrink(),
          ),
        ],
      ),
      body: historyAsync.when(
        data: (entries) {
          if (entries.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.notifications_none_rounded,
                    size: 64,
                    color: colorScheme.onSurface.withValues(alpha: 0.3),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No alerts fired yet',
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: colorScheme.onSurface.withValues(alpha: 0.5),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Fired alerts will appear here',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurface.withValues(alpha: 0.4),
                    ),
                  ),
                ],
              ),
            );
          }

          final anomalies = ref.watch(crossUpAnomaliesProvider);
          final metrics = ref.watch(alertMetricsProvider);

          return Column(
            children: [
              if (anomalies.isNotEmpty) _AnomalyBanner(anomalies: anomalies),
              if (metrics.isNotEmpty) _MetricsSummaryCard(metrics: metrics),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: entries.length,
                  itemBuilder: (ctx, i) =>
                      _HistoryTile(entry: entries[i], index: i)
                          .animate(delay: Duration(milliseconds: i * 30))
                          .fadeIn(duration: 250.ms)
                          .slideX(begin: 0.05, end: 0, duration: 250.ms),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err')),
      ),
    );
  }

  Future<void> _exportMetrics(BuildContext context, WidgetRef ref) async {
    try {
      final metrics = ref.read(alertMetricsProvider);
      final payload = metrics
          .map(
            (m) => {
              'symbol': m.symbol,
              'alertCount': m.alertCount,
              'firstAlertAt': m.firstAlertAt?.toIso8601String(),
              'lastAlertAt': m.lastAlertAt?.toIso8601String(),
              'meanDaysBetweenAlerts': m.meanDaysBetweenAlerts,
            },
          )
          .toList();
      final json = const JsonEncoder.withIndent('  ').convert(payload);
      final tempDir = Platform.environment['TEMP'] ?? Directory.systemTemp.path;
      final ts = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
      final file = File('$tempDir/crosstide_metrics_$ts.json');
      await file.writeAsString(json, flush: true);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Metrics exported: ${file.path}',
              overflow: TextOverflow.ellipsis,
            ),
            duration: const Duration(seconds: 6),
            action: SnackBarAction(
              label: 'Copy',
              onPressed: () =>
                  Clipboard.setData(ClipboardData(text: file.path)),
            ),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Metrics export failed: $e')));
      }
    }
  }

  Future<void> _export(
    BuildContext context,
    WidgetRef ref, {
    required ExportFormat format,
  }) async {
    try {
      final entries = await ref.read(alertHistoryProvider.future);
      final path = await AlertHistoryExporter.export(entries, format: format);

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Exported to: $path',
              overflow: TextOverflow.ellipsis,
            ),
            duration: const Duration(seconds: 6),
            action: SnackBarAction(
              label: 'Copy path',
              onPressed: () => Clipboard.setData(ClipboardData(text: path)),
            ),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Export failed: $e')));
      }
    }
  }

  Future<void> _confirmClear(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear Alert History'),
        content: const Text(
          'This will permanently delete all history entries. '
          'This cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(ctx).colorScheme.error,
            ),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Clear'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      final repo = await ref.read(repositoryProvider.future);
      await repo.clearAlertHistory();
    }
  }
}

// ---------------------------------------------------------------------------
// Tile
// ---------------------------------------------------------------------------

class _HistoryTile extends ConsumerWidget {
  const _HistoryTile({required this.entry, required this.index});

  final AlertHistoryEntry entry;
  final int index;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Dismissible(
      key: ValueKey(entry.id ?? '${entry.symbol}-${entry.firedAt}'),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 24),
        color: colorScheme.errorContainer,
        child: Icon(Icons.delete_rounded, color: colorScheme.error),
      ),
      direction: DismissDirection.endToStart,
      onDismissed: (_) async {
        if (entry.id != null) {
          final repo = await ref.read(repositoryProvider.future);
          await repo.acknowledgeAlertHistory(entry.id!);
        }
      },
      child: Card(
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        elevation: entry.acknowledged ? 0 : 1,
        color: entry.acknowledged
            ? colorScheme.surface
            : colorScheme.surfaceContainerHighest,
        child: ListTile(
          leading: _AlertIcon(alertType: entry.alertType),
          title: Row(
            children: [
              Expanded(
                child: Text(
                  entry.symbol,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: entry.acknowledged
                        ? colorScheme.onSurface.withValues(alpha: 0.5)
                        : colorScheme.onSurface,
                  ),
                ),
              ),
              Text(
                _alertTypeLabel(entry.alertType),
                style: theme.textTheme.labelSmall?.copyWith(
                  color: _alertColor(context, entry.alertType),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                entry.message,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: entry.acknowledged
                      ? colorScheme.onSurface.withValues(alpha: 0.4)
                      : null,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                _dateFmt.format(entry.firedAt.toLocal()),
                style: theme.textTheme.labelSmall?.copyWith(
                  color: colorScheme.onSurface.withValues(alpha: 0.5),
                ),
              ),
            ],
          ),
          trailing: entry.acknowledged
              ? Icon(
                  Icons.check_circle_outline_rounded,
                  size: 18,
                  color: colorScheme.onSurface.withValues(alpha: 0.3),
                )
              : null,
          onTap: entry.acknowledged || entry.id == null
              ? null
              : () async {
                  final repo = await ref.read(repositoryProvider.future);
                  await repo.acknowledgeAlertHistory(entry.id!);
                },
        ),
      ),
    );
  }

  String _alertTypeLabel(String alertType) {
    for (final t in AlertType.values) {
      if (t.name == alertType) return t.displayName;
    }
    return alertType;
  }

  Color _alertColor(BuildContext ctx, String alertType) {
    final cs = Theme.of(ctx).colorScheme;
    return switch (alertType) {
      'sma200CrossUp' || 'sma150CrossUp' || 'sma50CrossUp' => cs.primary,
      'goldenCross' => Colors.amber.shade700,
      'deathCross' => cs.error,
      'priceTarget' => Colors.teal.shade700,
      'pctMove' => Colors.blue.shade700,
      'volumeSpike' => Colors.purple.shade700,
      _ => cs.secondary,
    };
  }
}

// ---------------------------------------------------------------------------
// Alert type icon badge
// ---------------------------------------------------------------------------

class _AlertIcon extends StatelessWidget {
  const _AlertIcon({required this.alertType});
  final String alertType;

  @override
  Widget build(BuildContext context) {
    final (icon, color) = switch (alertType) {
      'sma200CrossUp' ||
      'sma150CrossUp' ||
      'sma50CrossUp' => (Icons.trending_up_rounded, Colors.green.shade700),
      'goldenCross' => (Icons.auto_awesome_rounded, Colors.amber.shade700),
      'deathCross' => (Icons.trending_down_rounded, Colors.red.shade700),
      'priceTarget' => (Icons.gps_fixed_rounded, Colors.teal.shade700),
      'pctMove' => (Icons.swap_vert_rounded, Colors.blue.shade700),
      'volumeSpike' => (Icons.bar_chart_rounded, Colors.purple.shade700),
      _ => (Icons.notifications_rounded, Colors.grey),
    };

    return CircleAvatar(
      radius: 20,
      backgroundColor: color.withValues(alpha: 0.15),
      child: Icon(icon, size: 20, color: color),
    );
  }
}

// ---------------------------------------------------------------------------
// Metrics summary
// ---------------------------------------------------------------------------

/// Compact card showing per-ticker alert counts and mean days between alerts.
class _MetricsSummaryCard extends StatelessWidget {
  const _MetricsSummaryCard({required this.metrics});

  final List<AlertMetrics> metrics;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    return Card(
      margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
      child: ExpansionTile(
        leading: Icon(Icons.analytics_rounded, color: cs.primary),
        title: Text(
          'Metrics Summary',
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        subtitle: Text(
          '${metrics.length} ticker${metrics.length == 1 ? '' : 's'} with alert history',
          style: theme.textTheme.labelSmall?.copyWith(
            color: cs.onSurface.withValues(alpha: 0.6),
          ),
        ),
        children: [
          for (final AlertMetrics m in metrics) _MetricsRow(metrics: m),
          const SizedBox(height: 4),
        ],
      ),
    );
  }
}

class _MetricsRow extends StatelessWidget {
  const _MetricsRow({required this.metrics});

  final AlertMetrics metrics;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final double? meanDays = metrics.meanDaysBetweenAlerts;
    final String meanLabel = meanDays == null
        ? '—'
        : '${meanDays.toStringAsFixed(1)} d';
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Row(
        children: [
          Expanded(
            child: Text(
              metrics.symbol,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          _Chip(
            label:
                '${metrics.alertCount} alert${metrics.alertCount == 1 ? '' : 's'}',
            color: cs.primaryContainer,
            textColor: cs.onPrimaryContainer,
          ),
          const SizedBox(width: 8),
          _Chip(
            label: 'Avg $meanLabel',
            color: cs.secondaryContainer,
            textColor: cs.onSecondaryContainer,
          ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({
    required this.label,
    required this.color,
    required this.textColor,
  });

  final String label;
  final Color color;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Anomaly banner
// ---------------------------------------------------------------------------

/// Shown at the top of the alert history list when the anomaly detector finds
/// repeated cross-up events within a 24-hour window.
class _AnomalyBanner extends StatelessWidget {
  const _AnomalyBanner({required this.anomalies});

  final List<CrossUpAnomaly> anomalies;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final syms = anomalies.map((a) => a.symbol).toSet().join(', ');
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: cs.errorContainer.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(
            Icons.warning_amber_rounded,
            size: 22,
            color: cs.onErrorContainer,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              '⚠ Repeated cross-up alerts detected for: $syms\n'
              'Consider increasing TTL or switching to Conservative profile.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: cs.onErrorContainer,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
