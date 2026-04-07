/// Ticker Detail Screen — Price chart + SMA overlays + alert state.
library;

import 'dart:ui' as ui;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:intl/intl.dart';

import '../../data/database/database.dart' show TickerNotesTableCompanion;
import '../../domain/domain.dart';
import '../providers.dart';
import '../sector_map_provider.dart';

class TickerDetailScreen extends ConsumerStatefulWidget {
  const TickerDetailScreen({super.key, required this.symbol});

  final String symbol;

  @override
  ConsumerState<TickerDetailScreen> createState() => _TickerDetailScreenState();
}

/// Selectable time ranges for the price chart.
enum _ChartRange {
  threeMonths('3M', 90),
  sixMonths('6M', 180),
  oneYear('1Y', 365),
  twoYears('2Y', 730),
  fiveYears('5Y', 1825),
  max('Max', null);

  const _ChartRange(this.label, this._days);

  final String label;
  final int? _days;

  /// The earliest date to include, or null for all available data.
  DateTime? get cutoff {
    final days = _days;
    if (days == null) return null;
    return DateTime.now().subtract(Duration(days: days));
  }
}

class _TickerDetailScreenState extends ConsumerState<TickerDetailScreen> {
  bool _isRefreshing = false;
  _ChartRange _chartRange = _ChartRange.oneYear;

