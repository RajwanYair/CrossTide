/// Webhooks Management Screen — configure and test Telegram / Discord alerting.
library;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers.dart';

/// Dedicated screen for managing webhook alert destinations.
///
/// Supports Telegram (bot URL + chat ID) and Discord (webhook URL).
/// Credentials are stored in [FlutterSecureStorage]; the service is
/// invalidated after every save so changes take effect immediately.
class WebhooksScreen extends ConsumerStatefulWidget {
  const WebhooksScreen({super.key});

  @override
  ConsumerState<WebhooksScreen> createState() => _WebhooksScreenState();
}

class _WebhooksScreenState extends ConsumerState<WebhooksScreen> {
  final _tgUrlCtrl = TextEditingController();
  final _tgChatCtrl = TextEditingController();
  final _dcUrlCtrl = TextEditingController();

  bool _loaded = false;
  bool _saving = false;
  bool _testing = false;
  String? _testResult;

  @override
  void dispose() {
    _tgUrlCtrl.dispose();
    _tgChatCtrl.dispose();
    _dcUrlCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final storage = ref.read(secureStorageProvider);
    _tgUrlCtrl.text = await storage.read(key: WebhookKeys.telegramBotUrl) ?? '';
    _tgChatCtrl.text =
        await storage.read(key: WebhookKeys.telegramChatId) ?? '';
    _dcUrlCtrl.text = await storage.read(key: WebhookKeys.discordUrl) ?? '';
    if (mounted) setState(() => _loaded = true);
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final storage = ref.read(secureStorageProvider);
      await storage.write(
        key: WebhookKeys.telegramBotUrl,
        value: _tgUrlCtrl.text.trim(),
      );
      await storage.write(
        key: WebhookKeys.telegramChatId,
        value: _tgChatCtrl.text.trim(),
      );
      await storage.write(
        key: WebhookKeys.discordUrl,
        value: _dcUrlCtrl.text.trim(),
      );
      ref.invalidate(webhookServiceProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Webhook credentials saved.'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _sendTest() async {
    setState(() {
      _testing = true;
      _testResult = null;
    });
    try {
      final svc = await ref.read(webhookServiceProvider.future);
      await svc.send('🧪 *CrossTide test* — webhooks are working!');
      if (mounted) setState(() => _testResult = '✅ Test sent successfully.');
    } catch (e) {
      if (mounted) setState(() => _testResult = '❌ Test failed: $e');
    } finally {
      if (mounted) setState(() => _testing = false);
    }
  }

  bool get _hasConfig {
    final hasTelegram =
        _tgUrlCtrl.text.trim().isNotEmpty && _tgChatCtrl.text.trim().isNotEmpty;
    final hasDiscord = _dcUrlCtrl.text.trim().isNotEmpty;
    return hasTelegram || hasDiscord;
  }

  @override
  Widget build(BuildContext context) {
    if (!_loaded) {
      _load();
    }

    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Webhook Notifications'),
        actions: [
          IconButton(
            icon: const Icon(Icons.save_outlined),
            tooltip: 'Save',
            onPressed: _saving ? null : _save,
          ),
        ],
      ),
      body: !_loaded
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _InfoBanner(cs: cs).animate().fadeIn(duration: 300.ms),
                  const SizedBox(height: 20),
                  _DestinationCard(
                    icon: Icons.send_rounded,
                    title: 'Telegram',
                    color: const Color(0xFF0088cc),
                    child: Column(
                      children: [
                        TextField(
                          controller: _tgUrlCtrl,
                          decoration: const InputDecoration(
                            labelText: 'Bot URL',
                            hintText:
                                'https://api.telegram.org/bot<TOKEN>/sendMessage',
                            prefixIcon: Icon(Icons.link_rounded, size: 18),
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                          keyboardType: TextInputType.url,
                          autocorrect: false,
                          onChanged: (_) => setState(() {}),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _tgChatCtrl,
                          decoration: const InputDecoration(
                            labelText: 'Chat ID',
                            hintText: '-100123456789',
                            prefixIcon: Icon(Icons.tag_rounded, size: 18),
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                          keyboardType: TextInputType.number,
                          autocorrect: false,
                          onChanged: (_) => setState(() {}),
                        ),
                      ],
                    ),
                  ).animate(delay: 80.ms).fadeIn(duration: 300.ms),
                  const SizedBox(height: 16),
                  _DestinationCard(
                    icon: Icons.discord,
                    title: 'Discord',
                    color: const Color(0xFF5865F2),
                    child: TextField(
                      controller: _dcUrlCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Webhook URL',
                        hintText: 'https://discord.com/api/webhooks/...',
                        prefixIcon: Icon(Icons.link_rounded, size: 18),
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      keyboardType: TextInputType.url,
                      autocorrect: false,
                      onChanged: (_) => setState(() {}),
                    ),
                  ).animate(delay: 160.ms).fadeIn(duration: 300.ms),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: _saving ? null : _save,
                          icon: _saving
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Icon(Icons.save_outlined),
                          label: const Text('Save Credentials'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      OutlinedButton.icon(
                        onPressed: (_testing || !_hasConfig) ? null : _sendTest,
                        icon: _testing
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Icon(Icons.send_outlined, size: 18),
                        label: const Text('Send Test'),
                      ),
                    ],
                  ).animate(delay: 240.ms).fadeIn(duration: 300.ms),
                  if (_testResult != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _testResult!.startsWith('✅')
                            ? Colors.green.withAlpha(20)
                            : Colors.red.withAlpha(20),
                        border: Border.all(
                          color: _testResult!.startsWith('✅')
                              ? Colors.green
                              : Colors.red,
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        _testResult!,
                        style: TextStyle(
                          fontSize: 13,
                          color: _testResult!.startsWith('✅')
                              ? Colors.green.shade700
                              : Colors.red.shade700,
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }
}

// ---------------------------------------------------------------------------
// Helper widgets
// ---------------------------------------------------------------------------

class _InfoBanner extends StatelessWidget {
  const _InfoBanner({required this.cs});

  final ColorScheme cs;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cs.primaryContainer.withAlpha(80),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.primary.withAlpha(60)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline_rounded, size: 18, color: cs.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Webhooks push alert notifications to Telegram or Discord '
              'whenever a crossover event fires. Credentials are stored in '
              'secure storage — never in plain text.',
              style: TextStyle(fontSize: 12, color: cs.onSurface),
            ),
          ),
        ],
      ),
    );
  }
}

class _DestinationCard extends StatelessWidget {
  const _DestinationCard({
    required this.icon,
    required this.title,
    required this.color,
    required this.child,
  });

  final IconData icon;
  final String title;
  final Color color;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 20, color: color),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: color,
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
