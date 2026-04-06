/// Ticker List Screen — Main screen showing all monitored tickers.
library;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../data/database/database.dart' show Ticker, WatchlistGroup;
import '../providers.dart';
import '../sector_map_provider.dart';
import '../sp500_tickers_provider.dart';

class TickerListScreen extends ConsumerStatefulWidget {
  const TickerListScreen({super.key});

  @override
  ConsumerState<TickerListScreen> createState() => _TickerListScreenState();
}

class _TickerListScreenState extends ConsumerState<TickerListScreen> {
  final _tickerController = TextEditingController();
  bool _isRefreshing = false;

  @override
  void dispose() {
    _tickerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tickersAsync = ref.watch(tickerListProvider);
    // Pre-warm the S&P 500 list so it's ready before the dialog opens
    ref.watch(sp500TickersProvider);
    // Pre-warm sector map
    ref.watch(sectorMapProvider);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: cs.surface,
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SvgPicture.asset('assets/svg/logo.svg', width: 32, height: 32),
            const SizedBox(width: 10),
            const Text('CrossTide'),
          ],
        ),
        actions: [
          if (_isRefreshing)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 12),
              child: Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                ),
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.sync_rounded),
              onPressed: _onRefreshAll,
              tooltip: '🔄 Refresh all tickers',
            ),
          IconButton(
            icon: const Icon(Icons.tune_rounded),
            onPressed: () => context.push('/settings'),
            tooltip: '⚙️ Settings',
          ),
        ],
      ),
      body: tickersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => _ErrorState(message: '$e'),
        data: (tickers) {
          if (tickers.isEmpty) return const _EmptyState();

          final groupsAsync = ref.watch(watchlistGroupsProvider);
          final groups = groupsAsync.valueOrNull ?? const <WatchlistGroup>[];
          final activeGroup = ref.watch(activeGroupFilterProvider);

          // Filter by group if one is selected
          final filtered = activeGroup == null
              ? tickers
              : tickers
                    .where((t) => t.groupId == activeGroup)
                    .toList();

          return Column(
            children: [
              if (groups.isNotEmpty)
                _GroupFilterRow(groups: groups, activeGroup: activeGroup),
              Expanded(
                child: filtered.isEmpty
                    ? const Center(child: Text('No tickers in this group.'))
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(12, 6, 12, 100),
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          return _TickerCard(
                                ticker: filtered[index],
                                onRemove: () =>
                                    _removeTicker(filtered[index].symbol),
                                onTap: () => context.push(
                                  '/ticker/${filtered[index].symbol}',
                                ),
                              )
                              .animate(
                                delay: Duration(milliseconds: 40 * index),
                              )
                              .fadeIn(duration: 280.ms)
                              .slideX(begin: 0.05, end: 0, duration: 280.ms);
                        },
                      ),
              ),
            ],
          );
        },
      ),
      floatingActionButton:
          FloatingActionButton.extended(
            onPressed: _showAddDialog,
            icon: const Icon(Icons.add_chart_rounded),
            label: const Text('Add Ticker'),
          ).animate().scale(
            begin: const Offset(0.7, 0.7),
            duration: 400.ms,
            curve: Curves.elasticOut,
          ),
    );
  }

  void _showAddDialog() {
    _tickerController.clear();
    final sp500 = ref.read(sp500TickersProvider).valueOrNull ?? const <String>[];
    showDialog<void>(
      context: context,
      builder: (ctx) => _AddTickersDialog(
        controller: _tickerController,
        sp500Tickers: sp500,
        onAdd: () => _addTickers(ctx),
      ),
    );
  }

  Future<void> _addTickers(BuildContext dialogContext) async {
    final raw = _tickerController.text.trim().toUpperCase();
    if (raw.isEmpty) return;
    Navigator.pop(dialogContext);

    // Parse: split on comma, space(s), or newline
    final symbols = raw
        .split(RegExp(r'[,\s]+'))
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toSet() // deduplicate
        .toList();

    final repo = await ref.read(repositoryProvider.future);
    if (!mounted) return;

    final added = <String>[];
    final failed = <String>[];

    for (final symbol in symbols) {
      try {
        await repo.addTicker(symbol);
        added.add(symbol);
      } catch (_) {
        failed.add(symbol);
      }
    }

    if (!mounted) return;
    final parts = <String>[];
    if (added.isNotEmpty) parts.add('✅ Added: ${added.join(', ')}');
    if (failed.isNotEmpty) parts.add('⚠️ Failed: ${failed.join(', ')}');
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(parts.join(' | ')),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  Future<void> _removeTicker(String symbol) async {
    try {
      final repo = await ref.read(repositoryProvider.future);
      if (!mounted) return;
      await repo.removeTicker(symbol);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('⚠️ Failed to remove $symbol: $e')),
      );
    }
  }

  Future<void> _onRefreshAll() async {
    if (_isRefreshing) return;
    setState(() => _isRefreshing = true);
    try {
      final service = await ref.read(refreshServiceProvider.future);
      if (!mounted) return;
      await service.refreshAll();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('⚠️ Refresh failed: $e')));
    } finally {
      if (mounted) setState(() => _isRefreshing = false);
    }
  }
}

