/**
 * Tests for i18n-catalog.ts (J13).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  registerLocale,
  t,
  createTranslator,
  defineMessages,
  getRegisteredLocales,
  hasTranslation,
  _resetCatalogsForTests,
} from "../../../src/core/i18n-catalog";

// Mock getLocale to control the active locale in tests
vi.mock("../../../src/core/i18n", () => {
  let _locale = "en";
  return {
    getLocale: vi.fn(() => _locale),
    setLocale: vi.fn((l: string) => {
      _locale = l;
    }),
    __setTestLocale: (l: string) => {
      _locale = l;
    },
  };
});

// Import the test helper after mocking
const { __setTestLocale } = (await import("../../../src/core/i18n")) as unknown as {
  __setTestLocale: (l: string) => void;
};

describe("i18n-catalog", () => {
  beforeEach(() => {
    _resetCatalogsForTests();
    __setTestLocale("en");
  });

  describe("registerLocale", () => {
    it("registers messages for a locale", () => {
      registerLocale("en", { greeting: "Hello" });
      expect(getRegisteredLocales()).toContain("en");
    });

    it("merges messages on repeated registration", () => {
      registerLocale("en", { a: "A" });
      registerLocale("en", { b: "B" });
      expect(t("a")).toBe("A");
      expect(t("b")).toBe("B");
    });

    it("later messages override earlier ones", () => {
      registerLocale("en", { x: "first" });
      registerLocale("en", { x: "second" });
      expect(t("x")).toBe("second");
    });
  });

  describe("t", () => {
    it("returns translated string for active locale", () => {
      registerLocale("en", { hello: "Hello!" });
      expect(t("hello")).toBe("Hello!");
    });

    it("interpolates ICU values", () => {
      registerLocale("en", { welcome: "Hi, {name}!" });
      expect(t("welcome", { name: "Alice" })).toBe("Hi, Alice!");
    });

    it("falls back to English when locale key is missing", () => {
      registerLocale("en", { cancel: "Cancel" });
      __setTestLocale("fr");
      expect(t("cancel")).toBe("Cancel");
    });

    it("falls back to base language tag (pt-BR → pt)", () => {
      registerLocale("pt", { ok: "OK traduzido" });
      __setTestLocale("pt-BR");
      expect(t("ok")).toBe("OK traduzido");
    });

    it("returns raw key when no translation exists", () => {
      expect(t("nonexistent.key")).toBe("nonexistent.key");
    });

    it("uses locale-specific message over English", () => {
      registerLocale("en", { save: "Save" });
      registerLocale("es", { save: "Guardar" });
      __setTestLocale("es");
      expect(t("save")).toBe("Guardar");
    });

    it("handles plural ICU template", () => {
      registerLocale("en", {
        alerts: "{count, plural, =0{No alerts} =1{1 alert} other{# alerts}}",
      });
      expect(t("alerts", { count: 0 })).toBe("No alerts");
      expect(t("alerts", { count: 1 })).toBe("1 alert");
      expect(t("alerts", { count: 5 })).toBe("5 alerts");
    });
  });

  describe("createTranslator", () => {
    it("creates a bound translator for a specific locale", () => {
      registerLocale("de", { bye: "Tschüss" });
      const tDe = createTranslator("de");
      expect(tDe("bye")).toBe("Tschüss");
    });

    it("bound translator uses ICU formatting", () => {
      registerLocale("fr", { items: "{n} éléments" });
      const tFr = createTranslator("fr");
      expect(tFr("items", { n: 42 })).toBe("42 éléments");
    });
  });

  describe("defineMessages", () => {
    it("returns the same dictionary (identity function)", () => {
      const msgs = defineMessages({ a: "A", b: "B" });
      expect(msgs).toEqual({ a: "A", b: "B" });
    });
  });

  describe("getRegisteredLocales", () => {
    it("returns empty array initially", () => {
      expect(getRegisteredLocales()).toEqual([]);
    });

    it("lists all registered locales", () => {
      registerLocale("en", { x: "x" });
      registerLocale("fr", { x: "x" });
      registerLocale("ja", { x: "x" });
      expect(getRegisteredLocales().sort()).toEqual(["en", "fr", "ja"]);
    });
  });

  describe("hasTranslation", () => {
    it("returns true when key exists for given locale", () => {
      registerLocale("en", { save: "Save" });
      expect(hasTranslation("save", "en")).toBe(true);
    });

    it("returns false when key is missing", () => {
      registerLocale("en", { save: "Save" });
      expect(hasTranslation("delete", "en")).toBe(false);
    });

    it("returns false for unregistered locale", () => {
      expect(hasTranslation("save", "zz")).toBe(false);
    });

    it("uses active locale when none specified", () => {
      registerLocale("en", { ok: "OK" });
      __setTestLocale("en");
      expect(hasTranslation("ok")).toBe(true);
    });
  });
});
