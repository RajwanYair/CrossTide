/**
 * Settings card adapter tests.
 *
 * Verifies mount delegates to renderSettings with config and handlers.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("../../../src/cards/settings", () => ({
  renderSettings: vi.fn(),
}));

vi.mock("../../../src/core/config", () => ({
  loadConfig: vi.fn().mockReturnValue({ theme: "dark", cardSettings: {} }),
  saveConfig: vi.fn(),
}));

vi.mock("../../../src/ui/theme", () => ({
  initTheme: vi.fn(),
}));

vi.mock("../../../src/core/finnhub-stream-manager", () => ({
  getStoredFinnhubKey: vi.fn().mockReturnValue(null),
  clearStoredFinnhubKey: vi.fn(),
  FINNHUB_KEY_STORAGE: "fh-key",
}));

vi.mock("../../../src/core/card-settings-signal", () => ({
  hydrateCardSettings: vi.fn(),
  updateCardSettingsSignal: vi.fn(),
}));

describe("settings-card (CardModule)", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it("mounts without throwing", async () => {
    const { default: settingsCard } = await import("../../../src/cards/settings-card");
    expect(() => settingsCard.mount(container, { route: "settings", params: {} })).not.toThrow();
  });

  it("calls renderSettings on mount", async () => {
    const { renderSettings } = await import("../../../src/cards/settings");
    const { default: settingsCard } = await import("../../../src/cards/settings-card");
    settingsCard.mount(container, { route: "settings", params: {} });
    expect(renderSettings).toHaveBeenCalledTimes(1);
  });

  it("passes config and callbacks to renderSettings", async () => {
    const { renderSettings } = await import("../../../src/cards/settings");
    const { default: settingsCard } = await import("../../../src/cards/settings-card");
    settingsCard.mount(container, { route: "settings", params: {} });

    const args = vi.mocked(renderSettings).mock.calls[0];
    expect(args[0]).toBe(container);
    // Second arg is config object
    expect(args[1]).toEqual({ theme: "dark", cardSettings: {} });
    // Third arg is callbacks object
    expect(args[2]).toHaveProperty("onThemeChange");
    expect(args[2]).toHaveProperty("onExport");
    expect(args[2]).toHaveProperty("onImport");
    expect(args[2]).toHaveProperty("onClearWatchlist");
    expect(args[2]).toHaveProperty("onClearCache");
    expect(args[2]).toHaveProperty("onFinnhubKeyChange");
    expect(args[2]).toHaveProperty("onMethodWeightsChange");
    expect(args[2]).toHaveProperty("onCardSettingsChange");
  });

  it("onThemeChange saves config and calls initTheme", async () => {
    const { renderSettings } = await import("../../../src/cards/settings");
    const { saveConfig } = await import("../../../src/core/config");
    const { initTheme } = await import("../../../src/ui/theme");
    const { default: settingsCard } = await import("../../../src/cards/settings-card");
    settingsCard.mount(container, { route: "settings", params: {} });

    const callbacks = vi.mocked(renderSettings).mock.calls[0][2];
    callbacks.onThemeChange("light");
    expect(saveConfig).toHaveBeenCalled();
    expect(initTheme).toHaveBeenCalledWith("light");
  });
});
