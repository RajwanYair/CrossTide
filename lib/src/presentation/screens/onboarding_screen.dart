/// Onboarding Screen — Disclaimer + API key setup.
library;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _apiKeyController = TextEditingController();
  bool _disclaimerAccepted = false;
  bool _apiKeyObscured = true;

  @override
  void dispose() {
    _apiKeyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Full-bleed hero header
          SliverAppBar(
            expandedHeight: 260,
            pinned: true,
            backgroundColor: const Color(0xFF0D47A1),
            flexibleSpace: FlexibleSpaceBar(
              centerTitle: true,
              title: const Text(
                'CrossTide',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1,
                  color: Colors.white,
                ),
              ),
              background: Stack(
                fit: StackFit.expand,
                children: [
                  // Wave gradient background
                  Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Color(0xFF0D47A1),
                          Color(0xFF1565C0),
                          Color(0xFF1976D2),
                        ],
                      ),
                    ),
                  ),
                  // Large logo in center
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 40),
                      child:
                          SvgPicture.asset(
                                'assets/svg/logo.svg',
                                width: 120,
                                height: 120,
                              )
                              .animate(onPlay: (c) => c.repeat(reverse: true))
                              .scaleXY(
                                begin: 0.95,
                                end: 1.0,
                                duration: 2400.ms,
                                curve: Curves.easeInOut,
                              ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Body content
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Tagline
                Text(
                      '📈 Catch the cross. Ride the tide.',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: cs.primary,
                      ),
                      textAlign: TextAlign.center,
                    )
                    .animate()
                    .fadeIn(duration: 400.ms, delay: 200.ms)
                    .slideY(begin: 0.1, end: 0),
                const SizedBox(height: 6),
                Text(
                  'Monitor SMA50 · SMA150 · SMA200 crossovers.\n'
                  'Get instant alerts — no API key needed.',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade600,
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ).animate().fadeIn(duration: 400.ms, delay: 320.ms),
                const SizedBox(height: 28),

                // Feature chips
                const Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      alignment: WrapAlignment.center,
                      children: [
                        _FeatureChip(
                          icon: Icons.notifications_active_rounded,
                          label: 'Smart Alerts',
                        ),
                        _FeatureChip(
                          icon: Icons.show_chart_rounded,
                          label: 'SMA Charts',
                        ),
                        _FeatureChip(
                          icon: Icons.wifi_off_rounded,
                          label: 'No API Key',
                        ),
                        _FeatureChip(
                          icon: Icons.android_rounded,
                          label: 'Android + Windows',
                        ),
                      ],
                    )
                    .animate()
                    .fadeIn(duration: 450.ms, delay: 400.ms)
                    .slideY(begin: 0.08, end: 0),
                const SizedBox(height: 28),

                // Disclaimer Card
                _DisclaimerCard(
                  accepted: _disclaimerAccepted,
                  onChanged: (v) =>
                      setState(() => _disclaimerAccepted = v ?? false),
                ).animate().fadeIn(duration: 400.ms, delay: 500.ms),
                const SizedBox(height: 20),

                // API Key Card (optional)
                _ApiKeyCard(
                  controller: _apiKeyController,
                  obscured: _apiKeyObscured,
                  onToggleObscure: () =>
                      setState(() => _apiKeyObscured = !_apiKeyObscured),
                ).animate().fadeIn(duration: 400.ms, delay: 620.ms),
                const SizedBox(height: 32),

                // CTA button
                AnimatedOpacity(
                  opacity: _disclaimerAccepted ? 1.0 : 0.45,
                  duration: 300.ms,
                  child: SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: FilledButton.icon(
                      onPressed: _disclaimerAccepted ? _onContinue : null,
                      icon: const Icon(Icons.rocket_launch_rounded),
                      label: const Text(
                        '🚀 Start Watching',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      style: FilledButton.styleFrom(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                    ),
                  ),
                ).animate(delay: 700.ms).fadeIn().slideY(begin: 0.1, end: 0),

                if (!_disclaimerAccepted)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      '☝️ Please accept the disclaimer above to continue',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _onContinue() async {
    const storage = FlutterSecureStorage();
    final apiKey = _apiKeyController.text.trim();
    if (apiKey.isNotEmpty) {
      await storage.write(key: 'market_data_api_key', value: apiKey);
    }
    await storage.write(key: 'onboarding_complete', value: 'true');
    if (mounted) context.go('/');
  }
}

// ---------------------------------------------------------------------------
// Feature Chip
// ---------------------------------------------------------------------------

class _FeatureChip extends StatelessWidget {
  const _FeatureChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: cs.primaryContainer.withAlpha(120),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: cs.primary.withAlpha(60)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: cs.primary),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: cs.primary,
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Disclaimer Card
// ---------------------------------------------------------------------------

class _DisclaimerCard extends StatelessWidget {
  const _DisclaimerCard({required this.accepted, required this.onChanged});

  final bool accepted;
  final ValueChanged<bool?> onChanged;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.amber.shade50,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.amber.shade300, width: 1.5),
      ),
      elevation: 0,
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
                    color: Colors.amber.shade200,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.gavel_rounded,
                    color: Colors.orange,
                    size: 18,
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  '⚖️ Disclaimer',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: Colors.orange.shade800,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            const Text(
              'CrossTide is for informational and educational purposes only. '
              'It is NOT financial advice. Stock prices are volatile and past '
              'performance does not guarantee future results. Always do your '
              'own research and consult a financial advisor before making '
              'investment decisions.',
              style: TextStyle(fontSize: 13, height: 1.5),
            ),
            const SizedBox(height: 10),
            InkWell(
              borderRadius: BorderRadius.circular(8),
              onTap: () => onChanged(!accepted),
              child: Row(
                children: [
                  Checkbox(
                    value: accepted,
                    onChanged: onChanged,
                    activeColor: Colors.orange.shade700,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const Text(
                    '✅ I understand and accept the disclaimer',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// API Key Card
// ---------------------------------------------------------------------------

class _ApiKeyCard extends StatelessWidget {
  const _ApiKeyCard({
    required this.controller,
    required this.obscured,
    required this.onToggleObscure,
  });

  final TextEditingController controller;
  final bool obscured;
  final VoidCallback onToggleObscure;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: cs.outlineVariant),
      ),
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
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.vpn_key_rounded,
                    color: cs.primary,
                    size: 18,
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  '🔑 Market Data API Key',
                  style: Theme.of(
                    context,
                  ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.green.withAlpha(30),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    '✓ Optional',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.green,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            const Text(
              'Yahoo Finance works without any key. '
              'For Alpha Vantage, enter your free key below.',
              style: TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              obscureText: obscured,
              decoration: InputDecoration(
                labelText: 'Alpha Vantage API Key',
                hintText: 'Leave blank for Yahoo Finance (free)',
                prefixIcon: const Icon(Icons.key_rounded),
                suffixIcon: IconButton(
                  icon: Icon(
                    obscured
                        ? Icons.visibility_rounded
                        : Icons.visibility_off_rounded,
                  ),
                  onPressed: onToggleObscure,
                  tooltip: obscured ? 'Show key' : 'Hide key',
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
