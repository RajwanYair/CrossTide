/**
 * Route Guards — client-side navigation protection.
 *
 * Provides a declarative system to protect routes behind authentication
 * or arbitrary conditions. Guards are evaluated before card mount; if a
 * guard rejects, the user is redirected to a fallback route.
 */
import type { RouteName } from "../ui/router";
import { getStoredPasskeyId } from "./passkey";

export type GuardResult = { allowed: true } | { allowed: false; redirect: RouteName };

export type RouteGuardFn = (route: RouteName) => GuardResult;

/**
 * Check if the user has an active authentication credential.
 */
export function isAuthenticated(): boolean {
  return getStoredPasskeyId() !== null;
}

/**
 * Guard that requires authentication.
 * Redirects to settings (which contains the passkey UI) if not authenticated.
 */
export function requireAuth(_route: RouteName): GuardResult {
  if (isAuthenticated()) {
    return { allowed: true };
  }
  return { allowed: false, redirect: "settings" };
}

/** Routes that require authentication to access. */
const PROTECTED_ROUTES: ReadonlySet<RouteName> = new Set(["portfolio", "rebalance", "alerts"]);

/** Registry of custom guards per route. */
const customGuards = new Map<RouteName, RouteGuardFn>();

/**
 * Register a custom guard for a specific route.
 */
export function registerGuard(route: RouteName, guard: RouteGuardFn): void {
  customGuards.set(route, guard);
}

/**
 * Evaluate all guards for a route. Returns the first rejection or allowed.
 */
export function evaluateGuards(route: RouteName): GuardResult {
  // Check built-in protection
  if (PROTECTED_ROUTES.has(route)) {
    const result = requireAuth(route);
    if (!result.allowed) return result;
  }

  // Check custom guard
  const custom = customGuards.get(route);
  if (custom) {
    return custom(route);
  }

  return { allowed: true };
}

/**
 * Clear all custom guards (useful for testing).
 */
export function clearGuards(): void {
  customGuards.clear();
}