// ---------------------------------------------------------------------------
// Ticker Card
// ---------------------------------------------------------------------------

class _TickerCard extends ConsumerWidget {
  const _TickerCard({
    required this.ticker,
    required this.onRemove,
    required this.onTap,
  });

  final Ticker ticker;
  final VoidCallback onRemove;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs = Theme.of(context).colorScheme;
    final dateFormat = DateFormat('MMM d, HH:mm');
    final sectorMap = switch (ref.watch(sectorMapProvider)) {
      AsyncData(:final value) => value,
      _ => const <String, String>{},
    };
    final sector = sectorMap[ticker.symbol];

    final bool hasData = ticker.sma200 != null && ticker.lastClose != null;
    final bool isAbove = hasData && ticker.lastClose! > ticker.sma200!;

    final statusColor = hasData
        ? (isAbove ? const Color(0xFF2E7D32) : const Color(0xFFC62828))
        : Colors.grey.shade500;
    final bgColor = hasData
        ? (isAbove ? Colors.green.withAlpha(18) : Colors.red.withAlpha(18))
        : Colors.grey.withAlpha(12);

    final statusLabel = hasData
        ? (isAbove ? '▲ Above SMA200' : '▼ Below SMA200')
        : '— No data';

    final statusIcon = hasData
        ? (isAbove ? 'assets/svg/cross_up.svg' : 'assets/svg/below_sma.svg')
        : null;

