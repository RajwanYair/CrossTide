/**
 * Tests for route guards.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock passkey module
vi.mock("../../../src/core/passkey", () => ({
  getStoredPasskeyId: vi.fn(),
}));

import {
  isAuthenticated,
  requireAuth,
  evaluateGuards,
  registerGuard,
  clearGuards,
} from "../../../src/core/route-guards";
import { getStoredPasskeyId } from "../../../src/core/passkey";

const mockGetStoredPasskeyId = vi.mocked(getStoredPasskeyId);

describe("route-guards", () => {
  beforeEach(() => {
    clearGuards();
    mockGetStoredPasskeyId.mockReturnValue(null);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("isAuthenticated", () => {
    it("returns false when no passkey stored", () => {
      mockGetStoredPasskeyId.mockReturnValue(null);
      expect(isAuthenticated()).toBe(false);
    });

    it("returns true when passkey is stored", () => {
      mockGetStoredPasskeyId.mockReturnValue("credential-id-123");
      expect(isAuthenticated()).toBe(true);
    });
  });

  describe("requireAuth", () => {
    it("allows when authenticated", () => {
      mockGetStoredPasskeyId.mockReturnValue("cred");
      expect(requireAuth("portfolio")).toEqual({ allowed: true });
    });

    it("redirects to settings when not authenticated", () => {
      mockGetStoredPasskeyId.mockReturnValue(null);
      expect(requireAuth("portfolio")).toEqual({ allowed: false, redirect: "settings" });
    });
  });

  describe("evaluateGuards", () => {
    it("allows unprotected routes without auth", () => {
      mockGetStoredPasskeyId.mockReturnValue(null);
      expect(evaluateGuards("watchlist")).toEqual({ allowed: true });
    });

    it("blocks protected routes without auth", () => {
      mockGetStoredPasskeyId.mockReturnValue(null);
      const result = evaluateGuards("portfolio");
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.redirect).toBe("settings");
    });

    it("allows protected routes with auth", () => {
      mockGetStoredPasskeyId.mockReturnValue("cred");
      expect(evaluateGuards("portfolio")).toEqual({ allowed: true });
    });

    it("blocks alerts route without auth", () => {
      mockGetStoredPasskeyId.mockReturnValue(null);
      expect(evaluateGuards("alerts").allowed).toBe(false);
    });

    it("blocks rebalance route without auth", () => {
      mockGetStoredPasskeyId.mockReturnValue(null);
      expect(evaluateGuards("rebalance").allowed).toBe(false);
    });
  });

  describe("registerGuard", () => {
    it("applies custom guard", () => {
      registerGuard("chart", () => ({ allowed: false, redirect: "watchlist" }));
      const result = evaluateGuards("chart");
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.redirect).toBe("watchlist");
    });

    it("custom guard runs after built-in protection", () => {
      mockGetStoredPasskeyId.mockReturnValue("cred");
      const customGuard = vi.fn().mockReturnValue({ allowed: false, redirect: "watchlist" });
      registerGuard("portfolio", customGuard);
      const result = evaluateGuards("portfolio");
      // Auth passes, then custom guard blocks
      expect(customGuard).toHaveBeenCalled();
      expect(result.allowed).toBe(false);
    });
  });
});
