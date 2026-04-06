// CrossTide — Cross-platform SMA crossover monitor.
//
// Architecture: Clean Architecture with Riverpod for DI/state management.
//   /domain   — Pure business logic (SMA calc, cross-up detection, alert FSM)
//   /data     — Providers, persistence (Drift/SQLite), repository
//   /application — Services (refresh, notifications, background)
//   /presentation — UI (screens, router, Riverpod providers)
//
// Targets: Android (WorkManager background) + Windows (timer + tray mode).
import 'dart:io' show Platform, exit;

import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:logger/logger.dart';

import 'src/application/application.dart';
import 'src/presentation/presentation.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final logger = Logger();

  // ---- Headless mode (Windows Task Scheduler) ---------------------------
  // When schtasks.exe launches the app with --background-refresh, run a
  // single refresh cycle and exit — no UI, no tray, no event loop.
  if (Platform.isWindows &&
      const bool.fromEnvironment('dart.vm.product', defaultValue: false) ==
          false &&
      _isHeadlessRefresh()) {
    await _runHeadlessRefresh(logger);
    return;
  }

  // Load .env (non-fatal if missing; keys come from secure storage at runtime)
  try {
    await dotenv.load();
  } catch (e) {
    logger.w('.env file not found — using secure storage for keys');
  }

  // Create the Riverpod container
  final container = ProviderContainer();

  // Initialize notification service with deep-link handler
  final notificationService = container.read(notificationServiceProvider);
  await notificationService.initialize(
    onTap: (payload) {
      final route = parseNotificationPayload(payload);
      if (route != null) {
        appRouter.go(route);
      }
    },
  );

  // Initialize background service
  final bgService = container.read(backgroundServiceProvider);
  try {
    final repo = await container.read(repositoryProvider.future);
    final settings = await repo.getSettings();
    await bgService.initialize(
      refreshIntervalMinutes: settings.refreshIntervalMinutes,
    );

    // On Windows, start the in-app refresh timer
    if (Platform.isWindows) {
      final refreshService = await container.read(
        refreshServiceProvider.future,
      );
      bgService.startWindowsRefreshLoop(
        refreshService: refreshService,
        intervalMinutes: settings.refreshIntervalMinutes,
      );

      // Register Windows Task Scheduler for true background refresh
      final taskScheduler = container.read(windowsTaskSchedulerProvider);
      await taskScheduler.register(
        intervalMinutes: settings.refreshIntervalMinutes,
      );
    }
  } catch (e, st) {
    logger.e(
      'Failed to initialize background service',
      error: e,
      stackTrace: st,
    );
  }

  // ---- Windows system tray -------------------------------------------
  SystemTrayService? trayService;
  if (Platform.isWindows) {
    trayService = SystemTrayService(
      logger: logger,
      onShow: () {
        // Will be wired to window focus in StockAlertApp
      },
      onRefreshNow: () async {
        try {
          final svc = await container.read(refreshServiceProvider.future);
          await svc.refreshAll();
        } catch (e) {
          logger.e('Tray refresh failed: $e');
        }
      },
      onQuit: () async {
        await trayService?.dispose();
        exit(0);
      },
    );
    await trayService.initialize();
  }

  // Check onboarding status
  bool showOnboarding;
  try {
    showOnboarding = !(await container.read(onboardingCompleteProvider.future));
  } catch (_) {
    showOnboarding = true;
  }

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: StockAlertApp(showOnboarding: showOnboarding),
    ),
  );
}

class StockAlertApp extends StatelessWidget {
  const StockAlertApp({super.key, this.showOnboarding = false});

  final bool showOnboarding;

  @override
  Widget build(BuildContext context) {
    // Override initial location if onboarding needed
    final router = showOnboarding
        ? GoRouter(
            initialLocation: '/onboarding',
            routes: appRouter.configuration.routes,
          )
        : appRouter;

    // Rich typography: Outfit for headlines, Inter for body/numbers
    final baseTextTheme = GoogleFonts.outfitTextTheme();
    final numbersTheme = GoogleFonts.interTextTheme();
    final richTextTheme = baseTextTheme.copyWith(
      bodyMedium: numbersTheme.bodyMedium,
      bodySmall: numbersTheme.bodySmall,
      titleLarge: baseTextTheme.titleLarge?.copyWith(
        fontWeight: FontWeight.w700,
      ),
      headlineMedium: baseTextTheme.headlineMedium?.copyWith(
        fontWeight: FontWeight.w800,
      ),
    );

    return MaterialApp.router(
      title: 'CrossTide',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF0D47A1),
        useMaterial3: true,
        brightness: Brightness.light,
        textTheme: richTextTheme.apply(
          bodyColor: const Color(0xFF1A237E),
          displayColor: const Color(0xFF0D47A1),
        ),
        cardTheme: const CardThemeData(
          elevation: 2,
          margin: EdgeInsets.symmetric(vertical: 6, horizontal: 0),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(16)),
          ),
        ),
        appBarTheme: AppBarTheme(
          centerTitle: false,
          titleTextStyle: GoogleFonts.outfit(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
          backgroundColor: const Color(0xFF0D47A1),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        floatingActionButtonTheme: const FloatingActionButtonThemeData(
          backgroundColor: Color(0xFF1565C0),
          foregroundColor: Colors.white,
          elevation: 4,
        ),
        chipTheme: const ChipThemeData(
          shape: StadiumBorder(),
          padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        ),
      ),
      darkTheme: ThemeData(
        colorSchemeSeed: const Color(0xFF1E88E5),
        useMaterial3: true,
        brightness: Brightness.dark,
        textTheme: richTextTheme,
        cardTheme: CardThemeData(
          elevation: 3,
          margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 0),
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(16)),
          ),
          color: Colors.grey.shade900,
        ),
        appBarTheme: AppBarTheme(
          centerTitle: false,
          titleTextStyle: GoogleFonts.outfit(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
          elevation: 0,
        ),
        floatingActionButtonTheme: const FloatingActionButtonThemeData(
          backgroundColor: Color(0xFF1E88E5),
          foregroundColor: Colors.white,
        ),
        chipTheme: const ChipThemeData(
          shape: StadiumBorder(),
          padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        ),
      ),
      routerConfig: router,
    );
  }
}

// ---------------------------------------------------------------------------
// Headless background-refresh mode (Windows Task Scheduler)
// ---------------------------------------------------------------------------

/// Check if the app was launched with `--background-refresh` by the Windows
/// Task Scheduler. Inspects platform-dispatched command-line arguments.
bool _isHeadlessRefresh() {
  // Command-line args are passed via DartProject::set_dart_entrypoint_arguments
  // in the Windows runner (main.cpp). In release mode they arrive as
  // Platform.executableArguments; in debug mode via environment.
  final args = <String>[
    ...Platform.executableArguments,
    // The runner passes them as dart entrypoint args
  ];
  return args.contains('--background-refresh');
}

/// Run a single refresh cycle without showing any UI and then exit.
Future<void> _runHeadlessRefresh(Logger logger) async {
  logger.i('Headless background-refresh started');
  try {
    await dotenv.load().catchError((_) {});

    final container = ProviderContainer();
    final repo = await container.read(repositoryProvider.future);
    final notificationService = container.read(notificationServiceProvider);
    await notificationService.initialize();

    final refreshService = RefreshService(
      repository: repo,
      notificationService: notificationService,
      logger: logger,
    );

    final results = await refreshService.refreshAll();
    logger.i('Headless refresh complete: $results');
    container.dispose();
  } catch (e, st) {
    logger.e('Headless refresh failed', error: e, stackTrace: st);
  }
  exit(0);
}
