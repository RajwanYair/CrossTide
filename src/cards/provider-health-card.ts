/**
 * Provider Health Card — live circuit-breaker status for data providers.
 *
 * Reads from the provider registry singleton (which holds circuit breakers
 * for Yahoo Finance and Finnhub). Auto-refreshes every 30 seconds.
 */
import { renderProviderHealth } from "./provider-health";
import { getHealthSnapshot } from "../providers/provider-registry";
import type { ProviderHealthSnapshot } from "./provider-health";
import type { CardModule } from "./registry";

function refresh(container: HTMLElement): void {
  const reg = getHealthSnapshot();
  const snapshot: ProviderHealthSnapshot = {
    providers: reg.entries.map((e) => e.health),
    lastRefreshAt: reg.capturedAt,
  };
  renderProviderHealth(container, snapshot);
}

const providerHealthCard: CardModule = {
  mount(container) {
    refresh(container);

    // Auto-refresh every 30 seconds
    const timer = setInterval(() => refresh(container), 30_000);

    return {
      dispose() {
        clearInterval(timer);
      },
    };
  },
};

export default providerHealthCard;
