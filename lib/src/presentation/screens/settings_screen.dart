/// Settings Screen — Theme, refresh interval, quiet hours, trend strictness, API key.
library;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../domain/entities.dart';
import '../providers.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final _apiKeyController = TextEditingController();
  AppSettings _settings = const AppSettings();
  bool _loaded = false;
  bool _apiKeyObscured = true;

  @override
  void dispose() {
    _apiKeyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final settingsAsync = ref.watch(settingsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.tune_rounded, size: 22),
            SizedBox(width: 8),
            Text('⚙️ Settings'),
          ],
        ),
      ),
      body: settingsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.error_outline_rounded,
                size: 48,
                color: Colors.red,
              ),
              const SizedBox(height: 12),
              Text('⚠️ Could not load settings: $e'),
            ],
          ),
        ),
        data: (settings) {
          if (!_loaded) {
            _settings = settings;
            _loaded = true;
          }

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Theme Mode
              const _SettingsSection(
                    icon: Icons.palette_outlined,
                    title: '🌗 Theme',
                    subtitle: 'Light, Dark, or follow the system setting',
                    child: _ThemeModePicker(),
                  )
                  .animate()
                  .fadeIn(duration: 300.ms)
                  .slideY(begin: 0.04, end: 0),
              const SizedBox(height: 12),

              // Alert Profile Selector
              _SettingsSection(
                icon: Icons.person_outline_rounded,
                title: '🎯 Alert Profile',
                subtitle: 'Pick a preset that suits your trading style',
                child: _ProfileSelector(
                  current: _settings,
                  onSelected: (s) => setState(() => _settings = s),
                ),
              ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.04, end: 0),
              const SizedBox(height: 12),

              // Refresh Interval
              _SettingsSection(
                    icon: Icons.sync_rounded,
                    title: '🔄 Refresh Interval',
                    subtitle: ref.read(isAndroidProvider)
                        ? '📱 Android WorkManager — min 15 min'
                        : '🖥️ Windows timer (while app is running)',
                    child: _SliderSetting(
                      value: _settings.refreshIntervalMinutes.toDouble(),
                      min: 15,
                      max: 360,
                      divisions: 23,
                      label: '${_settings.refreshIntervalMinutes} min',
                      displayWidget: _ValuePill(
                        icon: Icons.timer_rounded,
                        text: '${_settings.refreshIntervalMinutes} minutes',
                      ),
                      onChanged: (v) => setState(() {
                        _settings = _settings.copyWith(
                          refreshIntervalMinutes: v.round(),
                        );
                      }),
                    ),
                  )
                  .animate(delay: 60.ms)
                  .fadeIn(duration: 300.ms)
                  .slideY(begin: 0.04, end: 0),
              const SizedBox(height: 12),

              // Quiet Hours
              _SettingsSection(
                    icon: Icons.bedtime_rounded,
                    title: '🌙 Quiet Hours',
                    subtitle: 'Suppress notifications during this time window',
                    child: _QuietHoursSetting(
                      start: _settings.quietHoursStart,
                      end: _settings.quietHoursEnd,
                      onStartChanged: (v) => setState(
                        () => _settings = _settings.copyWith(
                          quietHoursStart: v ?? 0,
                        ),
                      ),
                      onEndChanged: (v) => setState(
                        () => _settings = _settings.copyWith(
                          quietHoursEnd: v ?? 0,
                        ),
                      ),
                    ),
                  )
                  .animate(delay: 120.ms)
                  .fadeIn(duration: 300.ms)
                  .slideY(begin: 0.04, end: 0),
              const SizedBox(height: 12),

              // Trend Strictness
              _SettingsSection(
                    icon: Icons.trending_up_rounded,
                    title: '📈 Trend Strictness',
                    subtitle:
                        'Consecutive rising days required before a cross-up alert fires',
                    child: _SliderSetting(
                      value: _settings.trendStrictnessDays.toDouble(),
                      min: 1,
                      max: 5,
                      divisions: 4,
                      label: '${_settings.trendStrictnessDays} day(s)',
                      displayWidget: _ValuePill(
                        icon: Icons.bar_chart_rounded,
                        text: '${_settings.trendStrictnessDays} day(s)',
                      ),
                      onChanged: (v) => setState(() {
                        _settings = _settings.copyWith(
                          trendStrictnessDays: v.round(),
                        );
                      }),
                    ),
                  )
                  .animate(delay: 180.ms)
                  .fadeIn(duration: 300.ms)
                  .slideY(begin: 0.04, end: 0),
              const SizedBox(height: 12),

              // Cache TTL
              _SettingsSection(
                    icon: Icons.cached_rounded,
                    title: '💾 Cache TTL',
                    subtitle:
                        'Skip re-fetching if data was refreshed within this window',
                    child: _SliderSetting(
                      value: _settings.cacheTtlMinutes.toDouble(),
                      min: 5,
                      max: 120,
                      divisions: 23,
                      label: '${_settings.cacheTtlMinutes} min',
                      displayWidget: _ValuePill(
                        icon: Icons.hourglass_top_rounded,
                        text: '${_settings.cacheTtlMinutes} minutes',
                      ),
                      onChanged: (v) => setState(() {
                        _settings = _settings.copyWith(
                          cacheTtlMinutes: v.round(),
                        );
                      }),
                    ),
                  )
                  .animate(delay: 240.ms)
                  .fadeIn(duration: 300.ms)
                  .slideY(begin: 0.04, end: 0),
              const SizedBox(height: 12),

              // Data Provider
              _SettingsSection(
                    icon: Icons.cloud_sync_rounded,
                    title: '🌐 Data Provider',
                    subtitle: 'Source of daily OHLCV price data',
                    child: _ProviderPicker(
                      value: _settings.providerName,
                      onChanged: (v) => setState(() {
                        _settings = _settings.copyWith(
                          providerName: v ?? 'yahoo_finance',
                        );
                      }),
                    ),
                  )
                  .animate(delay: 300.ms)
                  .fadeIn(duration: 300.ms)
                  .slideY(begin: 0.04, end: 0),

              // API Key (Alpha Vantage only)
              if (_settings.providerName == 'alpha_vantage') ...[
                const SizedBox(height: 12),
                _SettingsSection(
                      icon: Icons.vpn_key_rounded,
                      title: '🔑 Alpha Vantage API Key',
                      subtitle: 'Get a free key at alphavantage.co',
                      child: TextField(
                        controller: _apiKeyController,
                        obscureText: _apiKeyObscured,
                        decoration: InputDecoration(
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          labelText: 'API Key',
                          hintText: 'Leave blank to keep current',
                          prefixIcon: const Icon(Icons.key_rounded),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _apiKeyObscured
                                  ? Icons.visibility_rounded
                                  : Icons.visibility_off_rounded,
                            ),
                            onPressed: () => setState(
                              () => _apiKeyObscured = !_apiKeyObscured,
                            ),
                          ),
                        ),
                      ),
                    )
                    .animate(delay: 360.ms)
                    .fadeIn(duration: 300.ms)
                    .slideY(begin: 0.04, end: 0),
              ],
              const SizedBox(height: 24),

              // Save Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: FilledButton.icon(
                  onPressed: _onSave,
                  icon: const Icon(Icons.save_rounded),
                  label: const Text(
                    '💾 Save Settings',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                  style: FilledButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ).animate(delay: 400.ms).fadeIn().slideY(begin: 0.1, end: 0),
              const SizedBox(height: 8),

              // About row
              Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SvgPicture.asset(
                      'assets/svg/logo.svg',
                      width: 18,
                      height: 18,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'CrossTide · SMA Crossover Monitor',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 4),
            ],
          );
        },
      ),
    );
  }

  Future<void> _onSave() async {
    try {
      final repo = await ref.read(repositoryProvider.future);
      if (!mounted) return;
      await repo.saveSettings(_settings);

      const storage = FlutterSecureStorage();
      final apiKey = _apiKeyController.text.trim();
      if (apiKey.isNotEmpty) {
        await storage.write(key: 'market_data_api_key', value: apiKey);
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Icon(Icons.check_circle_rounded, color: Colors.white),
              SizedBox(width: 8),
              Text('✅ Settings saved!'),
            ],
          ),
          backgroundColor: Colors.green.shade700,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          duration: const Duration(seconds: 2),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('⚠️ Failed to save settings: $e')));
    }
  }
}

