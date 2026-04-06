# 🌊 CrossTide — Stock SMA Crossover Monitor

> **Catch the cross. Ride the tide.**

<p align="center">
  <img src="docs/signal_chart.svg" alt="SMA200 Cross-Up Signal" width="640"/>
</p>

CrossTide is a cross-platform Flutter app that monitors stock tickers for **SMA crossover events** (SMA50 / SMA150 / SMA200, Golden Cross) and fires instant local notifications. Runs on **Android** and **Windows** from a single Dart codebase. Uses **Yahoo Finance** — no API key required.

<p align="center">
  <a href="https://flutter.dev"><img src="https://img.shields.io/badge/Flutter-3.x-blue?logo=flutter&style=for-the-badge" alt="Flutter"/></a>
  <a href="https://dart.dev"><img src="https://img.shields.io/badge/Dart-3.11-blue?logo=dart&style=for-the-badge" alt="Dart"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License"/></a>
  <a href="https://github.com/RajwanYair/Stock200Alert/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/RajwanYair/Stock200Alert/ci.yml?label=CI&style=for-the-badge&logo=github-actions" alt="CI"/></a>
  <a href="https://github.com/RajwanYair/Stock200Alert/releases/latest"><img src="https://img.shields.io/github/v/release/RajwanYair/Stock200Alert?style=for-the-badge&logo=github" alt="Latest Release"/></a>
</p>

> ⚠️ **Disclaimer**: CrossTide is for informational and educational purposes only. It is NOT financial advice. Always do your own research before making investment decisions.

## 🏗️ Architecture

<p align="center">
  <img src="docs/architecture.svg" alt="Clean Architecture Layers" width="720"/>
</p>

Dependencies flow **inward only** — Presentation → Application → Domain ← Data.

## 📊 Key Signal Logic

```
close[t]    = latest trading day close
sma200[t]   = SMA of last 200 trading closes (inclusive)
sma150[t]   = SMA of last 150 trading closes
sma50[t]    = SMA of last  50 trading closes

🟢 SMA200 Cross-Up:  close[t-1] ≤ sma200[t-1]  AND  close[t] > sma200[t]
✨ Golden Cross:     sma50[t-1]  ≤ sma200[t-1]  AND  sma50[t] > sma200[t]
📈 Rising filter:   close[t] > close[t-1]  (configurable 1–5 day strictness)
🔔 Alert:           idempotent — fires once per cross event, resets on cross-down
```

## Prerequisites

- **Flutter SDK** ≥ 3.16.0 (stable channel)
- **Android**: Android Studio or Android SDK with API 21+
- **Windows**: Visual Studio 2022 with "Desktop development with C++" workload
- **Git**
- **No API key needed** — Yahoo Finance data is free

## Setup

```bash
# 1. Clone the repo
git clone https://github.com/RajwanYair/Stock200Alert.git && cd Stock200Alert

# 2. Copy environment file
cp .env.example .env
# Edit .env with your Alpha Vantage API key (or leave blank for mock data)

# 3. Install dependencies
flutter pub get

# 4. Generate code (Drift database, Freezed models)
dart run build_runner build --delete-conflicting-outputs

# 5. Run on Windows
flutter run -d windows

# 6. Run on Android emulator
flutter run -d emulator

# 7. Run tests
flutter test
```

## Market Data Provider

**Yahoo Finance** (default — free, no API key):
- Uses the public `query1.finance.yahoo.com/v8/finance/chart/` endpoint
- Returns 2+ years of daily OHLCV data (~500 candles)
- No registration or rate-limit tokens required

**Alpha Vantage** (optional, select in Settings):
- Free tier: 25 requests/day, 5/minute
- Get API key: https://www.alphavantage.co/support/#api-key

**Mock Provider**: Generates deterministic synthetic data for offline dev and tests.

The provider interface (`IMarketDataProvider`) is fully abstracted — add any source by implementing the interface.

## Project Structure

```
lib/
├── main.dart                          # Entry point + bootstrap
└── src/
    ├── domain/                        # Pure business logic
    │   ├── entities.dart              # Value objects
    │   ├── sma_calculator.dart        # SMA computation
    │   ├── cross_up_detector.dart     # Cross-up detection
    │   └── alert_state_machine.dart   # Alert lifecycle FSM
    ├── data/                          # Data access layer
    │   ├── database/database.dart     # Drift schema + queries
    │   ├── providers/                 # Market data providers
    │   │   ├── market_data_provider.dart  # Interface
    │   │   ├── alpha_vantage_provider.dart
    │   │   └── mock_provider.dart
    │   └── repository.dart            # Cache + orchestration
    ├── application/                   # Services
    │   ├── refresh_service.dart       # Fetch → compute → alert
    │   ├── notification_service.dart  # Local notifications
    │   └── background_service.dart    # WorkManager + Timer
    └── presentation/                  # UI layer
        ├── providers.dart             # Riverpod providers
        ├── router.dart                # GoRouter config
        └── screens/
            ├── onboarding_screen.dart
            ├── ticker_list_screen.dart
            ├── ticker_detail_screen.dart
            └── settings_screen.dart

test/
└── domain/
    ├── sma_calculator_test.dart
    ├── cross_up_detector_test.dart
    └── alert_state_machine_test.dart
```

## ⚙️ Background Execution

| 📱 Platform | ⚡ Mechanism | ⚠️ Limitations |
|------------|------------|--------------|
| 🤖 Android | `workmanager` periodic task | Min 15-min interval; OS may defer; requires network + battery not low |
| 🖥️ Windows | `Timer.periodic` in-app | Only works while app is running (foreground or tray mode) |

**Windows tray mode**: When enabled, the app minimizes to the system tray instead of closing, continuing periodic refresh via `Timer.periodic`.

**Future enhancement** (not implemented): A separate Windows helper process or Windows Task Scheduler entry could enable true background execution when the app is closed.

## Notifications

Uses `flutter_local_notifications`:
- **Android**: Notification channel with high importance; requests POST_NOTIFICATIONS permission on Android 13+
- **Windows**: Toast notifications; `cancel()` and `getActiveNotifications()` require MSIX package identity (handled gracefully)
- **Deep-link**: Tapping a notification navigates to the ticker detail screen

## 🗺️ Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full enhancement plan. Highlights:

| 🏷️ Version | 🚀 Feature |
|-----------|-----------|
| v1.1 | 📉 SMA50 / SMA150 overlay lines, S&P 500 benchmark, Golden Cross alert, candlestick mode |
| v1.2 | 📋 Watchlist groups, heatmap dashboard, bulk add, ticker autocomplete |
| v1.3 | 🔢 RSI, MACD, Bollinger Bands, EMA indicators |
| v1.4 | 🔔 Price target & volume spike alerts, Telegram/Discord webhooks, alert history export |
| v1.5 | ⚡ Intraday data, delta-fetch, pre/after-hours prices |
| v1.6 | 🏠 Home screen widget (Android), MSIX packaging, iOS / macOS / Web targets |
| v1.8 | 🤖 AI pattern recognition, sentiment analysis, natural language ticker search |

---

## 🧩 Design Decisions

| 🏷️ Decision | ✅ Choice | 💡 Rationale |
|-----------|--------|-----------|
| State management | Riverpod | Compile-safe, no BuildContext for providers, excellent testability, auto-dispose |
| Persistence | Drift (SQLite) | Type-safe queries, migration support, in-memory databases for testing |
| Notifications | flutter_local_notifications | Single plugin for Windows toasts + Android channels |
| Background (Android) | workmanager | Mature plugin for periodic tasks with OS constraints |

## 📄 License

MIT — see [LICENSE](LICENSE).
