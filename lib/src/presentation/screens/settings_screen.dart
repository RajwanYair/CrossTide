/// Settings Screen — Refresh interval, quiet hours, trend strictness, API key.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

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

  @override
  void dispose() {
    _apiKeyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final settingsAsync = ref.watch(settingsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: settingsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (settings) {
          if (!_loaded) {
            _settings = settings;
            _loaded = true;
          }

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Refresh interval
              Text(
                'Refresh Interval',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 4),
              Text(
                ref.read(isAndroidProvider)
                    ? 'Android WorkManager minimum: 15 minutes'
                    : 'Windows: timer-based while app is running',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              Slider(
                value: _settings.refreshIntervalMinutes.toDouble(),
                min: 15,
                max: 360,
                divisions: 23,
                label: '${_settings.refreshIntervalMinutes} min',
                onChanged: (v) => setState(() {
                  _settings = _settings.copyWith(
                    refreshIntervalMinutes: v.round(),
                  );
                }),
              ),
              Text('${_settings.refreshIntervalMinutes} minutes'),
              const Divider(height: 32),

              // Quiet hours
              Text(
                'Quiet Hours',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 4),
              const Text('Suppress notifications during this time window.'),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<int?>(
                      initialValue: _settings.quietHoursStart,
                      decoration: const InputDecoration(
                        labelText: 'Start hour',
                      ),
                      items: [
                        const DropdownMenuItem(
                          value: null,
                          child: Text('Disabled'),
                        ),
                        for (var h = 0; h < 24; h++)
                          DropdownMenuItem(value: h, child: Text('$h:00')),
                      ],
                      onChanged: (v) => setState(() {
                        _settings = _settings.copyWith(quietHoursStart: v ?? 0);
                      }),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: DropdownButtonFormField<int?>(
                      initialValue: _settings.quietHoursEnd,
                      decoration: const InputDecoration(labelText: 'End hour'),
                      items: [
                        const DropdownMenuItem(
                          value: null,
                          child: Text('Disabled'),
                        ),
                        for (var h = 0; h < 24; h++)
                          DropdownMenuItem(value: h, child: Text('$h:00')),
                      ],
                      onChanged: (v) => setState(() {
                        _settings = _settings.copyWith(quietHoursEnd: v ?? 0);
                      }),
                    ),
                  ),
                ],
              ),
              const Divider(height: 32),

              // Trend strictness
              Text(
                'Trend Strictness',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 4),
              const Text(
                'Number of consecutive rising days required for a cross-up alert. '
                '1 = close[t] > close[t-1]. '
                '2 = close[t] > close[t-1] > close[t-2].',
              ),
              Slider(
                value: _settings.trendStrictnessDays.toDouble(),
                min: 1,
                max: 5,
                divisions: 4,
                label: '${_settings.trendStrictnessDays} day(s)',
                onChanged: (v) => setState(() {
                  _settings = _settings.copyWith(
                    trendStrictnessDays: v.round(),
                  );
                }),
              ),
              Text('${_settings.trendStrictnessDays} day(s)'),
              const Divider(height: 32),

              // Cache TTL
              Text('Cache TTL', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 4),
              const Text(
                'Skip re-fetching if data was refreshed within this window.',
              ),
              Slider(
                value: _settings.cacheTtlMinutes.toDouble(),
                min: 5,
                max: 120,
                divisions: 23,
                label: '${_settings.cacheTtlMinutes} min',
                onChanged: (v) => setState(() {
                  _settings = _settings.copyWith(cacheTtlMinutes: v.round());
                }),
              ),
              Text('${_settings.cacheTtlMinutes} minutes'),
              const Divider(height: 32),

              // Data provider
              Text(
                'Data Provider',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                initialValue: _settings.providerName,
                decoration: const InputDecoration(border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(
                    value: 'yahoo_finance',
                    child: Text('Yahoo Finance (free, no key)'),
                  ),
                  DropdownMenuItem(
                    value: 'alpha_vantage',
                    child: Text('Alpha Vantage (requires API key)'),
                  ),
                  DropdownMenuItem(
                    value: 'mock',
                    child: Text('Mock (offline / testing)'),
                  ),
                ],
                onChanged: (v) => setState(() {
                  _settings = _settings.copyWith(
                    providerName: v ?? 'yahoo_finance',
                  );
                }),
              ),
              const SizedBox(height: 16),

              // API Key (only shown for Alpha Vantage)
              if (_settings.providerName == 'alpha_vantage') ...[
                Text('API Key', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                TextField(
                  controller: _apiKeyController,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    labelText: 'Alpha Vantage API Key',
                    hintText: 'Leave blank to keep current',
                  ),
                  obscureText: true,
                ),
              ],
              const SizedBox(height: 24),

              // Save button
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _onSave,
                  child: const Text('Save Settings'),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _onSave() async {
    final repo = await ref.read(repositoryProvider.future);
    await repo.saveSettings(_settings);

    final apiKey = _apiKeyController.text.trim();
    if (apiKey.isNotEmpty) {
      const storage = FlutterSecureStorage();
      await storage.write(key: 'market_data_api_key', value: apiKey);
    }

    // Update background service interval
    final bgService = ref.read(backgroundServiceProvider);
    await bgService.updateInterval(_settings.refreshIntervalMinutes);

    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Settings saved')));
    }
  }
}