// ---------------------------------------------------------------------------
// Alert Profile Selector
// ---------------------------------------------------------------------------

class _ProfileSelector extends StatefulWidget {
  const _ProfileSelector({required this.current, required this.onSelected});

  final AppSettings current;
  final ValueChanged<AppSettings> onSelected;

  @override
  State<_ProfileSelector> createState() => _ProfileSelectorState();
}

class _ProfileSelectorState extends State<_ProfileSelector> {
  static const _profiles = [
    (
      profile: AlertProfile.aggressive,
      icon: Icons.flash_on_rounded,
      color: Color(0xFFE53935),
    ),
    (
      profile: AlertProfile.balanced,
      icon: Icons.balance_rounded,
      color: Color(0xFF1565C0),
    ),
    (
      profile: AlertProfile.conservative,
      icon: Icons.shield_rounded,
      color: Color(0xFF2E7D32),
    ),
    (
      profile: AlertProfile.custom,
      icon: Icons.settings_rounded,
      color: Color(0xFF6A1B9A),
    ),
  ];

  AlertProfile? _active;

  AlertProfile _activeProfile(AppSettings s) {
    for (final p in _profiles) {
      if (p.profile == AlertProfile.custom) continue;
      final d = p.profile.defaults;
      if (s.refreshIntervalMinutes == d.refreshIntervalMinutes &&
          s.trendStrictnessDays == d.trendStrictnessDays) {
        return p.profile;
      }
    }
    return AlertProfile.custom;
  }

