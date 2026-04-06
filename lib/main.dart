// CrossTide — Cross-platform SMA crossover monitor.
//
// Architecture: Clean Architecture with Riverpod for DI/state management.
//   /domain   — Pure business logic (SMA calc, cross-up detection, alert FSM)
//   /data     — Providers, persistence (Drift/SQLite), repository
//   /application — Services (refresh, notifications, background)
//   /presentation — UI (screens, router, Riverpod providers)
//
// Targets: Android (WorkManager background) + Windows (timer + tray mode).
import 'dart:async' show runZonedGuarded, unawaited;
import 'dart:io' show Platform, exit;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:logger/logger.dart';

import 'src/application/application.dart';
import 'src/presentation/presentation.dart';

/// Global crash log service — initialized once at startup, survives all zones.
final _crashLog = CrashLogService.instance;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize crash logger FIRST — before anything else can fail.
  await _crashLog.initialize();

  final logger = Logger();

  // ---- Global error handlers --------------------------------------------
  // 1) Flutter framework errors (layout, rendering, gestures)
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(
      details,
    ); // still show the default red screen in debug
    _crashLog.writeFlutterError(details);
    logger.e(
      'FlutterError: ${details.exceptionAsString()}',
      error: details.exception,
      stackTrace: details.stack,
    );
  };

  // 2) Platform-level errors that escape Dart zones (e.g. native callbacks)
  PlatformDispatcher.instance.onError = (error, stack) {
    unawaited(
      _crashLog.write(
        error: error,
        stackTrace: stack,
        context: 'PlatformDispatcher.onError',
      ),
    );
    logger.e('PlatformDispatcher error', error: error, stackTrace: stack);
    return true; // true = error handled, don't terminate
  };

  // 3) Wrap the entire app in a guarded zone to catch async errors
  await runZonedGuarded(
    () async {
      await _appMain(logger);
    },
    (error, stackTrace) {
      unawaited(
        _crashLog.write(
          error: error,
          stackTrace: stackTrace,
          context: 'runZonedGuarded (uncaught async)',
        ),
      );
      logger.e('Uncaught async error', error: error, stackTrace: stackTrace);
    },
  );
}

/// The actual application startup — separated so the guarded zone wraps it.
Future<void> _appMain(Logger logger) async {
  // ---- Headless mode (Windows Task Scheduler) ---------------------------
  if (Platform.isWindows && _isHeadlessRefresh()) {
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
        // Will be wired to window focus in CrossTideApp
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
      child: CrossTideApp(showOnboarding: showOnboarding),
    ),
  );
}

class CrossTideApp extends StatelessWidget {
  const CrossTideApp({super.key, this.showOnboarding = false});

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
  final args = <String>[...Platform.executableArguments];
  return args.contains('--background-refresh');
}

/// Run a single refresh cycle without showing any UI and then exit.
Future<void> _runHeadlessRefresh(Logger logger) async {
  logger.i('Headless background-refresh started');
  ProviderContainer? container;
  try {
    await dotenv.load().catchError((_) {});

    container = ProviderContainer();
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
  } catch (e, st) {
    logger.e('Headless refresh failed', error: e, stackTrace: st);
    await _crashLog.write(
      error: e,
      stackTrace: st,
      context: 'Headless background-refresh',
    );
  } finally {
    container?.dispose();
  }
  exit(0);
}
