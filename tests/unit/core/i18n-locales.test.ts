/**
 * M6: i18n locale expansion tests — verify ES/DE/ZH dictionaries
 * integrate with the i18n-catalog system and format correctly.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  _resetCatalogsForTests,
  t,
  registerLocale,
  getRegisteredLocales,
} from "../../../src/core/i18n-catalog";
import { setLocale } from "../../../src/core/i18n";

// Import locale files to register them
import "../../../src/locales/en";
import "../../../src/locales/es";
import "../../../src/locales/de";
import "../../../src/locales/zh";

describe("i18n locale expansion", () => {
  beforeEach(() => {
    setLocale("en");
  });

  it("registers all 4 locales", () => {
    const locales = getRegisteredLocales();
    expect(locales).toContain("en");
    expect(locales).toContain("es");
    expect(locales).toContain("de");
    expect(locales).toContain("zh");
  });

  describe("English (en)", () => {
    it("resolves navigation keys", () => {
      setLocale("en");
      expect(t("nav.watchlist")).toBe("Watchlist");
      expect(t("nav.settings")).toBe("Settings");
    });

    it("formats plural messages", () => {
      setLocale("en");
      expect(t("consensus.methods", { count: 1 })).toBe("1 method");
      expect(t("consensus.methods", { count: 5 })).toBe("5 methods");
    });
  });

  describe("Spanish (es)", () => {
    it("resolves navigation keys", () => {
      setLocale("es");
      expect(t("nav.watchlist")).toBe("Lista de seguimiento");
      expect(t("nav.settings")).toBe("Configuración");
    });

    it("resolves action keys", () => {
      setLocale("es");
      expect(t("action.save")).toBe("Guardar");
      expect(t("action.cancel")).toBe("Cancelar");
    });

    it("formats plural messages", () => {
      setLocale("es");
      expect(t("consensus.methods", { count: 1 })).toBe("1 método");
      expect(t("consensus.methods", { count: 3 })).toBe("3 métodos");
    });

    it("translates error messages", () => {
      setLocale("es");
      expect(t("error.network")).toBe("Error de red. Comprueba tu conexión.");
    });
  });

  describe("German (de)", () => {
    it("resolves navigation keys", () => {
      setLocale("de");
      expect(t("nav.alerts")).toBe("Alarme");
      expect(t("nav.settings")).toBe("Einstellungen");
    });

    it("resolves action keys", () => {
      setLocale("de");
      expect(t("action.add")).toBe("Hinzufügen");
      expect(t("action.delete")).toBe("Löschen");
    });

    it("formats plural messages", () => {
      setLocale("de");
      expect(t("backtest.trades", { count: 0 })).toBe("Keine Trades");
      expect(t("backtest.trades", { count: 1 })).toBe("1 Trade");
      expect(t("backtest.trades", { count: 7 })).toBe("7 Trades");
    });
  });

  describe("Chinese (zh)", () => {
    it("resolves navigation keys", () => {
      setLocale("zh");
      expect(t("nav.watchlist")).toBe("自选股");
      expect(t("nav.chart")).toBe("图表");
    });

    it("resolves consensus signals", () => {
      setLocale("zh");
      expect(t("consensus.buy")).toBe("买入");
      expect(t("consensus.sell")).toBe("卖出");
      expect(t("consensus.hold")).toBe("持有");
    });

    it("formats plural messages (Chinese has no plural form)", () => {
      setLocale("zh");
      expect(t("portfolio.shares", { count: 100 })).toBe("100股");
    });
  });

  describe("Fallback behaviour", () => {
    it("falls back to English for missing keys", () => {
      setLocale("es");
      // Register a key only in English
      registerLocale("en", { "test.onlyEnglish": "English only" });
      expect(t("test.onlyEnglish")).toBe("English only");
    });

    it("returns raw key when no translation exists", () => {
      setLocale("es");
      expect(t("nonexistent.key")).toBe("nonexistent.key");
    });
  });
});
