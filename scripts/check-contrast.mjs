/**
 * Color contrast validation for the design tokens.
 *
 * Reads the token values out of `src/styles/tokens.css` and `src/styles/a11y.css`
 * and checks every foreground/background combination a theme can actually
 * produce against its WCAG threshold.
 *
 * This script used to carry its own hardcoded copy of the palette, which meant
 * it validated a list that had drifted from the stylesheet: `--text-muted` was
 * absent from that list entirely, and the light theme shipped it at 2.88:1.
 * Parse the real tokens instead — a token that is in the CSS cannot be skipped.
 *
 * Run: node scripts/check-contrast.mjs
 * Exits 1 if any pair fails.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postcss from "postcss";

const ROOT = process.cwd();

/** Foreground tokens that render body text — WCAG 1.4.3 wants 4.5:1. */
const TEXT_TOKENS = ["--text-primary", "--text-secondary", "--text-muted"];

/**
 * Signal colors. These read as text (`.btn-danger`, change columns, verdict
 * labels), so they are held to the 4.5:1 text threshold rather than the 3:1
 * non-text one — axe caught `--danger` rendering at 3.04:1 as button text.
 */
const SIGNAL_TOKENS = ["--signal-buy", "--signal-sell", "--signal-neutral", "--danger"];

/** Icons, borders and other non-text UI — WCAG 1.4.11 wants 3:1. */
const UI_TOKENS = ["--accent", "--accent-hover", "--border-focus"];

/** Surfaces any of the above can sit on. */
const SURFACE_TOKENS = ["--bg-app", "--bg-card", "--bg-card-hover", "--bg-input"];

function sRGBtoLinear(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]) {
  return 0.2126 * sRGBtoLinear(r) + 0.7152 * sRGBtoLinear(g) + 0.0722 * sRGBtoLinear(b);
}

function contrastRatio(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Accepts #rgb and #rrggbb. Returns null for var(), color-mix() and keywords. */
function hexToRgb(value) {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (match === null) return null;
  const digits = match[1];
  const full =
    digits.length === 3
      ? `${digits[0]}${digits[0]}${digits[1]}${digits[1]}${digits[2]}${digits[2]}`
      : digits;
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}

/** Collects custom-property declarations from every rule with this exact selector. */
function tokensForSelector(css, selector) {
  const found = {};
  postcss.parse(css).walkRules((rule) => {
    if (rule.selector.trim() !== selector) return;
    for (const node of rule.nodes ?? []) {
      if (node.type === "decl" && node.prop.startsWith("--")) found[node.prop] = node.value;
    }
  });
  return found;
}

const tokensCss = readFileSync(resolve(ROOT, "src/styles/tokens.css"), "utf8");
const a11yCss = readFileSync(resolve(ROOT, "src/styles/a11y.css"), "utf8");

const dark = tokensForSelector(tokensCss, ":root");
const light = { ...dark, ...tokensForSelector(tokensCss, '[data-theme="light"]') };
const darkAaa = { ...dark, ...tokensForSelector(a11yCss, '[data-contrast="aaa"]') };
const lightAaa = {
  ...light,
  ...tokensForSelector(a11yCss, '[data-theme="light"][data-contrast="aaa"]'),
};

/** AAA (1.4.6) raises normal text to 7:1; non-text stays at 3:1. */
const THEMES = [
  { name: "dark", tokens: dark, textMin: 4.5 },
  { name: "light", tokens: light, textMin: 4.5 },
  { name: "dark+aaa", tokens: darkAaa, textMin: 7 },
  { name: "light+aaa", tokens: lightAaa, textMin: 7 },
];

let failures = 0;
let checked = 0;
let skipped = 0;

for (const { name, tokens, textMin } of THEMES) {
  const groups = [
    { foregrounds: TEXT_TOKENS, min: textMin },
    { foregrounds: SIGNAL_TOKENS, min: 4.5 },
    { foregrounds: UI_TOKENS, min: 3 },
  ];

  for (const { foregrounds, min } of groups) {
    for (const fgToken of foregrounds) {
      const fg = hexToRgb(tokens[fgToken] ?? "");
      if (fg === null) {
        skipped++;
        continue;
      }

      for (const bgToken of SURFACE_TOKENS) {
        const bg = hexToRgb(tokens[bgToken] ?? "");
        if (bg === null) {
          skipped++;
          continue;
        }

        checked++;
        const ratio = contrastRatio(fg, bg);
        if (ratio < min) {
          console.error(
            `FAIL ${name}: ${fgToken} (${tokens[fgToken]}) on ${bgToken} (${tokens[bgToken]}) = ${ratio.toFixed(2)}:1, need ${min}:1`,
          );
          failures++;
        }
      }
    }
  }
}

if (skipped > 0) {
  console.log(`Skipped ${skipped} pair(s) whose token is not a literal hex value.`);
}

if (failures > 0) {
  console.error(
    `\n${failures} of ${checked} token pairs fail WCAG contrast. Fix the token values.`,
  );
  process.exit(1);
}

console.log(`All ${checked} token pairs across ${THEMES.length} themes pass WCAG contrast.`);
