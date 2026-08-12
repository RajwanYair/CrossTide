# Offline Guarantees

CrossTide is offline-first for the application shell, but market data freshness is
workflow-specific. The service worker uses the policies below.

| Workflow | Offline behavior | Data state |
| --- | --- | --- |
| Open the app or revisit a loaded route | Precached shell remains available | Cached app shell |
| View a previously loaded quote, chart, or API-backed card | Network-first request falls back to the cached response after the 10-second network timeout | Stale, with the card's provenance/status metadata |
| Load JavaScript, CSS, or worker assets | Cached asset renders immediately while a network refresh runs | Cached, then refreshed |
| Load an image or font | Cache-first response is used when available | Cached |
| Request a never-loaded API resource offline | No cached response exists | Unavailable; the card must show an explicit error or empty state |
| Change local watchlists, settings, or queued mutations | Local state remains usable and mutations can enter the sync queue | Read-only until connectivity returns, then syncable |

The API cache is limited to 50 entries and five minutes. Static assets expire after
seven days, images after 30 days, and queued mutations after 24 hours. Offline
support does not imply fresh market data or guaranteed execution of a remote action.

The source of truth for these policies is `src/core/sw-cache-config.ts` and the
Workbox registrations in `src/sw.ts`.

## Route Guarantees

The registered cards use these workflow-specific guarantees. A cached route can
open offline, but a route's first remote data request remains unavailable until
the network returns.

| Route | Offline guarantee | State |
| --- | --- | --- |
| watchlist | Open cached shell and local watchlist | Read-only |
| consensus | Render cached data when available | Stale or unavailable |
| chart | Render cached candles when available | Stale or unavailable |
| alerts | Open local alert rules and cached history | Read-only or unavailable |
| heatmap | Render cached market data when available | Stale or unavailable |
| screener | Open cached shell; new scans wait for network | Unavailable |
| settings | Open and edit local settings | Read-only remote effects |
| provider-health | Open cached shell; health checks wait for network | Unavailable |
| portfolio | Open local portfolio data | Read-only |
| risk | Render cached portfolio inputs when available | Stale or unavailable |
| backtest | Open cached shell; new runs wait for network | Unavailable |
| strategy-comparison | Open cached shell; new comparisons wait for network | Unavailable |
| consensus-timeline | Render cached data when available | Stale or unavailable |
| signal-dsl | Open cached shell; execution waits for network | Unavailable |
| multi-chart | Render cached charts when available | Stale or unavailable |
| correlation | Render cached data when available | Stale or unavailable |
| market-breadth | Render cached data when available | Stale or unavailable |
| earnings-calendar | Render cached data when available | Stale or unavailable |
| macro-dashboard | Render cached data when available | Stale or unavailable |
| sector-rotation | Render cached data when available | Stale or unavailable |
| relative-strength | Render cached data when available | Stale or unavailable |
| seasonality | Render cached data when available | Stale or unavailable |
| comparison | Render cached data when available | Stale or unavailable |
| rebalance | Open local inputs; remote execution waits for network | Read-only or unavailable |
| news-feed | Render cached news when available | Stale or unavailable |
