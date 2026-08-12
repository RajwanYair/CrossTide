/** Render provenance, freshness, and warnings for a market-data envelope. */
import type { MarketDataEnvelope } from "../types/market-data";

export function renderDataMetadata<T>(envelope: MarketDataEnvelope<T>, now = Date.now()): string {
  const fetchedAt = Date.parse(envelope.provenance.fetchedAt);
  const age = Number.isFinite(fetchedAt) ? formatAge(Math.max(0, now - fetchedAt)) : "unknown age";
  const stale = envelope.status === "stale" || envelope.status === "partial";
  const warningMarkup =
    envelope.warnings.length > 0
      ? `<ul class="data-metadata__warnings">${envelope.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul>`
      : "";

  return `<div class="data-metadata${stale ? " data-metadata--stale" : ""}" aria-label="Data metadata">
    <span class="data-metadata__status">${escapeHtml(envelope.status)}</span>
    <span class="data-metadata__source">Source: ${escapeHtml(envelope.provenance.source)}</span>
    <span class="data-metadata__age">Updated ${age} ago</span>
    ${envelope.provenance.asOf ? `<span class="data-metadata__as-of">Market data as of: ${escapeHtml(envelope.provenance.asOf)}</span>` : ""}
    ${envelope.provenance.timezone ? `<span class="data-metadata__timezone">Timezone: ${escapeHtml(envelope.provenance.timezone)}</span>` : ""}
    ${envelope.provenance.attribution ? `<span class="data-metadata__attribution">${escapeHtml(envelope.provenance.attribution)}</span>` : ""}
    ${envelope.provenance.coverage ? `<span class="data-metadata__coverage">Coverage: ${escapeHtml(envelope.provenance.coverage)}</span>` : ""}
    ${envelope.provenance.marketStatus ? `<span class="data-metadata__market-status">Market: ${escapeHtml(envelope.provenance.marketStatus)}</span>` : ""}
    ${envelope.provenance.adjustmentPolicy ? `<span class="data-metadata__adjustment">Adjustments: ${escapeHtml(envelope.provenance.adjustmentPolicy)}</span>` : ""}
    ${envelope.provenance.limitations?.length ? `<ul class="data-metadata__limitations">${envelope.provenance.limitations.map((limitation) => `<li>${escapeHtml(limitation)}</li>`).join("")}</ul>` : ""}
    ${warningMarkup}
  </div>`;
}

function formatAge(ageMs: number): string {
  const seconds = Math.round(ageMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.round(minutes / 60)}h`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