  @override
  Widget build(BuildContext context) {
    final active = _active ?? _activeProfile(widget.current);
    final cs = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Horizontal chip row
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: _profiles.map((p) {
              final isSelected = active == p.profile;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () {
                    setState(() => _active = p.profile);
                    if (p.profile != AlertProfile.custom) {
                      widget.onSelected(p.profile.defaults);
                    }
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? p.color.withAlpha(25)
                          : cs.surfaceContainerHighest.withAlpha(80),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isSelected
                            ? p.color
                            : Colors.grey.withAlpha(60),
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(p.icon, color: p.color, size: 18),
                        const SizedBox(width: 6),
                        Text(
                          p.profile.displayName,
                          style: TextStyle(
                            fontWeight: isSelected
                                ? FontWeight.w700
                                : FontWeight.normal,
                            color: isSelected
                                ? p.color
                                : cs.onSurface,
                            fontSize: 13,
                          ),
                        ),
                        if (isSelected) ...[
                          const SizedBox(width: 4),
                          Icon(
                            Icons.check_circle_rounded,
                            size: 14,
                            color: p.color,
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 10),
        // Description card for active profile
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          child: _ProfileDescCard(
            key: ValueKey(active),
            profile: active,
          ),
        ),
      ],
    );
  }
}

class _ProfileDescCard extends StatelessWidget {
  const _ProfileDescCard({required this.profile, super.key});

  final AlertProfile profile;

  static const _entries = {
    AlertProfile.aggressive: (
      icon: Icons.flash_on_rounded,
      color: Color(0xFFE53935),
    ),
    AlertProfile.balanced: (
      icon: Icons.balance_rounded,
      color: Color(0xFF1565C0),
    ),
    AlertProfile.conservative: (
      icon: Icons.shield_rounded,
      color: Color(0xFF2E7D32),
    ),
    AlertProfile.custom: (
      icon: Icons.settings_rounded,
      color: Color(0xFF6A1B9A),
    ),
  };

