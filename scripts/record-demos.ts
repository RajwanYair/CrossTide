/**
 * Automated demo GIF recording via Playwright.
 *
 * Records 6 demo scenarios against the dev server and outputs
 * animated GIFs to docs/demos/. Requires:
 *   - `npm run dev` running on :5173
 *   - Playwright browsers installed (`npx playwright install chromium`)
 *   - ffmpeg on PATH (for mp4→gif conversion)
 *
 * Usage:
 *   npx tsx scripts/record-demos.ts          # record all
 *   npx tsx scripts/record-demos.ts consensus # record one
 */

import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5173";
const OUT_DIR = resolve(import.meta.dirname ?? ".", "../docs/demos");
const VIEWPORT = { width: 1280, height: 720 };

interface DemoScenario {
  readonly name: string;
  readonly description: string;
  readonly steps: (
    page: Awaited<ReturnType<typeof chromium.launch>>["contexts"][0]["pages"][0],
  ) => Promise<void>;
  readonly durationMs: number;
}

const scenarios: DemoScenario[] = [
  {
    name: "consensus",
    description: "12-method consensus signal engine",
    durationMs: 8_000,
    steps: async (page) => {
      await page.goto(`${BASE_URL}/#/consensus`);
      await page.waitForSelector("[data-card='consensus']", { timeout: 5_000 }).catch(() => {});
      await page.fill("input[aria-label='Ticker']", "AAPL");
      await page.press("input[aria-label='Ticker']", "Enter");
      await page.waitForTimeout(3_000);
    },
  },
  {
    name: "chart",
    description: "Candlestick chart with overlay indicators",
    durationMs: 10_000,
    steps: async (page) => {
      await page.goto(`${BASE_URL}/#/chart`);
      await page.waitForSelector("canvas", { timeout: 5_000 }).catch(() => {});
      await page.waitForTimeout(2_000);
      // Hover over chart to show crosshair
      const canvas = page.locator("canvas").first();
      const box = await canvas.boundingBox();
      if (box) {
        for (let x = box.x + 100; x < box.x + box.width - 100; x += 30) {
          await page.mouse.move(x, box.y + box.height / 2);
          await page.waitForTimeout(100);
        }
      }
    },
  },
  {
    name: "bar-replay",
    description: "Historical bar replay playback",
    durationMs: 12_000,
    steps: async (page) => {
      await page.goto(`${BASE_URL}/#/chart`);
      await page.waitForSelector("canvas", { timeout: 5_000 }).catch(() => {});
      await page.waitForTimeout(2_000);
      // Click replay button if available
      const replayBtn = page.locator("button:has-text('Replay'), [data-action='bar-replay']");
      if (await replayBtn.count()) {
        await replayBtn.first().click();
        await page.waitForTimeout(5_000);
      }
    },
  },
  {
    name: "screener",
    description: "10K-ticker screener with filtering",
    durationMs: 8_000,
    steps: async (page) => {
      await page.goto(`${BASE_URL}/#/screener`);
      await page.waitForSelector("[data-card='screener']", { timeout: 5_000 }).catch(() => {});
      await page.waitForTimeout(2_000);
      // Scroll through the virtual list
      const table = page.locator("[data-virtual-scroller], table").first();
      if (await table.count()) {
        await table.evaluate((el) => {
          el.scrollTop = 500;
        });
        await page.waitForTimeout(1_000);
        await table.evaluate((el) => {
          el.scrollTop = 1500;
        });
        await page.waitForTimeout(1_000);
      }
    },
  },
  {
    name: "signal-dsl",
    description: "Signal DSL with plot() output",
    durationMs: 8_000,
    steps: async (page) => {
      await page.goto(`${BASE_URL}/#/signal-dsl`);
      await page.waitForTimeout(2_000);
      // Type a DSL expression
      const editor = page.locator("textarea, [contenteditable], input[type='text']").first();
      if (await editor.count()) {
        await editor.fill("close > sma(close, 20) and rsi > 50");
        await page.waitForTimeout(2_000);
      }
    },
  },
  {
    name: "macro-dashboard",
    description: "FRED macro economic overlay",
    durationMs: 8_000,
    steps: async (page) => {
      await page.goto(`${BASE_URL}/#/macro`);
      await page.waitForSelector("[data-card='macro']", { timeout: 5_000 }).catch(() => {});
      await page.waitForTimeout(3_000);
    },
  },
];

function mp4ToGif(mp4Path: string, gifPath: string): void {
  // Two-pass: generate palette then use it for high-quality GIF
  const palette = mp4Path.replace(".mp4", "-palette.png");
  execSync(
    `ffmpeg -y -i "${mp4Path}" -vf "fps=10,scale=800:-1:flags=lanczos,palettegen" "${palette}"`,
    { stdio: "pipe" },
  );
  execSync(
    `ffmpeg -y -i "${mp4Path}" -i "${palette}" -lavfi "fps=10,scale=800:-1:flags=lanczos [x]; [x][1:v] paletteuse" "${gifPath}"`,
    { stdio: "pipe" },
  );
  // Cleanup palette
  try {
    execSync(`${process.platform === "win32" ? "del" : "rm"} "${palette}"`, { stdio: "pipe" });
  } catch {
    /* ignore */
  }
}

async function recordScenario(scenario: DemoScenario): Promise<void> {
  console.log(`\n▶ Recording: ${scenario.name} — ${scenario.description}`);
  const mp4Path = resolve(OUT_DIR, `${scenario.name}.mp4`);
  const gifPath = resolve(OUT_DIR, `${scenario.name}.gif`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: OUT_DIR, size: VIEWPORT },
    colorScheme: "dark",
  });
  const page = await context.newPage();

  try {
    await scenario.steps(page);
    await page.waitForTimeout(1_000); // Final pause
  } finally {
    await page.close();
    const video = page.video();
    if (video) {
      const savedPath = await video.path();
      // Rename video to expected name
      execSync(`${process.platform === "win32" ? "move" : "mv"} "${savedPath}" "${mp4Path}"`, {
        stdio: "pipe",
      });
    }
    await context.close();
    await browser.close();
  }

  // Convert to GIF if ffmpeg is available
  try {
    mp4ToGif(mp4Path, gifPath);
    console.log(`  ✔ ${gifPath}`);
  } catch {
    console.log(`  ⚠ ffmpeg not found — mp4 saved at ${mp4Path}`);
    console.log("    Install ffmpeg to auto-convert to GIF.");
  }
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });

  const filter = process.argv[2];
  const toRecord = filter ? scenarios.filter((s) => s.name === filter) : scenarios;

  if (toRecord.length === 0) {
    console.error(
      `Unknown scenario: "${filter}". Available: ${scenarios.map((s) => s.name).join(", ")}`,
    );
    process.exit(1);
  }

  console.log(`Recording ${toRecord.length} demo(s) to ${OUT_DIR}`);

  for (const scenario of toRecord) {
    await recordScenario(scenario);
  }

  console.log("\n✔ All demos recorded.");
  if (!existsSync(resolve(OUT_DIR, "consensus.gif"))) {
    console.log("\n⚠ GIF files were not created. Install ffmpeg for mp4→gif conversion.");
    console.log("  Alternatively, use https://ezgif.com to convert the .mp4 files manually.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
