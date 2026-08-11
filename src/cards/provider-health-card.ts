/**
 * Provider Health Card — live circuit-breaker status for data providers.
 *
 * Reads from the provider registry singleton (which holds circuit breakers
 * for Yahoo Finance and Finnhub). Auto-refreshes every 30 seconds.
 * Fires toast/notification alerts on health state transitions.
 */
import { renderProviderHealth } from "./provider-health";
import { checkHealthTransition } from "./provider-health-monitor";
import { getHealthSnapshot } from "../providers/provider-registry";
import { getAllProviderUsage } from "../core/provider-usage";
import { getAllRateLimits } from "../core/rate-limit-tracker";
import { getFailoverLog } from "../core/failover-log";
import type { ProviderHealthSnapshot } from "./provider-health";
import type { CardModule } from "./registry";

function refresh(container: HTMLElement): void {
  const reg = getHealthSnapshot();
  const snapshot: ProviderHealthSnapshot = {
    providers: reg.entries.map((e) => e.health),
    lastRefreshAt: reg.capturedAt,
    usage: getAllProviderUsage(),
    rateLimits: getAllRateLimits(reg.capturedAt),
    failoverCount: getFailoverLog().length,
  };
  renderProviderHealth(container, snapshot);
  checkHealthTransition(snapshot);
}

const providerHealthCard: CardModule = {
  mount(container) {
    refresh(container);

    // Auto-refresh every 30 seconds
    const timer = setInterval(() => refresh(container), 30_000);

    return {
      dispose(): void {
        clearInterval(timer);
      },
    };
  },
};

export default providerHealthCard;
