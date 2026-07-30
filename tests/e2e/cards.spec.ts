/**
 * E2E card matrix — every registered card route and every instrument type.
 *
 * Complements app.spec.ts / views.spec.ts (which cover a hand-picked subset)
 * with an exhaustive, data-driven sweep so a newly registered card cannot ship
 * without an E2E guard. Each card is checked for:
 *   - a visible nav link that activates the view
 *   - direct-URL routing to the same view
 *   - a rendered heading and non-empty body
 *   - no uncaught page errors while mounting
 *
 * The watchlist is additionally exercised with one ticker per instrument class
 * (stock, ETF, crypto, forex, index) to guard symbol parsing and row rendering.
 */
import { test, expect, type Page } from "@playwright/test";
import { waitForAppReady } from "./app-ready";

interface CardSpec {
  readonly route: string;
  readonly viewId: string;
  /**
   * Set only for views whose `.card` shell + `<h2>` live in index.html. The
   * remaining routes are bare mount containers whose card module paints its
   * own header once data resolves, so a heading cannot be asserted offline.
   */
  readonly heading?: RegExp;
}

/** Mirrors `listCards()` in src/cards/registry.ts — keep both in sync. */
const CARDS: readonly CardSpec[] = [
  { route: "watchlist", viewId: "view-watchlist", heading: /watchlist/i },
  { route: "consensus", viewId: "view-consensus", heading: /consensus/i },
  { route: "chart", viewId: "view-chart", heading: /chart/i },
  { route: "alerts", viewId: "view-alerts", heading: /alert/i },
  { route: "heatmap", viewId: "view-heatmap", heading: /heatmap/i },
  { route: "screener", viewId: "view-screener", heading: /screener/i },
  { route: "settings", viewId: "view-settings", heading: /settings/i },
  { route: "provider-health", viewId: "view-provider-health", heading: /health/i },
  { route: "portfolio", viewId: "view-portfolio", heading: /portfolio/i },
  { route: "risk", viewId: "view-risk", heading: /risk/i },
  { route: "backtest", viewId: "view-backtest", heading: /backtest/i },
  { route: "consensus-timeline", viewId: "view-consensus-timeline", heading: /timeline/i },
  { route: "strategy-comparison", viewId: "view-strategy-comparison" },
  { route: "signal-dsl", viewId: "view-signal-dsl" },
  { route: "multi-chart", viewId: "view-multi-chart" },
  { route: "correlation", viewId: "view-correlation" },
  { route: "market-breadth", viewId: "view-market-breadth" },
  { route: "earnings-calendar", viewId: "view-earnings-calendar" },
  { route: "macro-dashboard", viewId: "view-macro-dashboard" },
  { route: "sector-rotation", viewId: "view-sector-rotation" },
  { route: "relative-strength", viewId: "view-relative-strength" },
  { route: "seasonality", viewId: "view-seasonality" },
  { route: "comparison", viewId: "view-comparison" },
  { route: "rebalance", viewId: "view-rebalance" },
];

/** Symbol conventions the watchlist must accept, one per instrument class. */
const INSTRUMENTS: ReadonlyArray<{ label: string; ticker: string }> = [
  { label: "stock", ticker: "MSFT" },
  { label: "etf", ticker: "SPY" },
  { label: "crypto", ticker: "BTC-USD" },
  { label: "forex", ticker: "EURUSD=X" },
  { label: "index", ticker: "^GSPC" },
  { label: "adr", ticker: "TSM" },
  { label: "share class", ticker: "BRK.B" },
  { label: "foreign listing", ticker: "RDSA.AS" },
];

/** Collect uncaught page errors for the lifetime of a test. */
function trackPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => {
    // WebKit can surface failed proxied requests as pageerror noise
    // ("... due to access control checks.") even when cards gracefully
    // render fallback UI. Keep the assertion focused on actual app exceptions.
    if (e.message.includes("due to access control checks")) return;
    errors.push(e.message);
  });
  return errors;
}