  @override
  Widget build(BuildContext context) {
    final entry = _entries[profile]!;
    final defaults = profile != AlertProfile.custom ? profile.defaults : null;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: entry.color.withAlpha(12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: entry.color.withAlpha(50)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(entry.icon, color: entry.color, size: 16),
              const SizedBox(width: 6),
              Text(
                profile.displayName,
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: entry.color,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            profile.description,
            style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
          ),
          if (defaults != null) ...[
            const SizedBox(height: 6),
            Wrap(
              spacing: 8,
              children: [
                _MiniPill(
                  '🔄 ${defaults.refreshIntervalMinutes} min',
                ),
                _MiniPill(
                  '📈 ${defaults.trendStrictnessDays} trend day(s)',
                ),
                _MiniPill(
                  '💾 ${defaults.cacheTtlMinutes} min cache',
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _MiniPill extends StatelessWidget {
  const _MiniPill(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(text, style: const TextStyle(fontSize: 10)),
    );
  }
}

// ---------------------------------------------------------------------------
// Settings Section Wrapper
// ---------------------------------------------------------------------------

class _SettingsSection extends StatelessWidget {
  const _SettingsSection({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.child,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Card(
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: cs.primaryContainer,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: cs.primary, size: 18),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        subtitle,
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey.shade500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Slider setting
// ---------------------------------------------------------------------------

class _SliderSetting extends StatelessWidget {
  const _SliderSetting({
    required this.value,
    required this.min,
    required this.max,
    required this.divisions,
    required this.label,
    required this.displayWidget,
    required this.onChanged,
  });

  final double value;
  final double min;
  final double max;
  final int divisions;
  final String label;
  final Widget displayWidget;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      children: [
        SliderTheme(
          data: SliderTheme.of(context).copyWith(
            activeTrackColor: cs.primary,
            thumbColor: cs.primary,
            overlayColor: cs.primary.withAlpha(30),
            valueIndicatorColor: cs.primary,
            valueIndicatorTextStyle: const TextStyle(color: Colors.white),
          ),
          child: Slider(
            value: value,
            min: min,
            max: max,
            divisions: divisions,
            label: label,
            onChanged: onChanged,
          ),
        ),
        displayWidget,
      ],
    );
  }
}

class _ValuePill extends StatelessWidget {
  const _ValuePill({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: cs.primaryContainer.withAlpha(100),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: cs.primary),
          const SizedBox(width: 5),
          Text(
            text,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 13,
              color: cs.primary,
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Quiet Hours
// ---------------------------------------------------------------------------

class _QuietHoursSetting extends StatelessWidget {
  const _QuietHoursSetting({
    required this.start,
    required this.end,
    required this.onStartChanged,
    required this.onEndChanged,
  });

  final int? start;
  final int? end;
  final ValueChanged<int?> onStartChanged;
  final ValueChanged<int?> onEndChanged;

  static List<DropdownMenuItem<int?>> _hourItems() => [
    const DropdownMenuItem(value: null, child: Text('🔕 Disabled')),
    for (var h = 0; h < 24; h++)
      DropdownMenuItem(value: h, child: Text('🕐 $h:00')),
  ];

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: DropdownButtonFormField<int?>(
            initialValue: start,
            decoration: InputDecoration(
              labelText: '🌛 From',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 10,
              ),
            ),
            items: _hourItems(),
            onChanged: onStartChanged,
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Icon(Icons.arrow_forward_rounded, color: Colors.grey.shade400),
        ),
        Expanded(
          child: DropdownButtonFormField<int?>(
            initialValue: end,
            decoration: InputDecoration(
              labelText: '☀️ Until',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 10,
              ),
            ),
            items: _hourItems(),
            onChanged: onEndChanged,
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Theme Mode Picker
// ---------------------------------------------------------------------------

class _ThemeModePicker extends ConsumerWidget {
  const _ThemeModePicker();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeModeAsync = ref.watch(themeModeProvider);
    final current = switch (themeModeAsync) {
      AsyncData(:final value) => value,
      _ => ThemeMode.system,
    };

    return SegmentedButton<ThemeMode>(
      segments: const [
        ButtonSegment(
          value: ThemeMode.light,
          label: Text('☀️ Light'),
          icon: Icon(Icons.light_mode_rounded),
        ),
        ButtonSegment(
          value: ThemeMode.system,
          label: Text('🌗 System'),
          icon: Icon(Icons.brightness_auto_rounded),
        ),
        ButtonSegment(
          value: ThemeMode.dark,
          label: Text('🌙 Dark'),
          icon: Icon(Icons.dark_mode_rounded),
        ),
      ],
      selected: {current},
      onSelectionChanged: (modes) {
        if (modes.isNotEmpty) {
          ref.read(themeModeProvider.notifier).setMode(modes.first);
        }
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Provider Picker
// ---------------------------------------------------------------------------

class _ProviderPicker extends StatelessWidget {
  const _ProviderPicker({required this.value, required this.onChanged});

  final String value;
  final ValueChanged<String?> onChanged;

  static const _providers = [
    (
      value: 'yahoo_finance',
      label: '📈 Yahoo Finance',
      sub: 'Free · No key required',
    ),
    (
      value: 'alpha_vantage',
      label: '🔑 Alpha Vantage',
      sub: 'Free tier · 25 req/day',
    ),
    (value: 'mock', label: '🧪 Mock', sub: 'Offline / testing'),
  ];

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      children: _providers.map((p) {
        final selected = p.value == value;
        return GestureDetector(
          onTap: () => onChanged(p.value),
          child: Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: selected
                  ? cs.primaryContainer.withAlpha(120)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: selected
                    ? cs.primary.withAlpha(100)
                    : Colors.grey.withAlpha(60),
                width: selected ? 1.5 : 1.0,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  selected
                      ? Icons.radio_button_checked_rounded
                      : Icons.radio_button_unchecked_rounded,
                  color: selected ? cs.primary : Colors.grey.shade400,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      p.label,
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: selected ? cs.primary : null,
                      ),
                    ),
                    Text(
                      p.sub,
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}
