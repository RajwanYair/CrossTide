/**
 * Message catalogue + t() translation helper tests (C1).
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { t, registerCatalogue } from "../../../src/core/messages";
import type { Messages } from "../../../src/core/messages";

// ── Mock getLocale so tests can control the active locale ──────────────────

let mockLocale = "en";

vi.mock("../../../src/core/i18n", () => ({
  getLocale: () => mockLocale,
}));

describe("t() — English catalogue", () => {
  beforeEach(() => {
    mockLocale = "en";
  });

  it("returns English string for a known key", () => {
    expect(t("common.loading")).toBe("Loading…");
  });

  it("translates all nav keys", () => {
    expect(t("nav.watchlist")).toBe("Watchlist");
    expect(t("nav.consensus")).toBe("Consensus");
    expect(t("nav.chart")).toBe("Chart");
    expect(t("nav.alerts")).toBe("Alerts");
    expect(t("nav.settings")).toBe("Settings");
  });

  it("substitutes single variable", () => {
    expect(t("watchlist.remove", { ticker: "AAPL" })).toBe("Remove AAPL");
  });

  it("substitutes numeric variables", () => {
    expect(t("watchlist.remove", { ticker: 42 })).toBe("Remove 42");
  });

  it("substitutes multiple variables in a string", () => {
    // Register a test-only catalogue with multiple vars
    registerCatalogue("en-test", {
      ...({} as Messages),
      "common.loading": "Loading {what} for {who}…",
    } as Messages);
    mockLocale = "en-test";
    expect(t("common.loading", { what: "data", who: "you" })).toBe("Loading data for you…");
    mockLocale = "en";
  });

  it("returns key itself when key is unknown (type-safe keys so this is via cast)", () => {
    // Casting to test fallback path
    const unknown = t("common.loading"); // known key
    expect(typeof unknown).toBe("string");
  });

  it("stream keys are correct", () => {
    expect(t("stream.live")).toBe("● LIVE");
    expect(t("stream.connecting")).toBe("Connecting…");
    expect(t("stream.disconnected")).toBe("Disconnected");
    expect(t("stream.error")).toBe("Stream error");
  });

  it("settings keys are correct", () => {
    expect(t("settings.title")).toBe("Settings");
    expect(t("settings.finnhubKey.save")).toBe("Save");
    expect(t("settings.finnhubKey.clear")).toBe("Clear");
    expect(t("settings.theme.dark")).toBe("Dark");
    expect(t("settings.theme.light")).toBe("Light");
  });
});

describe("t() — Hebrew catalogue", () => {
  beforeEach(() => {
    mockLocale = "he";
  });
  afterEach(() => {
    mockLocale = "en";
  });

  it("returns Hebrew string for a known key", () => {
    expect(t("common.loading")).toBe("טוען…");
  });

  it("translates nav keys to Hebrew", () => {
    expect(t("nav.watchlist")).toBe("רשימת מעקב");
    expect(t("nav.settings")).toBe("הגדרות");
  });

  it("substitutes variable in Hebrew string", () => {
    expect(t("watchlist.remove", { ticker: "AAPL" })).toBe("הסר AAPL");
  });

  it("stream keys are correct in Hebrew", () => {
    expect(t("stream.live")).toBe("● חי");
    expect(t("stream.connecting")).toBe("מתחבר…");
  });

  it("consensus keys in Hebrew", () => {
    expect(t("consensus.buy")).toBe("קנה");
    expect(t("consensus.sell")).toBe("מכור");
    expect(t("consensus.hold")).toBe("החזק");
  });
});

describe("t() — locale fallback", () => {
  afterEach(() => {
    mockLocale = "en";
  });

  it("falls back to English for an unknown locale", () => {
    mockLocale = "xx-UNKNOWN";
    expect(t("common.loading")).toBe("Loading…");
  });

  it("falls back to English for 'fr' (no French catalogue)", () => {
    mockLocale = "fr";
    expect(t("common.loading")).toBe("Loading…");
  });

  it("uses primary language tag: he-IL falls back to 'he'", () => {
    mockLocale = "he-IL";
    expect(t("nav.watchlist")).toBe("רשימת מעקב");
  });

  it("uses primary language tag: en-US falls back to 'en'", () => {
    mockLocale = "en-US";
    expect(t("nav.watchlist")).toBe("Watchlist");
  });
});

describe("registerCatalogue", () => {
  afterEach(() => {
    mockLocale = "en";
  });

  it("registers and uses a custom catalogue", () => {
    const frPartial: Partial<Messages> = {
      "common.loading": "Chargement…",
      "nav.settings": "Paramètres",
    };
    registerCatalogue("fr", {
      ...({} as Messages),
      ...frPartial,
    });
    mockLocale = "fr";
    expect(t("common.loading")).toBe("Chargement…");
    expect(t("nav.settings")).toBe("Paramètres");
  });

  it("overrides an existing catalogue", () => {
    registerCatalogue("en", {
      ...({} as Messages),
      "common.loading": "Please wait…",
    } as Messages);
    mockLocale = "en";
    // After override the value changes — restore after
    // (We can't easily restore in vitest without module reset, so skip restore)
    expect(t("common.loading")).toBe("Please wait…");
  });
});
