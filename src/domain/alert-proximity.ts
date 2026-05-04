/**
 * Price alert proximity check — determine how close current prices
 * are to configured alert levels for watchlist overview display.
 */

export interface AlertProximity {
  readonly ticker: string;
  readonly alertPrice: number;
  readonly currentPrice: number;
  readonly distancePercent: number;
  readonly direction: "above" | "below" | "at";
}

/**
 * Calculate distance from current price to an alert level.
 * Returns percentage distance (positive = price above alert, negative = below).
 */
export function calculateProximity(currentPrice: number, alertPrice: number): number {
  if (alertPrice === 0) return 0;
  return ((currentPrice - alertPrice) / alertPrice) * 100;
}

/**
 * Check proximity for a single ticker against a single alert.
 */
export function checkAlertProximity(
  ticker: string,
  currentPrice: number,
  alertPrice: number,
): AlertProximity {
  const distancePercent = calculateProximity(currentPrice, alertPrice);
  const direction =
    Math.abs(distancePercent) < 0.01 ? "at" : distancePercent > 0 ? "above" : "below";

  return {
    ticker: ticker.toUpperCase(),
    alertPrice,
    currentPrice,
    distancePercent,
    direction,
  };
}

/**
 * Check proximity for multiple alerts, return sorted by closest first.
 */
export function checkMultipleAlerts(
  alerts: readonly { ticker: string; price: number }[],
  currentPrices: ReadonlyMap<string, number>,
): AlertProximity[] {
  const results: AlertProximity[] = [];

  for (const alert of alerts) {
    const current = currentPrices.get(alert.ticker.toUpperCase());
    if (current === undefined) continue;
    results.push(checkAlertProximity(alert.ticker, current, alert.price));
  }

  return results.sort((a, b) => Math.abs(a.distancePercent) - Math.abs(b.distancePercent));
}

/**
 * Filter alerts that are within a given proximity threshold.
 */
export function getAlertsWithinThreshold(
  alerts: readonly AlertProximity[],
  thresholdPercent: number,
): AlertProximity[] {
  return alerts.filter((a) => Math.abs(a.distancePercent) <= thresholdPercent);
}

/**
 * Format proximity as a display string.
 */
export function formatProximity(proximity: AlertProximity): string {
  const dist = Math.abs(proximity.distancePercent).toFixed(2);
  if (proximity.direction === "at")
    return `${proximity.ticker}: AT alert ($${proximity.alertPrice})`;
  const arrow = proximity.direction === "above" ? "↑" : "↓";
  return `${proximity.ticker}: ${dist}% ${arrow} from $${proximity.alertPrice}`;
}