    return Dismissible(
      key: ValueKey(ticker.symbol),
      direction: DismissDirection.endToStart,
      confirmDismiss: (_) async {
        return await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            title: const Text('🗑️ Remove Ticker?'),
            content: Text(
              'Remove ${ticker.symbol} from your watchlist?',
            ), // ignore: avoid_dynamic_calls
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
                child: const Text('Remove'),
              ),
            ],
          ),
        );
      },
      onDismissed: (_) => onRemove(),
      background: Container(
        decoration: BoxDecoration(
          color: Colors.red.shade700,
          borderRadius: BorderRadius.circular(16),
        ),
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        child: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.delete_outline_rounded, color: Colors.white, size: 22),
            SizedBox(height: 2),
            Text('Remove', style: TextStyle(color: Colors.white, fontSize: 11)),
          ],
        ),
      ),
      child: Card(
        color: bgColor,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                // Left: Status icon circle
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: statusColor.withAlpha(30),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: statusColor.withAlpha(80),
                      width: 1.5,
                    ),
                  ),
                  child: Center(
                    child: statusIcon != null
                        ? SvgPicture.asset(statusIcon, width: 26, height: 26)
                        : Icon(
                            Icons.hourglass_empty_rounded,
                            size: 24,
                            color: Colors.grey.shade400,
                          ),
                  ),
                ),
                const SizedBox(width: 14),

                // Middle: Symbol + price info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            ticker.symbol,
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: cs.onSurface,
                                ),
                          ),
                          const SizedBox(width: 8),
                          _StatusChip(label: statusLabel, color: statusColor),
                        ],
                      ),
                      if (sector != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 3),
                          child: _SectorTag(sector: sector),
                        ),
                      const SizedBox(height: 4),
                      if (ticker.lastClose != null)
                        Row(
                          children: [
                            _PriceTag(
                              label: 'Close',
                              value:
                                  '\$${ticker.lastClose!.toStringAsFixed(2)}',
                              valueColor: cs.onSurface,
                            ),
                            const SizedBox(width: 16),
                            _PriceTag(
                              label: 'SMA200',
                              value: ticker.sma200 != null
                                  ? '\$${ticker.sma200!.toStringAsFixed(2)}'
                                  : '—',
                              valueColor: const Color(0xFFFF7043),
                            ),
                          ],
                        ),
                      if (ticker.lastRefreshAt != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 3),
                          child: Row(
                            children: [
                              Icon(
                                Icons.access_time_rounded,
                                size: 11,
                                color: Colors.grey.shade500,
                              ),
                              const SizedBox(width: 3),
                              Text(
                                dateFormat.format(ticker.lastRefreshAt!),
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey.shade500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      if (ticker.error != null)
                        Row(
                          children: [
                            const Icon(
                              Icons.warning_amber_rounded,
                              size: 12,
                              color: Colors.red,
                            ),
                            const SizedBox(width: 3),
                            Expanded(
                              child: Text(
                                ticker.error!,
                                style: const TextStyle(
                                  color: Colors.red,
                                  fontSize: 11,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                ),

                // Right: Chevron
                Icon(Icons.chevron_right_rounded, color: cs.onSurfaceVariant),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withAlpha(22),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withAlpha(80)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          color: color,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.2,
        ),
      ),
    );
  }
}

class _SectorTag extends StatelessWidget {
  const _SectorTag({required this.sector});
  final String sector;

  @override
  Widget build(BuildContext context) {
    final color = sectorColor(sector);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: color.withAlpha(18),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        sector,
        style: TextStyle(
          fontSize: 9,
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _PriceTag extends StatelessWidget {
  const _PriceTag({
    required this.label,
    required this.value,
    required this.valueColor,
  });

  final String label;
  final String value;
  final Color valueColor;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(fontSize: 10, color: Colors.grey.shade500),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: valueColor,
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Empty + Error states
// ---------------------------------------------------------------------------

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SvgPicture.asset('assets/svg/logo.svg', width: 96, height: 96)
              .animate(onPlay: (c) => c.repeat(reverse: true))
              .scaleXY(
                begin: 0.92,
                end: 1.0,
                duration: 2000.ms,
                curve: Curves.easeInOut,
              ),
          const SizedBox(height: 24),
          Text(
            '🌊 No tickers yet',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          Text(
            'Tap ✚ Add Ticker to start watching\nyour first SMA crossover.',
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: Colors.grey.shade600),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    ).animate().fadeIn(duration: 500.ms).slideY(begin: 0.1, end: 0);
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.error_outline_rounded,
              size: 56,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            const Text(
              '⚠️ Could not load tickers',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Group filter row
// ---------------------------------------------------------------------------

class _GroupFilterRow extends ConsumerWidget {
  const _GroupFilterRow({required this.groups, required this.activeGroup});

  final List<WatchlistGroup> groups;
  final String? activeGroup;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
      child: Row(
        children: [
          // "All" chip
          Padding(
            padding: const EdgeInsets.only(right: 6),
            child: FilterChip(
              label: const Text('All'),
              selected: activeGroup == null,
              onSelected: (_) =>
                  ref.read(activeGroupFilterProvider.notifier).state = null,
            ),
          ),
          ...groups.map((g) {
            final color = Color(g.colorValue);
            final isSelected = activeGroup == g.id;
            return Padding(
              padding: const EdgeInsets.only(right: 6),
              child: FilterChip(
                avatar: CircleAvatar(
                  radius: 6,
                  backgroundColor: color,
                ),
                label: Text(g.name),
                selected: isSelected,
                onSelected: (_) => ref
                    .read(activeGroupFilterProvider.notifier)
                    .state = isSelected ? null : g.id,
              ),
            );
          }),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Add Tickers Dialog with S&P 500 autocomplete suggestions
// ---------------------------------------------------------------------------

class _AddTickersDialog extends StatefulWidget {
  const _AddTickersDialog({
    required this.controller,
    required this.sp500Tickers,
    required this.onAdd,
  });

  final TextEditingController controller;
  final List<String> sp500Tickers;
  final VoidCallback onAdd;

  @override
  State<_AddTickersDialog> createState() => _AddTickersDialogState();
}

class _AddTickersDialogState extends State<_AddTickersDialog> {
  /// Returns suggestions for the last token being typed (after the last comma/space).
  List<String> _suggestions(TextEditingValue textEditingValue) {
    final text = textEditingValue.text.toUpperCase();
    // Find the last token being typed
    final lastToken = text.split(RegExp(r'[,\s]+')).lastWhere(
      (t) => t.isNotEmpty,
      orElse: () => '',
    );
    if (lastToken.isEmpty) return const [];
    return widget.sp500Tickers
        .where((t) => t.startsWith(lastToken) && t != lastToken)
        .take(8)
        .toList();
  }

  void _appendSuggestion(String symbol) {
    final current = widget.controller.text.trimRight();
    // Replace the last partial token with the chosen symbol + comma
    final tokens = current.split(RegExp(r'[,\s]+'));
    if (tokens.isNotEmpty) tokens.removeLast();
    tokens.add(symbol);
    final updated = '${tokens.join(', ')}, ';
    widget.controller.value = TextEditingValue(
      text: updated,
      selection: TextSelection.collapsed(offset: updated.length),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: [
          Icon(Icons.search_rounded, color: cs.primary),
          const SizedBox(width: 10),
          const Text('📈 Add Tickers'),
        ],
      ),
      content: SizedBox(
        width: double.maxFinite,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            RawAutocomplete<String>(
              textEditingController: widget.controller,
              focusNode: FocusNode(),
              optionsBuilder: _suggestions,
              optionsViewBuilder: (ctx, onSelected, options) {
                return Align(
                  alignment: Alignment.topLeft,
                  child: Material(
                    elevation: 4,
                    borderRadius: BorderRadius.circular(10),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxHeight: 200),
                      child: ListView.builder(
                        shrinkWrap: true,
                        itemCount: options.length,
                        itemBuilder: (_, i) {
                          final opt = options.elementAt(i);
                          return ListTile(
                            dense: true,
                            title: Text(
                              opt,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            onTap: () => onSelected(opt),
                          );
                        },
                      ),
                    ),
                  ),
                );
              },
              onSelected: _appendSuggestion,
              fieldViewBuilder: (ctx, controller, focusNode, onSubmitted) {
                return TextField(
                  controller: controller,
                  focusNode: focusNode,
                  decoration: InputDecoration(
                    labelText: 'Ticker Symbol(s)',
                    hintText: 'e.g. AAPL, MSFT, NVDA',
                    helperText:
                        'Separate multiple symbols with commas or spaces',
                    prefixIcon:
                        const Icon(Icons.candlestick_chart_rounded),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  textCapitalization: TextCapitalization.characters,
                  autofocus: true,
                  maxLines: 3,
                  minLines: 1,
                  onSubmitted: (_) => widget.onAdd(),
                );
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton.icon(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.close_rounded),
          label: const Text('Cancel'),
        ),
        FilledButton.icon(
          onPressed: widget.onAdd,
          icon: const Icon(Icons.add_rounded),
          label: const Text('Add'),
        ),
      ],
    );
  }
}
