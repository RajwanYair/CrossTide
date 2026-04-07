/// Router — go_router configuration with deep-link support.
library;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'screens/alert_history_screen.dart';
import 'screens/audit_log_screen.dart';
import 'screens/crash_log_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/ticker_detail_screen.dart';
import 'screens/ticker_list_screen.dart';
import 'screens/webhooks_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/',
  errorBuilder: (context, state) => _ErrorPage(error: state.error),
  // Normalise crosstide:// deep-links to standard GoRouter paths.
  // e.g. crosstide://ticker/AAPL → /ticker/AAPL
  //      crosstide://settings    → /settings
  redirect: (context, state) {
    final uri = state.uri;
    if (uri.scheme == 'crosstide') {
      final path = uri.path.isNotEmpty ? uri.path : '/';
      // The host acts as the first path segment in the custom scheme.
      final host = uri.host;
      if (host.isNotEmpty) {
        return path.isEmpty || path == '/' ? '/$host' : '/$host$path';
      }
    }
    return null; // No redirect needed for normal paths.
  },
  routes: [
    GoRoute(
      path: '/',
      name: 'tickerList',
      builder: (context, state) => const TickerListScreen(),
    ),
    GoRoute(
      path: '/onboarding',
      name: 'onboarding',
      builder: (context, state) => const OnboardingScreen(),
    ),
    GoRoute(
      path: '/ticker/:symbol',
      name: 'tickerDetail',
      builder: (context, state) {
        final symbol = state.pathParameters['symbol'] ?? '';
        return TickerDetailScreen(symbol: symbol);
      },
    ),
    GoRoute(
      path: '/settings',
      name: 'settings',
      builder: (context, state) => const SettingsScreen(),
    ),
    GoRoute(
      path: '/alert-history',
      name: 'alertHistory',
      builder: (context, state) => const AlertHistoryScreen(),
    ),
    GoRoute(
      path: '/crash-logs',
      name: 'crashLogs',
      builder: (context, state) => const CrashLogScreen(),
    ),
    GoRoute(
      path: '/audit-log',
      name: 'auditLog',
      builder: (context, state) => const AuditLogScreen(),
    ),
    GoRoute(
      path: '/webhooks',
      name: 'webhooks',
      builder: (context, state) => const WebhooksScreen(),
    ),
  ],
);

/// Parse notification payload to extract deep-link route.
///
/// Payload format: `"ticker:AAPL"` → `/ticker/AAPL`
/// Also handles the custom-scheme format `crosstide://ticker/AAPL`.
String? parseNotificationPayload(String? payload) {
  if (payload == null) return null;
  if (payload.startsWith('ticker:')) {
    final symbol = payload.substring(7);
    return '/ticker/$symbol';
  }
  if (payload.startsWith('crosstide://')) {
    final uri = Uri.tryParse(payload);
    if (uri != null && uri.host.isNotEmpty) {
      final path = uri.path.isEmpty ? '/' : uri.path;
      return '/${uri.host}$path';
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Error Page — shown for unknown routes or navigation errors
// ---------------------------------------------------------------------------

class _ErrorPage extends StatelessWidget {
  const _ErrorPage({this.error});

  final Exception? error;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('⚠️ Page Not Found')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.wrong_location_outlined,
                size: 64,
                color: Colors.orange,
              ),
              const SizedBox(height: 16),
              Text(
                'Something went wrong',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                error?.toString() ?? 'The requested page could not be found.',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () => GoRouter.of(context).go('/'),
                icon: const Icon(Icons.home_rounded),
                label: const Text('Go Home'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
