/// Ticker Detail Screen — Price chart + SMA200 overlay + alert history.
library;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:intl/intl.dart';

import '../../domain/domain.dart';
import '../providers.dart';

class TickerDetailScreen extends ConsumerStatefulWidget {
  const TickerDetailScreen({super.key, required this.symbol});

  final String symbol;

  @override
  ConsumerState<TickerDetailScreen> createState() => _TickerDetailScreenState();
}

class _TickerDetailScreenState extends ConsumerState<TickerDetailScreen> {
  bool _isRefreshing = false;

  @override
  Widget build(BuildContext context) {
    final candlesAsync = ref.watch(tickerCandlesProvider(widget.symbol));
    final alertStateAsync = ref.watch(tickerAlertStateProvider(widget.symbol));
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.candlestick_chart_rounded, size: 22),
            const SizedBox(width: 8),
            Text(widget.symbol),
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
              tooltip: '🔄 Refresh',
              onPressed: _onRefresh,
            ),
        ],
      ),
      body: candlesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => _DetailError(message: '$e'),
        data: (candles) {
          if (candles.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SvgPicture.asset(
                    'assets/svg/alert_bell.svg',
                    width: 60,
                    height: 60,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    '📭 No price data yet',
                    style: TextStyle(fontSize: 16),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Tap 🔄 to fetch data from Yahoo Finance',
                    style: TextStyle(color: Colors.grey, fontSize: 13),
                  ),
                ],
              ),
            );
          }

          const smaCalc = SmaCalculator();
          final smaSeries = smaCalc.computeSeries(candles, period: 200);

          final chartStart = candles.length > 250 ? candles.length - 250 : 0;
          final chartCandles = candles.sublist(chartStart);
          final chartSma = smaSeries.sublist(chartStart);

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _SummaryCard(
                      symbol: widget.symbol,
                      candles: candles,
                      smaSeries: smaSeries,
                      alertStateAsync: alertStateAsync,
                    )
                    .animate()
                    .fadeIn(duration: 300.ms)
                    .slideY(begin: 0.04, end: 0),
                const SizedBox(height: 16),
                _ChartSection(
                  cs: cs,
                  chartCandles: chartCandles,
                  chartSma: chartSma,
                ).animate(delay: 80.ms).fadeIn(duration: 300.ms),
                const SizedBox(height: 16),
                _AlertStateCard(
                  stateAsync: alertStateAsync,
                ).animate(delay: 160.ms).fadeIn(duration: 300.ms),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _onRefresh() async {
    setState(() => _isRefreshing = true);
    try {
      final service = await ref.read(refreshServiceProvider.future);
      await service.refreshTicker(widget.symbol);
      ref.invalidate(tickerCandlesProvider(widget.symbol));
      ref.invalidate(tickerAlertStateProvider(widget.symbol));
    } finally {
      if (mounted) setState(() => _isRefreshing = false);
    }
  }
}