test.describe("card matrix", () => {
  for (const card of CARDS) {
    test(`${card.route} — nav link, direct URL, heading and body`, async ({ page }) => {
      const errors = trackPageErrors(page);
      const view = page.locator(`#${card.viewId}`);

      // 1. Nav link activates the view.
      await page.goto("/");
      await waitForAppReady(page);
      const link = page.locator(`#app-nav a[data-route="${card.route}"]`);
      await expect(link).toBeVisible();
      await link.click();
      await expect(view).toHaveClass(/active/);
      await expect(view).toBeVisible();

      // 2. Direct URL resolves to the same view.
      await page.goto(`/${card.route}`);
      await expect(view).toHaveClass(/active/);

      // 3. The card paints something — a heading where index.html provides
      //    one, and in every case a non-empty body (data or empty state).
      if (card.heading) {
        await expect(view.locator("h2").first()).toHaveText(card.heading);
        await expect(view.locator(".card").first()).toBeVisible();
      }
      await expect
        .poll(async () => ((await view.innerText()).trim().length > 0 ? "filled" : "empty"))
        .toBe("filled");

      // 4. Mounting the card must not throw.
      expect(errors).toEqual([]);
    });
  }
});

test.describe("watchlist instrument types", () => {
  for (const { label, ticker } of INSTRUMENTS) {
    test(`accepts a ${label} symbol (${ticker})`, async ({ page }) => {
      await page.goto("/watchlist");
      await waitForAppReady(page);
      const input = page.locator("#add-ticker");
      await expect(input).toBeVisible();

      await input.fill(ticker);
      // Dismiss the suggestion listbox so Enter submits the typed symbol
      // rather than selecting a highlighted suggestion.
      await input.press("Escape");
      await input.press("Enter");

      await expect(page.locator(`#watchlist-body tr[data-ticker="${ticker}"]`)).toBeVisible();
      await expect(page.locator("#watchlist-empty")).toBeHidden();
    });
  }

  test("rejects a malformed symbol without adding a row", async ({ page }) => {
    await page.goto("/watchlist");
    await waitForAppReady(page);
    const input = page.locator("#add-ticker");
    await input.fill("!!!");
    await input.press("Enter");
    await expect(page.locator("#watchlist-body tr")).toHaveCount(0);
  });
});

test.describe("ticker search suggestions", () => {
  test("suggests similar tickers while typing", async ({ page }) => {
    await page.goto("/watchlist");
    await waitForAppReady(page);
    const input = page.locator("#add-ticker");
    await input.fill("AAP");

    const listbox = page.locator("#autocomplete-listbox");
    await expect(listbox).toBeVisible();
    await expect(listbox).toContainText("AAPL");
  });

  test("still suggests tickers when every network source fails", async ({ page }) => {
    // Kill all data sources so only the offline catalog can answer.
    await page.route("**/api/**", (route) => route.abort());
    await page.route("**/query1.finance.yahoo.com/**", (route) => route.abort());

    await page.goto("/watchlist");
    await waitForAppReady(page);
    const input = page.locator("#add-ticker");
    await input.fill("micro");

    const listbox = page.locator("#autocomplete-listbox");
    await expect(listbox).toBeVisible();
    await expect(listbox).toContainText("MSFT");
  });

  test("suggests non-equity instruments too", async ({ page }) => {
    await page.goto("/watchlist");
    await waitForAppReady(page);
    const input = page.locator("#add-ticker");
    const listbox = page.locator("#autocomplete-listbox");

    await input.fill("BTC");
    await expect(listbox).toContainText("BTC-USD");

    await input.fill("");
    await input.fill("EURUSD");
    await expect(listbox).toContainText("EURUSD=X");
  });

  test("reports an empty state for an unknown symbol", async ({ page }) => {
    await page.route("**/api/**", (route) => route.abort());

    await page.goto("/watchlist");
    await waitForAppReady(page);
    await page.locator("#add-ticker").fill("ZZZZQQQ");

    await expect(page.locator("#autocomplete-listbox")).toContainText("No matching tickers");
  });

  test("selecting a suggestion adds it to the watchlist", async ({ page }) => {
    await page.route("**/api/**", (route) => route.abort());
    await page.route("**/query1.finance.yahoo.com/**", (route) => route.abort());

    await page.goto("/watchlist");
    await waitForAppReady(page);
    await page.locator("#add-ticker").fill("AAP");

    const option = page.locator("#autocomplete-listbox li[data-symbol]").first();
    await expect(option).toBeVisible();
    const symbol = await option.getAttribute("data-symbol");
    expect(symbol).toBeTruthy();
    await option.click();

    await expect(page.locator(`#watchlist-body tr[data-ticker="${symbol}"]`)).toBeVisible();
  });
});
