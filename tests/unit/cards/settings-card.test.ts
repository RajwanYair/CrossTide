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
  applyTheme: vi.fn(),
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

vi.mock("../../../src/ui/auto-theme-sync", () => ({
  setThemeOverride: vi.fn(),
  getThemeOverride: vi.fn().mockReturnValue(null),
}));

vi.mock("../../../src/ui/palette-switcher", () => ({
  applyPalette: vi.fn(),
}));

vi.mock("../../../src/ui/pwa-install", () => ({
  getPwaInstallManager: vi.fn().mockReturnValue({
    isAvailable: vi.fn().mockReturnValue(false),
    prompt: vi.fn(),
    dismiss: vi.fn(),
    onReady: vi.fn(),
    offReady: vi.fn(),
    onInstalled: vi.fn(),
    offInstalled: vi.fn(),
  }),
}));

vi.mock("../../../src/core/watchlist-export", () => ({
  exportWatchlist: vi.fn().mockReturnValue("[]"),
}));

vi.mock("../../../src/core/watchlist-import", () => ({
  parseTickersFromText: vi.fn().mockReturnValue([]),
}));

vi.mock("../../../src/core/export-image", () => ({
  captureElementAsSvg: vi.fn().mockReturnValue("<svg></svg>"),
  downloadSvg: vi.fn(),
}));

vi.mock("../../../src/core/export-import", () => ({
  downloadFile: vi.fn(),
  downloadCompressedFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../src/core/data-export", () => ({
  exportFullDataJson: vi.fn().mockReturnValue("{}"),
  exportFullDataCsv: vi.fn().mockReturnValue(""),
}));

vi.mock("../../../src/core/full-backup", () => ({
  collectFullBackup: vi.fn().mockReturnValue({}),
}));

vi.mock("../../../src/core/watchlist-store", () => ({
  watchlistStore: { actions: { addTicker: vi.fn(), removeTicker: vi.fn() } },
}));

vi.mock("../../../src/core/watchlist-history", () => ({
  recordAdd: vi.fn(),
  recordRemove: vi.fn(),
}));

vi.mock("../../../src/ui/toast", () => ({
  showToast: vi.fn(),
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

  it("onThemeChange saves config, applies the theme, and stops auto-sync", async () => {
    const { renderSettings } = await import("../../../src/cards/settings");
    const { saveConfig } = await import("../../../src/core/config");
    const { initTheme } = await import("../../../src/ui/theme");
    const { setThemeOverride } = await import("../../../src/ui/auto-theme-sync");
    const { default: settingsCard } = await import("../../../src/cards/settings-card");
    settingsCard.mount(container, { route: "settings", params: {} });

    const callbacks = vi.mocked(renderSettings).mock.calls[0][2];
    callbacks.onThemeChange("light");
    expect(saveConfig).toHaveBeenCalled();
    expect(initTheme).toHaveBeenCalledWith("light");
    expect(setThemeOverride).toHaveBeenCalledWith("light");
  });

  it("onPaletteChange applies the palette", async () => {
    const { renderSettings } = await import("../../../src/cards/settings");
    const { applyPalette } = await import("../../../src/ui/palette-switcher");
    const { default: settingsCard } = await import("../../../src/cards/settings-card");
    settingsCard.mount(container, { route: "settings", params: {} });

    const callbacks = vi.mocked(renderSettings).mock.calls[0][2];
    callbacks.onPaletteChange?.("deuteranopia");
    expect(applyPalette).toHaveBeenCalledWith("deuteranopia");
  });

  it("onClearWatchlist saves an empty watchlist and dispatches a resync event", async () => {
    const { renderSettings } = await import("../../../src/cards/settings");
    const { saveConfig, loadConfig } = await import("../../../src/core/config");
    const { default: settingsCard } = await import("../../../src/cards/settings-card");
    vi.mocked(loadConfig).mockReturnValue({
      theme: "dark",
      cardSettings: {},
      watchlist: [{ ticker: "AAPL", addedAt: "2025-01-01T00:00:00Z" }],
    } as never);
    settingsCard.mount(container, { route: "settings", params: {} });

    const resyncListener = vi.fn();
    window.addEventListener("crosstide:config-changed", resyncListener);
    const callbacks = vi.mocked(renderSettings).mock.calls[0][2];
    callbacks.onClearWatchlist();
    expect(saveConfig).toHaveBeenCalledWith(expect.objectContaining({ watchlist: [] }));
    expect(resyncListener).toHaveBeenCalledOnce();
    window.removeEventListener("crosstide:config-changed", resyncListener);
  });

  it("onExportFullJson downloads a JSON backup", async () => {
    const { renderSettings } = await import("../../../src/cards/settings");
    const { downloadFile } = await import("../../../src/core/export-import");
    const { default: settingsCard } = await import("../../../src/cards/settings-card");
    settingsCard.mount(container, { route: "settings", params: {} });

    const callbacks = vi.mocked(renderSettings).mock.calls[0][2];
    callbacks.onExportFullJson?.();
    expect(downloadFile).toHaveBeenCalledWith(
      "{}",
      expect.stringMatching(/crosstide-export-.*\.json$/),
      "application/json",
    );
  });

  it("onExportFullCsv downloads a CSV backup", async () => {
    const { renderSettings } = await import("../../../src/cards/settings");
    const { downloadFile } = await import("../../../src/core/export-import");
    const { default: settingsCard } = await import("../../../src/cards/settings-card");
    settingsCard.mount(container, { route: "settings", params: {} });

    const callbacks = vi.mocked(renderSettings).mock.calls[0][2];
    callbacks.onExportFullCsv?.();
    expect(downloadFile).toHaveBeenCalledWith(
      "",
      expect.stringMatching(/crosstide-export-.*\.csv$/),
      "text/csv",
    );
  });
});
