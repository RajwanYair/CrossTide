/// Earnings Calendar Screen — upcoming earnings dates for watchlist tickers.
library;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../data/database/database.dart' show Ticker;
import '../providers.dart';

// ---------------------------------------------------------------------------
// Grouping helpers
// ---------------------------------------------------------------------------

enum _EarningsBucket {
  thisWeek,
  thisMonth,
  nextQuarter,
  later;

  String get label => switch (this) {
    thisWeek => 'This Week',
    thisMonth => 'This Month',
    nextQuarter => 'Next Quarter',
    later => 'Later',
  };

  static _EarningsBucket forDays(int days) {
    if (days <= 7) return thisWeek;
    if (days <= 30) return thisMonth;
    if (days <= 90) return nextQuarter;
    return later;
  }
}

class _EarningsItem {
  const _EarningsItem({required this.ticker, required this.daysUntil});

  final Ticker ticker;
  final int daysUntil;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class EarningsScreen extends ConsumerWidget {
  const EarningsScreen({super.key});

  static const routeName = '/earnings';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tickersAsync = ref.watch(tickerListProvider);
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Earnings Calendar')),
      body: tickersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err')),
        data: (tickers) {
          final today = DateTime.now().toLocal();
          final todayNorm = DateTime(today.year, today.month, today.day);

          // Filter to tickers with a future (or today) earnings date.
          final items = <_EarningsItem>[];
          for (final Ticker t in tickers) {
            final DateTime? ea = t.nextEarningsAt;
            if (ea == null) continue;
            final eaLocal = DateTime(
              ea.toLocal().year,
              ea.toLocal().month,
              ea.toLocal().day,
            );
            final int days = eaLocal.difference(todayNorm).inDays;
            if (days < 0) continue; // past date, skip
            items.add(_EarningsItem(ticker: t, daysUntil: days));
          }

          if (items.isEmpty) {
            return _EmptyState(cs: cs, theme: theme);
          }

          // Group into buckets.
          final Map<_EarningsBucket, List<_EarningsItem>> groups = {};
          for (final _EarningsItem item in items) {
            final bucket = _EarningsBucket.forDays(item.daysUntil);
            (groups[bucket] ??= []).add(item);
          }
          // Sort each bucket by days ascending.
          for (final List<_EarningsItem> list in groups.values) {
            list.sort((a, b) => a.daysUntil.compareTo(b.daysUntil));
          }

          // Build sections in canonical bucket order.
          final sections = <Widget>[];
          var tileIndex = 0;
          for (final _EarningsBucket bucket in _EarningsBucket.values) {
            final List<_EarningsItem>? group = groups[bucket];
            if (group == null || group.isEmpty) continue;
            sections.add(_SectionHeader(label: bucket.label, cs: cs));
            for (final _EarningsItem item in group) {
              sections.add(_EarningsTile(item: item, index: tileIndex));
              tileIndex++;
            }
          }

          return ListView(
            padding: const EdgeInsets.symmetric(vertical: 8),
            children: sections,
          );
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Widgets
// ---------------------------------------------------------------------------

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.cs, required this.theme});

  final ColorScheme cs;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.event_busy_rounded,
            size: 64,
            color: cs.onSurface.withValues(alpha: 0.3),
          ),
          const SizedBox(height: 16),
          Text(
            'No upcoming earnings',
            style: theme.textTheme.titleMedium?.copyWith(
              color: cs.onSurface.withValues(alpha: 0.5),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Earnings dates are fetched automatically on refresh.',
            style: theme.textTheme.bodySmall?.copyWith(
              color: cs.onSurface.withValues(alpha: 0.4),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.label, required this.cs});

  final String label;
  final ColorScheme cs;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.8,
          color: cs.primary,
        ),
      ),
    );
  }
}

class _EarningsTile extends StatelessWidget {
  const _EarningsTile({required this.item, required this.index});

  final _EarningsItem item;
  final int index;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final int days = item.daysUntil;
    final String daysLabel = days == 0
        ? 'Today'
        : days == 1
        ? 'Tomorrow'
        : 'In $days days';
    final Color badgeColor = days <= 7
        ? cs.errorContainer
        : days <= 30
        ? cs.tertiaryContainer
        : cs.secondaryContainer;
    final Color badgeText = days <= 7
        ? cs.onErrorContainer
        : days <= 30
        ? cs.onTertiaryContainer
        : cs.onSecondaryContainer;
    final dateFmt = DateFormat('MMM d, yyyy');
    final dateStr = dateFmt.format(item.ticker.nextEarningsAt!.toLocal());

    return Card(
          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          child: ListTile(
            leading: CircleAvatar(
              radius: 22,
              backgroundColor: cs.primaryContainer,
              child: Text(
                item.ticker.symbol.length > 4
                    ? item.ticker.symbol.substring(0, 4)
                    : item.ticker.symbol,
                style: TextStyle(
                  fontSize: item.ticker.symbol.length > 4 ? 9 : 11,
                  fontWeight: FontWeight.w700,
                  color: cs.onPrimaryContainer,
                ),
              ),
            ),
            title: Text(
              item.ticker.symbol,
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            subtitle: Text(
              dateStr,
              style: theme.textTheme.bodySmall?.copyWith(
                color: cs.onSurface.withValues(alpha: 0.6),
              ),
            ),
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: badgeColor,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                daysLabel,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: badgeText,
                ),
              ),
            ),
            onTap: () => context.push('/ticker/${item.ticker.symbol}'),
          ),
        )
        .animate(delay: Duration(milliseconds: index * 30))
        .fadeIn(duration: 250.ms)
        .slideX(begin: 0.05, end: 0, duration: 250.ms);
  }
}