// ---------------------------------------------------------------------------
// Summary Card
// ---------------------------------------------------------------------------

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.symbol,
    required this.candles,
    required this.smaSeries,
    required this.alertStateAsync,
  });

  final String symbol;
  final List<DailyCandle> candles;
  final List<(DateTime, double?)> smaSeries;
  final AsyncValue<TickerAlertState> alertStateAsync;

  @override
  Widget build(BuildContext context) {
    final lastCandle = candles.last;
    final lastSma = smaSeries.last.$2;
    final isAbove = lastSma != null && lastCandle.close > lastSma;
    final dateFormat = DateFormat('EEE, MMM d yyyy');
    final priceFormat = NumberFormat('\$#,##0.00');

    final priceDelta = candles.length >= 2
        ? lastCandle.close - candles[candles.length - 2].close
        : 0.0;
    final deltaPercent = candles.length >= 2
        ? priceDelta / candles[candles.length - 2].close * 100
        : 0.0;
    final deltaPositive = priceDelta >= 0;

    final cs = Theme.of(context).colorScheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row
            Row(
              children: [
                // Ticker + status icon
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            symbol,
                            style: Theme.of(context).textTheme.headlineMedium
                                ?.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: cs.primary,
                                ),
                          ),
                          const SizedBox(width: 10),
                          _PositionBadge(
                            isAbove: isAbove,
                            hasSma: lastSma != null,
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        dateFormat.format(lastCandle.date),
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                // SVG signal icon
                SvgPicture.asset(
                  isAbove
                      ? 'assets/svg/cross_up.svg'
                      : 'assets/svg/below_sma.svg',
                  width: 44,
                  height: 44,
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Price metrics row
            Row(
              children: [
                _MetricBox(
                  label: '💰 Close Price',
                  value: priceFormat.format(lastCandle.close),
                  sub: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        deltaPositive
                            ? Icons.arrow_drop_up_rounded
                            : Icons.arrow_drop_down_rounded,
                        size: 16,
                        color: deltaPositive
                            ? Colors.green.shade700
                            : Colors.red.shade700,
                      ),
                      Text(
                        '${deltaPositive ? '+' : ''}'
                        '${priceDelta.toStringAsFixed(2)} '
                        '(${deltaPercent.toStringAsFixed(2)}%)',
                        style: TextStyle(
                          fontSize: 11,
                          color: deltaPositive
                              ? Colors.green.shade700
                              : Colors.red.shade700,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                _MetricBox(
                  label: '📉 SMA 200',
                  value: lastSma != null
                      ? priceFormat.format(lastSma)
                      : 'Calculating…',
                  sub: Text(
                    lastSma != null
                        ? 'Gap: ${((lastCandle.close - lastSma) / lastSma * 100).toStringAsFixed(1)}%'
                        : 'Need 200 candles',
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PositionBadge extends StatelessWidget {
  const _PositionBadge({required this.isAbove, required this.hasSma});

  final bool isAbove;
  final bool hasSma;

  @override
  Widget build(BuildContext context) {
    if (!hasSma) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.grey.shade200,
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Text('— No SMA', style: TextStyle(fontSize: 11)),
      );
    }
    final color = isAbove ? const Color(0xFF2E7D32) : const Color(0xFFC62828);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(22),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withAlpha(80)),
      ),
      child: Text(
        isAbove ? '▲ ABOVE SMA200' : '▼ BELOW SMA200',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: color,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}

class _MetricBox extends StatelessWidget {
  const _MetricBox({
    required this.label,
    required this.value,
    required this.sub,
  });

  final String label;
  final String value;
  final Widget sub;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: cs.surfaceContainerHighest.withAlpha(80),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(fontSize: 11, color: Colors.grey),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
                color: cs.onSurface,
              ),
            ),
            const SizedBox(height: 2),
            sub,
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Chart Section
// ---------------------------------------------------------------------------

class _ChartSection extends StatelessWidget {
  const _ChartSection({
    required this.cs,
    required this.chartCandles,
    required this.chartSma,
  });

  final ColorScheme cs;
  final List<DailyCandle> chartCandles;
  final List<(DateTime, double?)> chartSma;

  @override
  Widget build(BuildContext context) {
    final priceSpots = <FlSpot>[];
    final smaSpots = <FlSpot>[];

    for (var i = 0; i < chartCandles.length; i++) {
      priceSpots.add(FlSpot(i.toDouble(), chartCandles[i].close));
      if (chartSma[i].$2 != null) {
        smaSpots.add(FlSpot(i.toDouble(), chartSma[i].$2!));
      }
    }

    final allValues = [
      ...priceSpots.map((s) => s.y),
      ...smaSpots.map((s) => s.y),
    ];
    final minY = allValues.reduce((a, b) => a < b ? a : b) * 0.98;
    final maxY = allValues.reduce((a, b) => a > b ? a : b) * 1.02;

    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Chart header + legend
            Row(
              children: [
                const Icon(
                  Icons.show_chart_rounded,
                  size: 18,
                  color: Color(0xFF1565C0),
                ),
                const SizedBox(width: 6),
                Text(
                  '📊 Price vs SMA 200',
                  style: Theme.of(
                    context,
                  ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                ),
                const Spacer(),
                _LegendDot(color: Colors.blue.shade600, label: 'Price'),
                const SizedBox(width: 12),
                _LegendDash(color: Colors.deepOrange.shade400, label: 'SMA200'),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 260,
              child: LineChart(
                LineChartData(
                  minY: minY,
                  maxY: maxY,
                  backgroundColor: cs.surfaceContainerHighest.withAlpha(40),
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    getDrawingHorizontalLine: (v) => FlLine(
                      color: Colors.grey.withAlpha(40),
                      strokeWidth: 1,
                    ),
                  ),
                  borderData: FlBorderData(
                    show: true,
                    border: Border(
                      bottom: BorderSide(
                        color: Colors.grey.withAlpha(60),
                        width: 1,
                      ),
                      left: BorderSide(
                        color: Colors.grey.withAlpha(60),
                        width: 1,
                      ),
                    ),
                  ),
                  titlesData: FlTitlesData(
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 60,
                        getTitlesWidget: (value, meta) => Padding(
                          padding: const EdgeInsets.only(right: 4),
                          child: Text(
                            '\$${value.toStringAsFixed(0)}',
                            style: const TextStyle(
                              fontSize: 10,
                              color: Colors.grey,
                            ),
                          ),
                        ),
                      ),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        interval: (chartCandles.length / 5).ceilToDouble(),
                        getTitlesWidget: (value, meta) {
                          final idx = value.toInt();
                          if (idx < 0 || idx >= chartCandles.length) {
                            return const SizedBox();
                          }
                          return Text(
                            DateFormat('M/d').format(chartCandles[idx].date),
                            style: const TextStyle(
                              fontSize: 10,
                              color: Colors.grey,
                            ),
                          );
                        },
                      ),
                    ),
                    topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                  ),
                  lineBarsData: [
                    // Price line
                    LineChartBarData(
                      spots: priceSpots,
                      isCurved: true,
                      curveSmoothness: 0.25,
                      color: Colors.blue.shade600,
                      barWidth: 2.5,
                      dotData: const FlDotData(show: false),
                      belowBarData: BarAreaData(
                        show: true,
                        gradient: LinearGradient(
                          colors: [
                            Colors.blue.withAlpha(50),
                            Colors.blue.withAlpha(5),
                          ],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                      ),
                    ),
                    // SMA200 dashed line
                    if (smaSpots.isNotEmpty)
                      LineChartBarData(
                        spots: smaSpots,
                        isCurved: true,
                        color: Colors.deepOrange.shade400,
                        barWidth: 2,
                        dashArray: [6, 4],
                        dotData: const FlDotData(show: false),
                      ),
                  ],
                  lineTouchData: LineTouchData(
                    touchTooltipData: LineTouchTooltipData(
                      getTooltipItems: (spots) => spots.map((spot) {
                        final isPrice = spot.barIndex == 0;
                        final color = isPrice
                            ? Colors.blue.shade600
                            : Colors.deepOrange.shade400;
                        final icon = isPrice ? '💰' : '📉';
                        final label = isPrice ? 'Price' : 'SMA200';
                        return LineTooltipItem(
                          '$icon $label: \$${spot.y.toStringAsFixed(2)}',
                          TextStyle(
                            color: color,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LegendDot extends StatelessWidget {
  const _LegendDot({required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
      ],
    );
  }
}

class _LegendDash extends StatelessWidget {
  const _LegendDash({required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 18,
          height: 2,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(1),
          ),
        ),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Alert State Card
// ---------------------------------------------------------------------------

class _AlertStateCard extends StatelessWidget {
  const _AlertStateCard({required this.stateAsync});

  final AsyncValue<TickerAlertState> stateAsync;

  static const _statusIcons = {
    'below': Icons.arrow_downward_rounded,
    'above': Icons.arrow_upward_rounded,
    'alerted': Icons.notifications_active_rounded,
  };

  static const _statusColors = {
    'below': Color(0xFFC62828),
    'above': Color(0xFF2E7D32),
    'alerted': Color(0xFFFF8F00),
  };

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: stateAsync.when(
          loading: () => const Center(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: CircularProgressIndicator(),
            ),
          ),
          error: (e, _) => Text('⚠️ Error: $e'),
          data: (state) {
            final dateFormat = DateFormat('EEE MMM d, HH:mm');
            final statusKey = state.lastStatus.name.toLowerCase();
            final statusIcon =
                _statusIcons[statusKey] ?? Icons.help_outline_rounded;
            final statusColor = _statusColors[statusKey] ?? Colors.grey;

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    SvgPicture.asset(
                      'assets/svg/alert_bell.svg',
                      width: 22,
                      height: 22,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '🔔 Alert State',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Status badge
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withAlpha(18),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: statusColor.withAlpha(60)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(statusIcon, color: statusColor, size: 18),
                      const SizedBox(width: 8),
                      Text(
                        state.lastStatus.name.toUpperCase(),
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          color: statusColor,
                          fontSize: 14,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // Details grid
                _AlertDetailRow(
                  icon: Icons.notifications_active_rounded,
                  label: '⚡ Last Cross-Up Alert',
                  value: state.lastAlertedCrossUpAt != null
                      ? dateFormat.format(state.lastAlertedCrossUpAt!)
                      : '—',
                ),
                _AlertDetailRow(
                  icon: Icons.update_rounded,
                  label: '🕐 Last Evaluated',
                  value: state.lastEvaluatedAt != null
                      ? dateFormat.format(state.lastEvaluatedAt!)
                      : '—',
                ),
                if (state.lastCloseUsed != null)
                  _AlertDetailRow(
                    icon: Icons.attach_money_rounded,
                    label: '💵 Close Used',
                    value: '\$${state.lastCloseUsed!.toStringAsFixed(2)}',
                  ),
                if (state.lastSma200 != null)
                  _AlertDetailRow(
                    icon: Icons.show_chart_rounded,
                    label: '📉 SMA200 Used',
                    value: '\$${state.lastSma200!.toStringAsFixed(2)}',
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _AlertDetailRow extends StatelessWidget {
  const _AlertDetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 14, color: Colors.grey.shade500),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
              ),
            ],
          ),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

class _DetailError extends StatelessWidget {
  const _DetailError({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_rounded, size: 56, color: Colors.red),
            const SizedBox(height: 16),
            const Text(
              '⚠️ Failed to load ticker',
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
