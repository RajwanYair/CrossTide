/**
 * Analytics opt-out preference (roadmap G05/S04) — user-facing kill switch
 * layered on top of the build-time `VITE_PLAUSIBLE_URL`/`VITE_GLITCHTIP_DSN`
 * gate in `src/core/telemetry.ts`.
 *
 * Telemetry sinks are already absent from the bundle unless an operator sets
 * those env vars at build time (see `docs/DATA_RETENTION.md`). This module
 * lets a visitor of a deployment that *does* enable them opt out at runtime,
 * persisted in localStorage so the choice survives reloads.
 */
import { getTelemetry } from "./telemetry";

const TELEMETRY_OPT_OUT_STORAGE = "crosstide:telemetry-opt-out";

/** Read the stored opt-out preference. Defaults to opted-in (not opted out). */
export function isTelemetryOptedOut(): boolean {
  try {
    return localStorage.getItem(TELEMETRY_OPT_OUT_STORAGE) === "1";
  } catch {
    return false;
  }
}

/** Persist the preference and apply it to the active telemetry handle immediately. */
export function setTelemetryOptOut(optOut: boolean): void {
  try {
    if (optOut) localStorage.setItem(TELEMETRY_OPT_OUT_STORAGE, "1");
    else localStorage.removeItem(TELEMETRY_OPT_OUT_STORAGE);
  } catch {
    // Storage may be unavailable (private mode); still apply for this session.
  }
  getTelemetry()?.setEnabled(!optOut);
}

/** Apply the stored preference to the telemetry handle at boot. */
export function initTelemetryPreference(): void {
  if (isTelemetryOptedOut()) getTelemetry()?.setEnabled(false);
}
