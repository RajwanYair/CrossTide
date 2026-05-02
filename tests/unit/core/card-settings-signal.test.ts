/**
 * Tests for G24: card-settings-signal reactive store.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  hydrateCardSettings,
  updateCardSettingsSignal,
  getCardSettingsSignal,
  onCardSettingsChange,
} from "../../../src/core/card-settings-signal";

// Reset signal state between tests by hydrating with empty object
beforeEach(() => {
  hydrateCardSettings({});
});

describe("hydrateCardSettings", () => {
  it("initialises signal from a CardSettingsMap", () => {
    hydrateCardSettings({ chart: { defaultInterval: "1d", crosshairSnap: true } });
    expect(getCardSettingsSignal("chart")?.defaultInterval).toBe("1d");
  });

  it("accepts undefined and resets to empty map", () => {
    hydrateCardSettings({ chart: { defaultInterval: "1d", crosshairSnap: true } });
    hydrateCardSettings(undefined);
    expect(getCardSettingsSignal("chart")).toBeUndefined();
  });
});

describe("updateCardSettingsSignal", () => {
  it("sets settings for a new card", () => {
    updateCardSettingsSignal("watchlist", {
      visibleColumns: ["ticker", "price"],
      autoRefreshMs: 5000,
    });
    const result = getCardSettingsSignal("watchlist");
    expect(result?.visibleColumns).toEqual(["ticker", "price"]);
  });

  it("overwrites settings for an existing card", () => {
    updateCardSettingsSignal("chart", { defaultInterval: "1d", crosshairSnap: true });
    updateCardSettingsSignal("chart", { defaultInterval: "4h", crosshairSnap: false });
    expect(getCardSettingsSignal("chart")?.defaultInterval).toBe("4h");
  });

  it("does not affect other cards when updating one", () => {
    updateCardSettingsSignal("chart", { defaultInterval: "1d", crosshairSnap: true });
    updateCardSettingsSignal("screener", { autoRun: true, maxResults: 25 });
    expect(getCardSettingsSignal("chart")?.defaultInterval).toBe("1d");
    expect(getCardSettingsSignal("screener")?.autoRun).toBe(true);
  });
});

describe("getCardSettingsSignal", () => {
  it("returns undefined for unknown card", () => {
    expect(getCardSettingsSignal("heatmap")).toBeUndefined();
  });
});

describe("onCardSettingsChange", () => {
  it("fires callback when relevant card is updated", () => {
    const calls: unknown[] = [];
    const unsub = onCardSettingsChange("chart", (s) => calls.push(s));
    updateCardSettingsSignal("chart", { defaultInterval: "1d", crosshairSnap: true });
    expect(calls.length).toBeGreaterThanOrEqual(1);
    unsub();
  });

  it("fires callback with updated value", () => {
    let latest: unknown;
    const unsub = onCardSettingsChange("chart", (s) => {
      latest = s;
    });
    updateCardSettingsSignal("chart", { defaultInterval: "4h", crosshairSnap: false });
    const s = latest as { defaultInterval: string } | undefined;
    expect(s?.defaultInterval).toBe("4h");
    unsub();
  });

  it("cleanup function removes listener (no calls after unsub)", () => {
    const calls: unknown[] = [];
    const unsub = onCardSettingsChange("chart", () => calls.push(1));
    unsub();
    const countBefore = calls.length;
    updateCardSettingsSignal("chart", { defaultInterval: "1w", crosshairSnap: false });
    expect(calls.length).toBe(countBefore);
  });
});
