/**
 * E2E smoke test for embeddable widgets outside the app shell (E21).
 *
 * The host content is injected directly with `page.setContent`, so this test
 * verifies the widget bundle can run in a third-party page context without any
 * dependency on CrossTide's router/layout bootstrap.
 */

import { expect, test } from "@playwright/test";

test("embeddable widgets load and fetch data on a plain host page", async ({ page }) => {
  let chartRequests = 0;
  let quoteRequests = 0;
  let consensusRequests = 0;

  await page.route("**/api/chart**", async (route) => {
    chartRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ticker: "AAPL",
        candles: [
          { time: 1710000000, open: 100, high: 104, low: 99, close: 103, volume: 1000 },
          { time: 1710086400, open: 103, high: 106, low: 101, close: 105, volume: 1200 },
        ],
      }),
    });
  });

  await page.route("**/api/quote/**", async (route) => {
    quoteRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ticker: "AAPL",
        price: 105.23,
        change: 1.18,
        changePercent: 1.13,
        currency: "USD",
      }),
    });
  });

  await page.route("**/api/screener", async (route) => {
    consensusRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ rows: [{ ticker: "AAPL", consensus: "BUY", score: 88 }] }),
    });
  });

  await page.goto("http://localhost:4173/");

  await page.setContent(`
    <script type="module" src="http://localhost:4173/src/ui/widget.ts"></script>
    <main>
      <crosstide-chart ticker="AAPL" range="1mo" interval="1d" api-base="http://localhost:4173"></crosstide-chart>
      <crosstide-quote ticker="AAPL" api-base="http://localhost:4173"></crosstide-quote>
      <crosstide-consensus ticker="AAPL" api-base="http://localhost:4173"></crosstide-consensus>
    </main>
  `);

  await page.waitForFunction(() => {
    return (
      customElements.get("crosstide-chart") !== undefined &&
      customElements.get("crosstide-quote") !== undefined &&
      customElements.get("crosstide-consensus") !== undefined
    );
  });

  await expect.poll(() => chartRequests).toBeGreaterThan(0);
  await expect.poll(() => quoteRequests).toBeGreaterThan(0);
  await expect.poll(() => consensusRequests).toBeGreaterThan(0);
});
