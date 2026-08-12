/**
 * M6: i18n locale expansion tests — verify supported dictionaries
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
import "../../../src/locales/he";
import en from "../../../src/locales/en";
import es from "../../../src/locales/es";
import de from "../../../src/locales/de";
import zh from "../../../src/locales/zh";
import he from "../../../src/locales/he";
import ja from "../../../src/locales/ja";
import { LOCALE_LABELS, SUPPORTED_LOCALES } from "../../../src/locales";
import { formatCurrency, formatDate, formatNumber } from "../../../src/core/i18n";

describe("i18n locale expansion", () => {
  beforeEach(() => {
    setLocale("en");
  });

  it("registers every supported locale", () => {
    const locales = getRegisteredLocales();
    expect(locales).toEqual(expect.arrayContaining(SUPPORTED_LOCALES));
  });

  it("exposes the supported locale barrel contract", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en", "es", "de", "zh", "he", "ja"]);
    expect(LOCALE_LABELS.ja).toBe("日本語");
  });

  it("keeps every supported catalog key-complete with English", () => {
    const englishKeys = Object.keys(en).sort();
    for (const catalog of [es, de, zh, he, ja]) {
      expect(Object.keys(catalog).sort()).toEqual(englishKeys);
    }
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

  describe("Hebrew (he) — RTL", () => {
    it("resolves navigation keys", () => {
      setLocale("he");
      expect(t("nav.watchlist")).toBe("רשימת מעקב");
      expect(t("nav.settings")).toBe("הגדרות");
    });

    it("resolves consensus signals", () => {
      setLocale("he");
      expect(t("consensus.buy")).toBe("קנייה");
      expect(t("consensus.sell")).toBe("מכירה");
      expect(t("consensus.hold")).toBe("החזקה");
    });

    it("formats plural messages", () => {
      setLocale("he");
      expect(t("backtest.trades", { count: 0 })).toBe("ללא עסקאות");
      expect(t("backtest.trades", { count: 1 })).toBe("עסקה אחת");
      expect(t("backtest.trades", { count: 5 })).toBe("5 עסקאות");
    });

    it("translates error messages", () => {
      setLocale("he");
      expect(t("error.network")).toBe("שגיאת רשת. בדוק את החיבור שלך.");
    });

    it("formats numbers, currency, and dates using the Hebrew locale", () => {
      setLocale("he-IL");
      expect(formatNumber(1234567.89)).toContain("1,234,567.89");
      expect(formatCurrency(49.99, "ILS")).toContain("₪");
      expect(formatDate(new Date("2025-01-15T00:00:00Z"), "medium")).toContain("2025");
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