  @override
  Widget build(BuildContext context) {
    final candlesAsync = ref.watch(tickerCandlesProvider(widget.symbol));
    final alertStateAsync = ref.watch(tickerAlertStateProvider(widget.symbol));
    final entryAsync = ref.watch(tickerEntryProvider(widget.symbol));
    final cs = Theme.of(context).colorScheme;
    final sectorMap = switch (ref.watch(sectorMapProvider)) {
      AsyncData(:final value) => value,
      _ => const <String, String>{},
    };
    final sector = sectorMap[widget.symbol];
    final defaultIndicators = switch (ref.watch(settingsProvider)) {
      AsyncData(:final value) => value.defaultIndicators,
      _ => const <String>[],
    };

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.candlestick_chart_rounded, size: 22),
            const SizedBox(width: 8),
            Text(widget.symbol),
            if (sector != null) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: sectorColor(sector).withAlpha(35),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  sector,
                  style: TextStyle(
                    fontSize: 11,
                    color: sectorColor(sector),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
            // Earnings indicator
            if (switch (entryAsync) {
                  AsyncData(:final value) => value,
                  _ => null,
                }
                case final entry?)
              Padding(
                padding: const EdgeInsets.only(left: 8),
                child: _EarningsBadge(entry: entry),
              ),
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

          // Filter candles to selected time range
          final cutoff = _chartRange.cutoff;
          final rangeStart = cutoff == null
              ? 0
              : candles.indexWhere((c) => !c.date.isBefore(cutoff));
          final rangeStartIdx = rangeStart < 0 ? 0 : rangeStart;
          // Always need at least 200 candles for SMA accuracy — use all prior
          // candles for computation but only show from rangeStartIdx onward.
          final chartCandles = candles.sublist(rangeStartIdx);
          final chartSma200 = smaSeries.sublist(rangeStartIdx);
          // Pre-compute SMA50 and SMA150 series for the chart overlays
          final chartSma50 = smaCalc
              .computeSeries(candles, period: 50)
              .sublist(rangeStartIdx);
          final chartSma150 = smaCalc
              .computeSeries(candles, period: 150)
              .sublist(rangeStartIdx);

          // SPY benchmark candles (lazy — loaded when overlay toggled)
          final spyAsync = ref.watch(sp500CandlesProvider);
          final spyCandles = switch (spyAsync) {
            AsyncData(:final value) => value,
            _ => const <DailyCandle>[],
          };

          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _QuoteBar(symbol: widget.symbol),
              Expanded(
                child: SingleChildScrollView(
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
                        chartSma50: chartSma50,
                        chartSma150: chartSma150,
                        chartSma200: chartSma200,
                        selectedRange: _chartRange,
                        onRangeChanged: (r) => setState(() => _chartRange = r),
                        spyCandles: spyCandles,
                        defaultIndicators: defaultIndicators,
                      ).animate(delay: 80.ms).fadeIn(duration: 300.ms),
                      const SizedBox(height: 16),
                      _AlertStateCard(
                        stateAsync: alertStateAsync,
                      ).animate(delay: 160.ms).fadeIn(duration: 300.ms),
                      const SizedBox(height: 16),
                      _SignalScoreCard(
                        symbol: widget.symbol,
                      ).animate(delay: 200.ms).fadeIn(duration: 300.ms),
                      const SizedBox(height: 16),
                      _AtrCard(
                        symbol: widget.symbol,
                      ).animate(delay: 220.ms).fadeIn(duration: 300.ms),
                      const SizedBox(height: 16),
                      _VwapCard(
                        symbol: widget.symbol,
                      ).animate(delay: 225.ms).fadeIn(duration: 300.ms),
                      const SizedBox(height: 16),
                      _AlertTypeSelectorCard(
                        symbol: widget.symbol,
                      ).animate(delay: 240.ms).fadeIn(duration: 300.ms),
                      const SizedBox(height: 16),
                      _PriceTargetsCard(
                        symbol: widget.symbol,
                      ).animate(delay: 300.ms).fadeIn(duration: 300.ms),
                      const SizedBox(height: 16),
                      _PctMoveCard(
                        symbol: widget.symbol,
                      ).animate(delay: 360.ms).fadeIn(duration: 300.ms),
                      const SizedBox(height: 16),
                      _SensitivityStatsCard(
                        symbol: widget.symbol,
                      ).animate(delay: 420.ms).fadeIn(duration: 300.ms),
                      const SizedBox(height: 16),
                      _NotesCard(
                        symbol: widget.symbol,
                      ).animate(delay: 480.ms).fadeIn(duration: 300.ms),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _onRefresh() async {
    if (_isRefreshing) return;
    setState(() => _isRefreshing = true);
    try {
      final service = await ref.read(refreshServiceProvider.future);
      if (!mounted) return;
      await service.refreshTicker(widget.symbol);
      if (!mounted) return;
      ref.invalidate(tickerCandlesProvider(widget.symbol));
      ref.invalidate(tickerAlertStateProvider(widget.symbol));
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
// Chart Section  (SMA50 / SMA150 / SMA200 toggle overlays)
// ---------------------------------------------------------------------------

class _ChartSection extends StatefulWidget {
  const _ChartSection({
    required this.cs,
    required this.chartCandles,
    required this.chartSma50,
    required this.chartSma150,
    required this.chartSma200,
    required this.selectedRange,
    required this.onRangeChanged,
    this.spyCandles = const [],
    this.defaultIndicators = const [],
  });

  final ColorScheme cs;
  final List<DailyCandle> chartCandles;
  final List<(DateTime, double?)> chartSma50;
  final List<(DateTime, double?)> chartSma150;
  final List<(DateTime, double?)> chartSma200;
  final _ChartRange selectedRange;
  final ValueChanged<_ChartRange> onRangeChanged;

  /// SPY candles for the benchmark overlay (empty list = not loaded yet).
  final List<DailyCandle> spyCandles;

  /// Indicator keys pre-enabled from user preferences.
  final List<String> defaultIndicators;

  @override
  State<_ChartSection> createState() => _ChartSectionState();
}

class _ChartSectionState extends State<_ChartSection> {
  late bool _showSma50;
  late bool _showSma150;
  late bool _showSma200;
  late bool _showSpy;
  bool _candlestickMode = false;
  late bool _showEma20;
  late bool _showBollinger;
  late bool _showRsi;
  late bool _showMacd;
  late bool _showVwap;

  @override
  void initState() {
    super.initState();
    final d = widget.defaultIndicators;
    _showSma50 = d.contains('SMA50');
    _showSma150 = d.contains('SMA150');
    _showSma200 = d.isEmpty || d.contains('SMA200');
    _showSpy = d.contains('SPY');
    _showEma20 = d.contains('EMA:20') || d.contains('EMA:50');
    _showBollinger = d.contains('BB');
    _showRsi = d.contains('RSI:14');
    _showMacd = d.contains('MACD');
    _showVwap = d.contains('VWAP');
  }

  /// Build SPY normalized spots: SPY close indexed to the first price value.
  List<FlSpot> _buildSpySpots(List<FlSpot> priceSpots) {
    final spy = widget.spyCandles;
    final candles = widget.chartCandles;
    if (spy.isEmpty || candles.isEmpty || priceSpots.isEmpty) return [];

    // Align SPY to chart range by date
    final rangeStart = candles.first.date;
    final spyFiltered = spy.where((c) => !c.date.isBefore(rangeStart)).toList();
    if (spyFiltered.isEmpty) return [];

    final basePrice = priceSpots.first.y;
    final baseSpy = spyFiltered.first.close;

    // Match each chart candle index to the closest SPY date
    final spots = <FlSpot>[];
    var spyIdx = 0;
    for (var i = 0; i < candles.length; i++) {
      final target = candles[i].date;
      // Advance spyIdx to closest date
      while (spyIdx + 1 < spyFiltered.length &&
              spyFiltered[spyIdx + 1].date.isBefore(target) ||
          spyIdx + 1 < spyFiltered.length &&
              spyFiltered[spyIdx + 1].date == target) {
        spyIdx++;
      }
      final normalized = (spyFiltered[spyIdx].close / baseSpy) * basePrice;
      spots.add(FlSpot(i.toDouble(), normalized));
    }
    return spots;
  }

  @override
  Widget build(BuildContext context) {
    final cs = widget.cs;
    final priceSpots = <FlSpot>[];
    final sma50Spots = <FlSpot>[];
    final sma150Spots = <FlSpot>[];
    final sma200Spots = <FlSpot>[];

    final candles = widget.chartCandles;
    for (var i = 0; i < candles.length; i++) {
      priceSpots.add(FlSpot(i.toDouble(), candles[i].close));
      if (widget.chartSma50[i].$2 != null) {
        sma50Spots.add(FlSpot(i.toDouble(), widget.chartSma50[i].$2!));
      }
      if (widget.chartSma150[i].$2 != null) {
        sma150Spots.add(FlSpot(i.toDouble(), widget.chartSma150[i].$2!));
      }
      if (widget.chartSma200[i].$2 != null) {
        sma200Spots.add(FlSpot(i.toDouble(), widget.chartSma200[i].$2!));
      }
    }

    // EMA 20 spots
    final ema20Spots = <FlSpot>[];
    if (_showEma20) {
      final emaSeries = const EmaCalculator().computeSeries(
        candles,
        period: 20,
      );
      for (var i = 0; i < emaSeries.length; i++) {
        if (emaSeries[i].$2 != null) {
          ema20Spots.add(FlSpot(i.toDouble(), emaSeries[i].$2!));
        }
      }
    }

    // Bollinger upper / lower spots
    final bbUpperSpots = <FlSpot>[];
    final bbLowerSpots = <FlSpot>[];
    if (_showBollinger) {
      final bbSeries = const BollingerCalculator().computeSeries(candles);
      for (var i = 0; i < bbSeries.length; i++) {
        if (bbSeries[i].upper != null) {
          bbUpperSpots.add(FlSpot(i.toDouble(), bbSeries[i].upper!));
          bbLowerSpots.add(FlSpot(i.toDouble(), bbSeries[i].lower!));
        }
      }
    }

    // VWAP spots
    final vwapSpots = <FlSpot>[];
    if (_showVwap) {
      final vwapSeries = const VwapCalculator().computeSeries(candles);
      for (var i = 0; i < vwapSeries.length; i++) {
        vwapSpots.add(FlSpot(i.toDouble(), vwapSeries[i].vwap));
      }
    }

    final allValues = [
      ...priceSpots.map((s) => s.y),
      if (_showSma50) ...sma50Spots.map((s) => s.y),
      if (_showSma150) ...sma150Spots.map((s) => s.y),
      if (_showSma200) ...sma200Spots.map((s) => s.y),
      if (_showEma20) ...ema20Spots.map((s) => s.y),
      if (_showBollinger) ...bbUpperSpots.map((s) => s.y),
      if (_showBollinger) ...bbLowerSpots.map((s) => s.y),
      if (_showVwap) ...vwapSpots.map((s) => s.y),
    ];
    if (allValues.isEmpty) return const SizedBox();
    final minY = allValues.reduce((a, b) => a < b ? a : b) * 0.98;
    final maxY = allValues.reduce((a, b) => a > b ? a : b) * 1.02;

    final bars = <LineChartBarData>[
      // Price line (always visible)
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
            colors: [Colors.blue.withAlpha(50), Colors.blue.withAlpha(5)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
      ),
      if (_showSma50 && sma50Spots.isNotEmpty)
        LineChartBarData(
          spots: sma50Spots,
          isCurved: true,
          color: Colors.green.shade600,
          barWidth: 1.8,
          dashArray: [4, 3],
          dotData: const FlDotData(show: false),
        ),
      if (_showSma150 && sma150Spots.isNotEmpty)
        LineChartBarData(
          spots: sma150Spots,
          isCurved: true,
          color: Colors.purple.shade500,
          barWidth: 1.8,
          dashArray: [4, 3],
          dotData: const FlDotData(show: false),
        ),
      if (_showSma200 && sma200Spots.isNotEmpty)
        LineChartBarData(
          spots: sma200Spots,
          isCurved: true,
          color: Colors.deepOrange.shade400,
          barWidth: 2,
          dashArray: [6, 4],
          dotData: const FlDotData(show: false),
        ),
      if (_showSpy)
        () {
              final spySpots = _buildSpySpots(priceSpots);
              if (spySpots.isEmpty) return null;
              return LineChartBarData(
                spots: spySpots,
                isCurved: true,
                color: Colors.teal.shade400,
                barWidth: 1.5,
                dashArray: [3, 3],
                dotData: const FlDotData(show: false),
              );
            }() ??
            LineChartBarData(spots: const [], color: Colors.transparent),
      if (_showEma20 && ema20Spots.isNotEmpty)
        LineChartBarData(
          spots: ema20Spots,
          isCurved: true,
          color: Colors.cyan.shade600,
          barWidth: 1.8,
          dashArray: [5, 3],
          dotData: const FlDotData(show: false),
        ),
      if (_showBollinger && bbUpperSpots.isNotEmpty) ...[
        LineChartBarData(
          spots: bbUpperSpots,
          isCurved: true,
          color: Colors.pink.shade400,
          barWidth: 1.5,
          dashArray: [4, 4],
          dotData: const FlDotData(show: false),
        ),
        LineChartBarData(
          spots: bbLowerSpots,
          isCurved: true,
          color: Colors.pink.shade400,
          barWidth: 1.5,
          dashArray: [4, 4],
          dotData: const FlDotData(show: false),
        ),
      ],
      if (_showVwap && vwapSpots.isNotEmpty)
        LineChartBarData(
          spots: vwapSpots,
          isCurved: true,
          color: Colors.deepPurple.shade300,
          barWidth: 2,
          dashArray: [6, 3],
          dotData: const FlDotData(show: false),
        ),
    ];

    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Time-range selector row
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _ChartRange.values.map((r) {
                  final selected = r == widget.selectedRange;
                  return Padding(
                    padding: const EdgeInsets.only(right: 4),
                    child: ChoiceChip(
                      label: Text(
                        r.label,
                        style: const TextStyle(fontSize: 11),
                      ),
                      selected: selected,
                      onSelected: (_) => widget.onRangeChanged(r),
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 8),
            // SMA toggle chips + SPY benchmark
            Wrap(
              spacing: 6,
              children: [
                _SmaToggleChip(
                  label: 'SMA 50',
                  color: Colors.green.shade600,
                  selected: _showSma50,
                  onChanged: (v) => setState(() => _showSma50 = v),
                ),
                _SmaToggleChip(
                  label: 'SMA 150',
                  color: Colors.purple.shade500,
                  selected: _showSma150,
                  onChanged: (v) => setState(() => _showSma150 = v),
                ),
                _SmaToggleChip(
                  label: 'SMA 200',
                  color: Colors.deepOrange.shade400,
                  selected: _showSma200,
                  onChanged: (v) => setState(() => _showSma200 = v),
                ),
                _SmaToggleChip(
                  label: '📈 SPY',
                  color: Colors.teal.shade400,
                  selected: _showSpy,
                  onChanged: (v) => setState(() => _showSpy = v),
                ),
                _SmaToggleChip(
                  label: '🕯 Candles',
                  color: Colors.amber.shade700,
                  selected: _candlestickMode,
                  onChanged: (v) => setState(() => _candlestickMode = v),
                ),
                _SmaToggleChip(
                  label: 'EMA 20',
                  color: Colors.cyan.shade600,
                  selected: _showEma20,
                  onChanged: (v) => setState(() => _showEma20 = v),
                ),
                _SmaToggleChip(
                  label: '🎸 Bollinger',
                  color: Colors.pink.shade400,
                  selected: _showBollinger,
                  onChanged: (v) => setState(() => _showBollinger = v),
                ),
                _SmaToggleChip(
                  label: 'RSI',
                  color: Colors.lime.shade600,
                  selected: _showRsi,
                  onChanged: (v) => setState(() => _showRsi = v),
                ),
                _SmaToggleChip(
                  label: 'MACD',
                  color: Colors.blueGrey.shade400,
                  selected: _showMacd,
                  onChanged: (v) => setState(() => _showMacd = v),
                ),
                _SmaToggleChip(
                  label: 'VWAP',
                  color: Colors.deepPurple.shade300,
                  selected: _showVwap,
                  onChanged: (v) => setState(() => _showVwap = v),
                ),
              ],
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 260,
              child: _candlestickMode
                  ? _CandlestickChart(candles: widget.chartCandles, cs: cs)
                  : LineChart(
                      LineChartData(
                        minY: minY,
                        maxY: maxY,
                        backgroundColor: cs.surfaceContainerHighest.withAlpha(
                          40,
                        ),
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
                              interval: (widget.chartCandles.length / 5)
                                  .ceilToDouble(),
                              getTitlesWidget: (value, meta) {
                                final idx = value.toInt();
                                if (idx < 0 ||
                                    idx >= widget.chartCandles.length) {
                                  return const SizedBox();
                                }
                                return Text(
                                  DateFormat(
                                    'M/d',
                                  ).format(widget.chartCandles[idx].date),
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
                        lineBarsData: bars,
                        lineTouchData: LineTouchData(
                          touchTooltipData: LineTouchTooltipData(
                            getTooltipItems: (spots) => spots.map((spot) {
                              final colors = [
                                Colors.blue.shade600,
                                Colors.green.shade600,
                                Colors.purple.shade500,
                                Colors.deepOrange.shade400,
                              ];
                              final labels = [
                                'Price',
                                if (_showSma50) 'SMA50',
                                if (_showSma150) 'SMA150',
                                if (_showSma200) 'SMA200',
                              ];
                              final idx = spot.barIndex;
                              final color = idx < colors.length
                                  ? colors[idx]
                                  : Colors.grey;
                              final label = idx < labels.length
                                  ? labels[idx]
                                  : 'SMA';
                              return LineTooltipItem(
                                '$label: \$${spot.y.toStringAsFixed(2)}',
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
            const SizedBox(height: 8),
            // Volume bar chart
            _VolumeChart(chartCandles: widget.chartCandles, cs: widget.cs),
            // RSI sub-panel
            if (_showRsi) _RsiPanel(candles: widget.chartCandles, cs: cs),
            // MACD sub-panel
            if (_showMacd) _MacdPanel(candles: widget.chartCandles, cs: cs),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Candlestick chart (custom painter)
// ---------------------------------------------------------------------------

class _CandlestickChart extends StatefulWidget {
  const _CandlestickChart({required this.candles, required this.cs});

  final List<DailyCandle> candles;
  final ColorScheme cs;

  @override
  State<_CandlestickChart> createState() => _CandlestickChartState();
}

class _CandlestickChartState extends State<_CandlestickChart> {
  int? _hoverIndex;

  @override
  Widget build(BuildContext context) {
    if (widget.candles.isEmpty) return const SizedBox();
    return LayoutBuilder(
      builder: (context, constraints) {
        return GestureDetector(
          onTapDown: (d) {
            final candleWidth = constraints.maxWidth / widget.candles.length;
            setState(
              () => _hoverIndex = (d.localPosition.dx / candleWidth)
                  .floor()
                  .clamp(0, widget.candles.length - 1),
            );
          },
          onTapUp: (_) => setState(() => _hoverIndex = null),
          child: CustomPaint(
            size: Size(constraints.maxWidth, constraints.maxHeight),
            painter: _CandlestickPainter(
              candles: widget.candles,
              hoverIndex: _hoverIndex,
              upColor: Colors.green.shade500,
              downColor: Colors.red.shade500,
              bgColor: widget.cs.surfaceContainerHighest.withAlpha(40),
            ),
          ),
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Price Targets card
// ---------------------------------------------------------------------------

class _PriceTargetsCard extends ConsumerStatefulWidget {
  const _PriceTargetsCard({required this.symbol});
  final String symbol;

  @override
  ConsumerState<_PriceTargetsCard> createState() => _PriceTargetsCardState();
}

class _PriceTargetsCardState extends ConsumerState<_PriceTargetsCard> {
  final _priceController = TextEditingController();
  final _noteController = TextEditingController();

  @override
  void dispose() {
    _priceController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final targetsAsync = ref.watch(priceTargetsProvider(widget.symbol));
    final cs = Theme.of(context).colorScheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.gps_fixed_rounded, size: 18),
                const SizedBox(width: 8),
                Text(
                  'Price Targets',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const Spacer(),
                FilledButton.tonal(
                  onPressed: () => _showAddDialog(context),
                  child: const Text('+ Add'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            switch (targetsAsync) {
              AsyncData(:final value) when value.isEmpty => Text(
                'No price targets set.',
                style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13),
              ),
              AsyncData(:final value) => Column(
                children: value
                    .map((t) => _TargetTile(target: t, symbol: widget.symbol))
                    .toList(),
              ),
              AsyncLoading() => const LinearProgressIndicator(),
              _ => const SizedBox.shrink(),
            },
          ],
        ),
      ),
    );
  }

  Future<void> _showAddDialog(BuildContext context) async {
    _priceController.clear();
    _noteController.clear();

    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Price Target'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _priceController,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              decoration: const InputDecoration(
                labelText: 'Target price (\$)',
                prefixText: '\$',
                border: OutlineInputBorder(),
              ),
              autofocus: true,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _noteController,
              decoration: const InputDecoration(
                labelText: 'Note (optional)',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              final price = double.tryParse(_priceController.text.trim());
              if (price == null || price <= 0) return;
              Navigator.of(ctx).pop();
              final repo = await ref.read(repositoryProvider.future);
              await repo.addPriceTarget(
                PriceTarget(
                  symbol: widget.symbol,
                  targetPrice: price,
                  note: _noteController.text.trim().isEmpty
                      ? null
                      : _noteController.text.trim(),
                ),
              );
              ref.invalidate(priceTargetsProvider(widget.symbol));
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }
}

class _TargetTile extends ConsumerWidget {
  const _TargetTile({required this.target, required this.symbol});
  final PriceTarget target;
  final String symbol;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs = Theme.of(context).colorScheme;
    final fired = target.hasFired;
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(
        fired ? Icons.check_circle_rounded : Icons.gps_not_fixed_rounded,
        color: fired ? Colors.green : cs.primary,
        size: 20,
      ),
      title: Text(
        '\$${target.targetPrice.toStringAsFixed(2)}',
        style: TextStyle(
          decoration: fired ? TextDecoration.lineThrough : null,
          color: fired ? cs.onSurfaceVariant : null,
          fontWeight: FontWeight.w600,
        ),
      ),
      subtitle: target.note != null
          ? Text(target.note!, maxLines: 1, overflow: TextOverflow.ellipsis)
          : null,
      trailing: IconButton(
        icon: const Icon(Icons.delete_outline_rounded, size: 18),
        onPressed: () async {
          if (target.id == null) return;
          final repo = await ref.read(repositoryProvider.future);
          await repo.deletePriceTarget(target.id!);
          ref.invalidate(priceTargetsProvider(symbol));
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Pct-Move Threshold card
// ---------------------------------------------------------------------------

class _PctMoveCard extends ConsumerStatefulWidget {
  const _PctMoveCard({required this.symbol});
  final String symbol;

  @override
  ConsumerState<_PctMoveCard> createState() => _PctMoveCardState();
}

class _PctMoveCardState extends ConsumerState<_PctMoveCard> {
  final _pctController = TextEditingController();
  final _noteController = TextEditingController();

  @override
  void dispose() {
    _pctController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(pctMoveThresholdsProvider(widget.symbol));
    final cs = Theme.of(context).colorScheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.percent_rounded, size: 18),
                const SizedBox(width: 8),
                Text(
                  '% Move Alerts',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const Spacer(),
                FilledButton.tonal(
                  onPressed: () => _showAddDialog(context),
                  child: const Text('+ Add'),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Fires when price moves ≥ N% from previous close.',
              style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant),
            ),
            const SizedBox(height: 12),
            switch (async) {
              AsyncData(:final value) when value.isEmpty => Text(
                'No thresholds set.',
                style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13),
              ),
              AsyncData(:final value) => Column(
                children: value
                    .map(
                      (t) => _PctMoveTile(threshold: t, symbol: widget.symbol),
                    )
                    .toList(),
              ),
              AsyncLoading() => const LinearProgressIndicator(),
              _ => const SizedBox.shrink(),
            },
          ],
        ),
      ),
    );
  }

  Future<void> _showAddDialog(BuildContext context) async {
    _pctController.clear();
    _noteController.clear();

    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add % Move Alert'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _pctController,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              decoration: const InputDecoration(
                labelText: 'Threshold (%)',
                suffixText: '%',
                border: OutlineInputBorder(),
                helperText: 'e.g. 5 fires when price moves ±5%',
              ),
              autofocus: true,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _noteController,
              decoration: const InputDecoration(
                labelText: 'Note (optional)',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              final pct = double.tryParse(_pctController.text.trim());
              if (pct == null || pct <= 0) return;
              Navigator.of(ctx).pop();
              final repo = await ref.read(repositoryProvider.future);
              await repo.addPctMoveThreshold(
                PctMoveThreshold(
                  symbol: widget.symbol,
                  thresholdPct: pct,
                  note: _noteController.text.trim().isEmpty
                      ? null
                      : _noteController.text.trim(),
                ),
              );
              ref.invalidate(pctMoveThresholdsProvider(widget.symbol));
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }
}

class _PctMoveTile extends ConsumerWidget {
  const _PctMoveTile({required this.threshold, required this.symbol});
  final PctMoveThreshold threshold;
  final String symbol;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: const Icon(Icons.trending_up_rounded, size: 20),
      title: Text(
        '±${threshold.thresholdPct.toStringAsFixed(1)}%',
        style: const TextStyle(fontWeight: FontWeight.w600),
      ),
      subtitle: threshold.note != null
          ? Text(threshold.note!, maxLines: 1, overflow: TextOverflow.ellipsis)
          : null,
      trailing: IconButton(
        icon: const Icon(Icons.delete_outline_rounded, size: 18),
        onPressed: () async {
          if (threshold.id == null) return;
          final repo = await ref.read(repositoryProvider.future);
          await repo.deletePctMoveThreshold(threshold.id!);
          ref.invalidate(pctMoveThresholdsProvider(symbol));
        },
      ),
    );
  }
}

class _CandlestickPainter extends CustomPainter {
  _CandlestickPainter({
    required this.candles,
    required this.hoverIndex,
    required this.upColor,
    required this.downColor,
    required this.bgColor,
  });

  final List<DailyCandle> candles;
  final int? hoverIndex;
  final Color upColor;
  final Color downColor;
  final Color bgColor;

  @override
  void paint(Canvas canvas, Size size) {
    if (candles.isEmpty) return;

    // Background
    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.width, size.height),
      Paint()..color = bgColor,
    );

    final prices = candles.expand((c) => [c.high, c.low]).toList();
    final minP = prices.reduce((a, b) => a < b ? a : b);
    final maxP = prices.reduce((a, b) => a > b ? a : b);
    final priceRange = (maxP - minP).abs();
    if (priceRange == 0) return;

    double toY(double price) =>
        size.height -
        (price - minP) / priceRange * size.height * 0.9 -
        size.height * 0.05;

    final candleWidth = size.width / candles.length;
    final bodyWidth = (candleWidth * 0.6).clamp(1.5, 12.0);
    final wickPaint = Paint()..strokeWidth = 1;
    final bodyPaint = Paint();

    for (var i = 0; i < candles.length; i++) {
      final c = candles[i];
      final isUp = c.close >= c.open;
      final color = isUp ? upColor : downColor;
      wickPaint.color = color.withAlpha(200);
      bodyPaint.color = i == hoverIndex ? Colors.amber.shade400 : color;

      final cx = (i + 0.5) * candleWidth;
      // Wick
      canvas.drawLine(
        Offset(cx, toY(c.high)),
        Offset(cx, toY(c.low)),
        wickPaint,
      );
      // Body
      final bodyTop = toY(isUp ? c.close : c.open);
      final bodyBottom = toY(isUp ? c.open : c.close);
      final bodyHeight = (bodyBottom - bodyTop).abs().clamp(
        1.0,
        double.infinity,
      );
      canvas.drawRect(
        Rect.fromLTWH(cx - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight),
        bodyPaint,
      );
    }

    // Hover tooltip
    if (hoverIndex != null && hoverIndex! < candles.length) {
      final c = candles[hoverIndex!];
      final cx = (hoverIndex! + 0.5) * candleWidth;
      final tooltipText =
          'O:\$${c.open.toStringAsFixed(2)}  H:\$${c.high.toStringAsFixed(2)}\n'
          'L:\$${c.low.toStringAsFixed(2)}   C:\$${c.close.toStringAsFixed(2)}';
      final tp = TextPainter(
        text: TextSpan(
          text: tooltipText,
          style: const TextStyle(fontSize: 10, color: Colors.white),
        ),
        textDirection: ui.TextDirection.ltr,
      )..layout(maxWidth: 160);
      final rx = cx + 8;
      const ry = 8.0;
      final bgRect = Rect.fromLTWH(
        rx.clamp(0, size.width - tp.width - 10),
        ry,
        tp.width + 8,
        tp.height + 6,
      );
      canvas.drawRRect(
        RRect.fromRectAndRadius(bgRect, const Radius.circular(6)),
        Paint()..color = Colors.black.withAlpha(180),
      );
      tp.paint(canvas, Offset(bgRect.left + 4, bgRect.top + 3));
    }
  }

  @override
  bool shouldRepaint(_CandlestickPainter old) =>
      old.candles != candles || old.hoverIndex != hoverIndex;
}

class _SmaToggleChip extends StatelessWidget {
  const _SmaToggleChip({
    required this.label,
    required this.color,
    required this.selected,
    required this.onChanged,
  });

  final String label;
  final Color color;
  final bool selected;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label, style: const TextStyle(fontSize: 11)),
      selected: selected,
      selectedColor: color.withAlpha(35),
      checkmarkColor: color,
      side: BorderSide(color: selected ? color : Colors.grey.shade300),
      onSelected: onChanged,
    );
  }
}

// ---------------------------------------------------------------------------
// RSI sub-panel
// ---------------------------------------------------------------------------

class _RsiPanel extends StatelessWidget {
  const _RsiPanel({required this.candles, required this.cs});

  final List<DailyCandle> candles;
  final ColorScheme cs;

  @override
  Widget build(BuildContext context) {
    final series = const RsiCalculator().computeSeries(candles, period: 14);
    final spots = <FlSpot>[];
    for (int i = 0; i < series.length; i++) {
      if (series[i].$2 != null) spots.add(FlSpot(i.toDouble(), series[i].$2!));
    }
    if (spots.isEmpty) return const SizedBox();
    return Card(
      margin: const EdgeInsets.only(top: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'RSI (14)',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            SizedBox(
              height: 100,
              child: LineChart(
                LineChartData(
                  minY: 0,
                  maxY: 100,
                  extraLinesData: ExtraLinesData(
                    horizontalLines: [
                      HorizontalLine(
                        y: 70,
                        color: Colors.red.withAlpha(120),
                        strokeWidth: 1,
                        dashArray: [4, 3],
                      ),
                      HorizontalLine(
                        y: 30,
                        color: Colors.green.withAlpha(120),
                        strokeWidth: 1,
                        dashArray: [4, 3],
                      ),
                    ],
                  ),
                  lineBarsData: [
                    LineChartBarData(
                      spots: spots,
                      isCurved: true,
                      color: Colors.lime.shade600,
                      barWidth: 2,
                      dotData: const FlDotData(show: false),
                    ),
                  ],
                  gridData: const FlGridData(show: false),
                  borderData: FlBorderData(show: false),
                  titlesData: const FlTitlesData(show: false),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// MACD sub-panel
// ---------------------------------------------------------------------------

class _MacdPanel extends StatelessWidget {
  const _MacdPanel({required this.candles, required this.cs});

  final List<DailyCandle> candles;
  final ColorScheme cs;

  @override
  Widget build(BuildContext context) {
    final series = const MacdCalculator().computeSeries(candles);
    final macdSpots = <FlSpot>[];
    final signalSpots = <FlSpot>[];
    final histBars = <BarChartGroupData>[];
    for (int i = 0; i < series.length; i++) {
      final r = series[i];
      if (r.macd != null) {
        macdSpots.add(FlSpot(i.toDouble(), r.macd!));
      }
      if (r.signal != null) {
        signalSpots.add(FlSpot(i.toDouble(), r.signal!));
      }
      if (r.histogram != null) {
        histBars.add(
          BarChartGroupData(
            x: i,
            barRods: [
              BarChartRodData(
                toY: r.histogram!,
                color: r.histogram! >= 0
                    ? Colors.green.shade400
                    : Colors.red.shade400,
                width: 2,
              ),
            ],
          ),
        );
      }
    }
    if (macdSpots.isEmpty) return const SizedBox();
    return Card(
      margin: const EdgeInsets.only(top: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'MACD (12, 26, 9)',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            SizedBox(
              height: 100,
              child: LineChart(
                LineChartData(
                  lineBarsData: [
                    LineChartBarData(
                      spots: macdSpots,
                      isCurved: true,
                      color: Colors.blueAccent,
                      barWidth: 1.8,
                      dotData: const FlDotData(show: false),
                    ),
                    if (signalSpots.isNotEmpty)
                      LineChartBarData(
                        spots: signalSpots,
                        isCurved: true,
                        color: Colors.orange,
                        barWidth: 1.5,
                        dashArray: [4, 3],
                        dotData: const FlDotData(show: false),
                      ),
                  ],
                  extraLinesData: ExtraLinesData(
                    horizontalLines: [
                      HorizontalLine(
                        y: 0,
                        color: Colors.grey.withAlpha(100),
                        strokeWidth: 1,
                      ),
                    ],
                  ),
                  gridData: const FlGridData(show: false),
                  borderData: FlBorderData(show: false),
                  titlesData: const FlTitlesData(show: false),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Volume mini-chart
// ---------------------------------------------------------------------------

class _VolumeChart extends StatelessWidget {
  const _VolumeChart({required this.chartCandles, required this.cs});

  final List<DailyCandle> chartCandles;
  final ColorScheme cs;

  @override
  Widget build(BuildContext context) {
    if (chartCandles.isEmpty) return const SizedBox();

    final maxVolume = chartCandles
        .map((c) => c.volume.toDouble())
        .reduce((a, b) => a > b ? a : b);
    if (maxVolume <= 0) return const SizedBox();

    // Reduce to at most 120 bars for performance (sample evenly)
    const maxBars = 120;
    final step = (chartCandles.length / maxBars).ceil().clamp(1, 999);
    final bars = <BarChartGroupData>[];
    for (var i = 0; i < chartCandles.length; i += step) {
      final c = chartCandles[i];
      final isUp = i == 0 || c.close >= chartCandles[i - 1].close;
      bars.add(
        BarChartGroupData(
          x: i,
          barRods: [
            BarChartRodData(
              toY: c.volume.toDouble(),
              width: step > 1 ? 3.0 : 2.0,
              color: isUp
                  ? Colors.green.withAlpha(160)
                  : Colors.red.withAlpha(160),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '📊 Volume',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: Colors.grey.shade600,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 4),
        SizedBox(
          height: 60,
          child: BarChart(
            BarChartData(
              maxY: maxVolume * 1.1,
              barGroups: bars,
              gridData: const FlGridData(show: false),
              borderData: FlBorderData(show: false),
              titlesData: const FlTitlesData(
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                topTitles: AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                rightTitles: AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
              ),
              barTouchData: BarTouchData(
                touchTooltipData: BarTouchTooltipData(
                  getTooltipItem: (group, groupIndex, rod, rodIndex) {
                    final vol = rod.toY;
                    final display = vol >= 1e9
                        ? '${(vol / 1e9).toStringAsFixed(1)}B'
                        : vol >= 1e6
                        ? '${(vol / 1e6).toStringAsFixed(1)}M'
                        : vol.toStringAsFixed(0);
                    return BarTooltipItem(
                      display,
                      const TextStyle(fontSize: 11, color: Colors.white),
                    );
                  },
                ),
              ),
            ),
          ),
        ),
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
// Alert Type Selector Card
// ---------------------------------------------------------------------------

class _AlertTypeSelectorCard extends ConsumerWidget {
  const _AlertTypeSelectorCard({required this.symbol});

  final String symbol;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final typesAsync = ref.watch(tickerEnabledAlertTypesProvider(symbol));

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.tune_rounded,
                  size: 18,
                  color: Color(0xFF1565C0),
                ),
                const SizedBox(width: 8),
                Text(
                  '⚙️ Alert Types',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Choose which crossover events trigger notifications.',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 12),
            typesAsync.when(
              loading: () => const LinearProgressIndicator(),
              error: (e, _) => Text('⚠️ Error: $e'),
              data: (enabled) => Wrap(
                spacing: 8,
                runSpacing: 8,
                children: AlertType.values.map((type) {
                  final isOn = enabled.contains(type);
                  return FilterChip(
                    selected: isOn,
                    label: Text(
                      type.displayName,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: isOn ? FontWeight.w700 : FontWeight.normal,
                      ),
                    ),
                    tooltip: type.description,
                    onSelected: (value) =>
                        _toggle(context, ref, enabled, type, value),
                    selectedColor: _chipColor(type).withAlpha(40),
                    checkmarkColor: _chipColor(type),
                    side: BorderSide(
                      color: isOn ? _chipColor(type) : Colors.grey.shade300,
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  static Color _chipColor(AlertType type) => switch (type) {
    AlertType.sma50CrossUp => Colors.green.shade700,
    AlertType.sma150CrossUp => Colors.purple.shade700,
    AlertType.sma200CrossUp => Colors.orange.shade700,
    AlertType.goldenCross => Colors.amber.shade800,
    AlertType.deathCross => Colors.red.shade700,
    AlertType.priceTarget => Colors.teal.shade700,
    AlertType.pctMove => Colors.blue.shade700,
    AlertType.volumeSpike => Colors.purple.shade700,
    AlertType.michoMethodBuy => Colors.green.shade900,
    AlertType.michoMethodSell => Colors.red.shade900,
    AlertType.rsiMethodBuy => Colors.green.shade600,
    AlertType.rsiMethodSell => Colors.red.shade600,
    AlertType.macdMethodBuy => Colors.green.shade700,
    AlertType.macdMethodSell => Colors.red.shade700,
    AlertType.bollingerMethodBuy => Colors.green.shade800,
    AlertType.bollingerMethodSell => Colors.red.shade800,
    AlertType.consensusBuy => const Color(0xFF1B5E20),
    AlertType.consensusSell => const Color(0xFFB71C1C),
  };

  Future<void> _toggle(
    BuildContext context,
    WidgetRef ref,
    Set<AlertType> current,
    AlertType type,
    bool selected,
  ) async {
    final next = {...current};
    if (selected) {
      next.add(type);
    } else {
      next.remove(type);
      // Always keep at least one alert type enabled
      if (next.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('At least one alert type must stay enabled.'),
          ),
        );
        return;
      }
    }
    try {
      final repo = await ref.read(repositoryProvider.future);
      await repo.updateTickerAlertTypes(symbol, next);
      ref.invalidate(tickerEnabledAlertTypesProvider(symbol));
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to save: $e')));
      }
    }
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

// ---------------------------------------------------------------------------
// Earnings date badge
// ---------------------------------------------------------------------------

class _EarningsBadge extends StatelessWidget {
  const _EarningsBadge({required this.entry});

  final TickerEntry entry;

  @override
  Widget build(BuildContext context) {
    final dt = entry.nextEarningsAt;
    if (dt == null) return const SizedBox.shrink();

    final now = DateTime.now().toLocal();
    final daysUntil = dt.toLocal().difference(now).inDays;

    // Don't show stale dates
    if (daysUntil < -3) return const SizedBox.shrink();

    final (bg, fg, label) = switch (daysUntil) {
      <= 3 => (Colors.red.shade600, Colors.white, 'Earnings soon'),
      <= 7 => (Colors.orange.shade600, Colors.white, 'Earnings ~${daysUntil}d'),
      _ => (Colors.green.shade700, Colors.white, 'Earnings ${daysUntil}d'),
    };

    return Tooltip(
      message: 'Next earnings: ${DateFormat('MMM d').format(dt.toLocal())}',
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 10,
            color: fg,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Intraday Quote Bar
// ---------------------------------------------------------------------------

/// Real-time price row shown below the AppBar in ticker detail.
///
/// Shows: current price, change amount + %, market state badge.
/// Pre-market and after-hours prices shown when available.
class _QuoteBar extends ConsumerWidget {
  const _QuoteBar({required this.symbol});

  final String symbol;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final quoteAsync = ref.watch(intradayQuoteProvider(symbol));
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return switch (quoteAsync) {
      AsyncLoading() => const SizedBox.shrink(),
      AsyncError() => const SizedBox.shrink(),
      AsyncData(:final value) when value == null => const SizedBox.shrink(),
      AsyncData(:final value!) => Container(
        color: cs.surfaceContainerHighest.withValues(alpha: 0.4),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        child: Row(
          children: [
            Text(
              '\$${value.price.toStringAsFixed(2)}',
              style: textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(width: 8),
            if (value.change != null && value.changePct != null)
              _ChangeChip(change: value.change!, changePct: value.changePct!),
            const Spacer(),
            _MarketStateBadge(state: value.marketState),
            if (value.isPreMarket && value.preMarketPrice != null) ...[
              const SizedBox(width: 6),
              Text(
                'Pre: \$${value.preMarketPrice!.toStringAsFixed(2)}',
                style: textTheme.bodySmall?.copyWith(color: cs.outline),
              ),
            ],
            if (value.isAfterHours && value.postMarketPrice != null) ...[
              const SizedBox(width: 6),
              Text(
                'AH: \$${value.postMarketPrice!.toStringAsFixed(2)}',
                style: textTheme.bodySmall?.copyWith(color: cs.outline),
              ),
            ],
          ],
        ),
      ),
    };
  }
}

class _ChangeChip extends StatelessWidget {
  const _ChangeChip({required this.change, required this.changePct});

  final double change;
  final double changePct;

  @override
  Widget build(BuildContext context) {
    final isPositive = change >= 0;
    final bg = isPositive ? Colors.green.shade700 : Colors.red.shade700;
    final sign = isPositive ? '+' : '';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        '$sign${change.toStringAsFixed(2)} ($sign${changePct.toStringAsFixed(2)}%)',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _MarketStateBadge extends StatelessWidget {
  const _MarketStateBadge({required this.state});

  final String state;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (state) {
      'REGULAR' => ('Market Open', Colors.green.shade600),
      'PRE' => ('Pre-Market', Colors.orange.shade600),
      'POST' => ('After Hours', Colors.blue.shade600),
      _ => ('Closed', Colors.grey.shade500),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        border: Border.all(color: color),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          color: color,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Alert Sensitivity Stats Card
// ---------------------------------------------------------------------------

class _SensitivityStatsCard extends ConsumerWidget {
  const _SensitivityStatsCard({required this.symbol});

  final String symbol;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(alertSensitivityProvider(symbol));
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return statsAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
      data: (stats) {
        if (stats.totalAlerts == 0) return const SizedBox.shrink();

        final df = DateFormat('MMM d, yyyy');
        final avgLabel = stats.avgDaysBetweenAlerts != null
            ? '${stats.avgDaysBetweenAlerts!.toStringAsFixed(1)} days'
            : '—';

        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.insights_rounded, size: 18, color: cs.primary),
                    const SizedBox(width: 8),
                    Text(
                      'Alert Sensitivity',
                      style: textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _StatRow(
                  label: 'Total alerts fired',
                  value: '${stats.totalAlerts}',
                ),
                if (stats.firstFiredAt != null)
                  _StatRow(
                    label: 'First alert',
                    value: df.format(stats.firstFiredAt!.toLocal()),
                  ),
                if (stats.lastFiredAt != null)
                  _StatRow(
                    label: 'Last alert',
                    value: df.format(stats.lastFiredAt!.toLocal()),
                  ),
                _StatRow(label: 'Avg days between alerts', value: avgLabel),
                if (stats.alertsByType.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: stats.alertsByType.entries
                        .map(
                          (e) => Chip(
                            label: Text(
                              '${e.key}: ${e.value}',
                              style: const TextStyle(fontSize: 11),
                            ),
                            backgroundColor: cs.primaryContainer,
                            labelStyle: TextStyle(color: cs.onPrimaryContainer),
                            padding: EdgeInsets.zero,
                            visualDensity: VisualDensity.compact,
                          ),
                        )
                        .toList(),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}

class _StatRow extends StatelessWidget {
  const _StatRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
          ),
          Text(
            value,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Per-ticker Research Notes Card
// ---------------------------------------------------------------------------

class _NotesCard extends ConsumerStatefulWidget {
  const _NotesCard({required this.symbol});

  final String symbol;

  @override
  ConsumerState<_NotesCard> createState() => _NotesCardState();
}

class _NotesCardState extends ConsumerState<_NotesCard> {
  @override
  Widget build(BuildContext context) {
    final notesAsync = ref.watch(tickerNotesProvider(widget.symbol));
    final cs = Theme.of(context).colorScheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.notes_rounded, size: 18, color: cs.primary),
                const SizedBox(width: 8),
                Text(
                  'Research Notes',
                  style: Theme.of(
                    context,
                  ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                ),
                const Spacer(),
                FilledButton.tonal(
                  onPressed: () => _showAddDialog(context),
                  child: const Text('+ Note'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            switch (notesAsync) {
              AsyncLoading() => const LinearProgressIndicator(),
              AsyncError(:final error) => Text(
                '⚠️ $error',
                style: TextStyle(color: cs.error, fontSize: 12),
              ),
              AsyncData(:final value) when value.isEmpty => Text(
                'No notes yet. Tap + Note to add one.',
                style: TextStyle(
                  fontSize: 12,
                  color: cs.onSurfaceVariant,
                  fontStyle: FontStyle.italic,
                ),
              ),
              AsyncData(:final value) => ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: value.length,
                separatorBuilder: (_, _) => const Divider(height: 1),
                itemBuilder: (ctx, i) => _NoteTile(
                  note: value[i],
                  onEdit: () => _showEditDialog(context, value[i]),
                  onDelete: () => _deleteNote(value[i]),
                ),
              ),
            },
          ],
        ),
      ),
    );
  }

  static const _noteMaxLength = 500;

  Future<void> _showAddDialog(BuildContext context) async {
    final controller = TextEditingController();
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Note'),
        content: TextField(
          controller: controller,
          autofocus: true,
          maxLines: 5,
          maxLength: _noteMaxLength,
          decoration: const InputDecoration(
            hintText: 'Your research note…',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              final text = controller.text.trim();
              if (text.isEmpty) return;
              Navigator.of(ctx).pop();
              await _insertNote(text);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
    controller.dispose();
  }

  Future<void> _showEditDialog(BuildContext context, TickerNote note) async {
    final controller = TextEditingController(text: note.content);
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit Note'),
        content: TextField(
          controller: controller,
          autofocus: true,
          maxLines: 5,
          maxLength: _noteMaxLength,
          decoration: const InputDecoration(border: OutlineInputBorder()),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              final text = controller.text.trim();
              if (text.isEmpty) return;
              Navigator.of(ctx).pop();
              await _updateNote(note.id!, text);
            },
            child: const Text('Update'),
          ),
        ],
      ),
    );
    controller.dispose();
  }

  Future<void> _insertNote(String text) async {
    final db = ref.read(databaseProvider);
    await db.insertNote(
      TickerNotesTableCompanion.insert(symbol: widget.symbol, content: text),
    );
  }

  Future<void> _updateNote(int id, String text) async {
    final db = ref.read(databaseProvider);
    await db.updateNote(id, text);
  }

  Future<void> _deleteNote(TickerNote note) async {
    if (note.id == null) return;
    final db = ref.read(databaseProvider);
    await db.deleteNote(note.id!);
  }
}

class _NoteTile extends StatelessWidget {
  const _NoteTile({
    required this.note,
    required this.onEdit,
    required this.onDelete,
  });

  final TickerNote note;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final df = DateFormat('MMM d, yyyy HH:mm');
    final charCount = note.content.length;

    // Show created date; append edited timestamp when note has been modified.
    final createdLine = 'Created ${df.format(note.createdAt.toLocal())}';
    final editedLine = note.isEdited
        ? '  ·  Edited ${df.format(note.updatedAt!.toLocal())}'
        : '';
    final displayDate = '$createdLine$editedLine';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.sticky_note_2_outlined, size: 16, color: cs.primary),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(note.content, style: const TextStyle(fontSize: 13)),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        displayDate,
                        style: TextStyle(
                          fontSize: 10,
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                    ),
                    Text(
                      '$charCount chars',
                      style: TextStyle(
                        fontSize: 10,
                        color: cs.onSurfaceVariant.withAlpha(140),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.edit_outlined, size: 16),
            splashRadius: 16,
            tooltip: 'Edit',
            onPressed: onEdit,
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline_rounded, size: 16),
            splashRadius: 16,
            tooltip: 'Delete',
            onPressed: onDelete,
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Signal Confidence Score Card
// ---------------------------------------------------------------------------

class _SignalScoreCard extends ConsumerWidget {
  const _SignalScoreCard({required this.symbol});

  final String symbol;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scoreAsync = ref.watch(signalConfidenceProvider(symbol));
    final cs = Theme.of(context).colorScheme;

    return scoreAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
      data: (score) {
        final (color, label) = switch (score.strength) {
          SignalStrength.strong => (Colors.green.shade600, 'Strong'),
          SignalStrength.moderate => (Colors.orange.shade600, 'Moderate'),
          SignalStrength.weak => (Colors.deepOrange.shade400, 'Weak'),
          SignalStrength.none => (Colors.grey.shade500, 'None'),
        };

        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.analytics_rounded, size: 18, color: cs.primary),
                    const SizedBox(width: 8),
                    Text(
                      'Signal Confidence',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: color.withAlpha(22),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: color.withAlpha(80)),
                      ),
                      child: Text(
                        '$label  ${score.score}/100',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: color,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                LinearProgressIndicator(
                  value: score.score / 100,
                  color: color,
                  backgroundColor: color.withAlpha(30),
                  minHeight: 8,
                  borderRadius: BorderRadius.circular(4),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    _FactorChip(label: 'Above SMA200', met: score.aboveSma200),
                    _FactorChip(
                      label: 'Golden Cross',
                      met: score.goldenCrossForm,
                    ),
                    _FactorChip(
                      label: 'Trend Momentum',
                      met: score.trendMomentum,
                    ),
                    _FactorChip(label: 'RSI 40–70', met: score.rsiHealthy),
                    _FactorChip(
                      label: 'Volume Spike',
                      met: score.volumeConfirm,
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _FactorChip extends StatelessWidget {
  const _FactorChip({required this.label, required this.met});

  final String label;
  final bool met;

  @override
  Widget build(BuildContext context) {
    final color = met ? Colors.green.shade600 : Colors.grey.shade400;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withAlpha(18),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withAlpha(80)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            met ? Icons.check_circle_rounded : Icons.cancel_rounded,
            size: 12,
            color: color,
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// ATR (Average True Range) Card
// ---------------------------------------------------------------------------

class _AtrCard extends ConsumerWidget {
  const _AtrCard({required this.symbol});

  final String symbol;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final atrAsync = ref.watch(atrProvider(symbol));
    final cs = Theme.of(context).colorScheme;

    return atrAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
      data: (result) {
        if (result == null) return const SizedBox.shrink();

        // Volatility label: low < 2%, moderate 2–5%, high > 5%
        final (volLabel, volColor) = switch (result.atrPercent) {
          < 2.0 => ('Low Volatility', Colors.green.shade600),
          < 5.0 => ('Moderate Volatility', Colors.orange.shade600),
          _ => ('High Volatility', Colors.red.shade700),
        };

        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.waves_rounded, size: 18, color: cs.primary),
                    const SizedBox(width: 8),
                    Text(
                      'ATR (14)',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: volColor.withAlpha(22),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: volColor.withAlpha(80)),
                      ),
                      child: Text(
                        volLabel,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: volColor,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _AtrMetric(
                        label: 'ATR Value',
                        value:
                            '\$${result.atr.toStringAsFixed(result.atr < 10 ? 3 : 2)}',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _AtrMetric(
                        label: 'ATR %',
                        value: '${result.atrPercent.toStringAsFixed(2)}%',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Average True Range measures expected daily price swing. '
                  'Larger ATR = more volatile.',
                  style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _AtrMetric extends StatelessWidget {
  const _AtrMetric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withAlpha(80),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(fontSize: 10, color: cs.onSurfaceVariant),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// VWAP Card
// ---------------------------------------------------------------------------

class _VwapCard extends ConsumerWidget {
  const _VwapCard({required this.symbol});

  final String symbol;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vwapAsync = ref.watch(vwapProvider(symbol));
    final priceAsync = ref.watch(tickerCandlesProvider(symbol));
    final cs = Theme.of(context).colorScheme;

    return vwapAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
      data: (result) {
        if (result == null) return const SizedBox.shrink();

        final lastClose = switch (priceAsync) {
          AsyncData(:final value) when value.isNotEmpty => value.last.close,
          _ => null,
        };

        final bool? aboveVwap = lastClose != null
            ? lastClose > result.vwap
            : null;
        final (signalLabel, signalColor) = switch (aboveVwap) {
          true => ('Price > VWAP  (Bullish)', Colors.green.shade600),
          false => ('Price < VWAP  (Bearish)', Colors.red.shade700),
          null => ('—', Colors.grey.shade500),
        };

        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.waterfall_chart_rounded,
                      size: 18,
                      color: cs.primary,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'VWAP',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: signalColor.withAlpha(22),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: signalColor.withAlpha(80)),
                      ),
                      child: Text(
                        signalLabel,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: signalColor,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _AtrMetric(
                        label: 'VWAP',
                        value:
                            '\$${result.vwap.toStringAsFixed(result.vwap < 10 ? 3 : 2)}',
                      ),
                    ),
                    if (lastClose != null) ...[
                      const SizedBox(width: 12),
                      Expanded(
                        child: _AtrMetric(
                          label: 'vs VWAP',
                          value: () {
                            final diff =
                                (lastClose - result.vwap) / result.vwap * 100;
                            final sign = diff >= 0 ? '+' : '';
                            return '$sign${diff.toStringAsFixed(2)}%';
                          }(),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Cumulative VWAP calculated over all available daily candles.',
                  style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
