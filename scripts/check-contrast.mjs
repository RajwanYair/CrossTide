/**
 * Color contrast validation script.
 *
 * Checks that CSS design token pairs (foreground/background) meet WCAG 2.1 AA
 * contrast requirements (4.5:1 for normal text, 3:1 for large text / UI).
 *
 * Run: node scripts/check-contrast.mjs
 * Exits with code 1 if any pair fails.
 */

// WCAG relative luminance formula
function sRGBtoLinear(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(r, g, b) {
  return 0.2126 * sRGBtoLinear(r) + 0.7152 * sRGBtoLinear(g) + 0.0722 * sRGBtoLinear(b);
}

function contrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// Design token pairs to validate: [foreground, background, minRatio, description]
const TOKEN_PAIRS = [
  // Dark theme (default) — text on #0d1117
  ["#e6edf3", "#0d1117", 4.5, "text-primary on bg-app (dark)"],
  ["#8b949e", "#0d1117", 4.5, "text-secondary on bg-app (dark)"],
  ["#8b949e", "#161b22", 4.5, "text-secondary on bg-card (dark)"],
  ["#e6edf3", "#161b22", 4.5, "text-primary on bg-card (dark)"],

  // Light theme — text on #f6f8fa / #fff
  ["#1f2328", "#ffffff", 4.5, "text-primary on white (light)"],
  ["#656d76", "#ffffff", 4.5, "text-secondary on white (light)"],
  ["#1f2328", "#f6f8fa", 4.5, "text-primary on bg-app (light)"],

  // Signal colors on dark background
  ["#3fb950", "#0d1117", 3.0, "signal-buy on bg-app (dark, UI)"],
  ["#3fb950", "#161b22", 3.0, "signal-buy on bg-card (dark, UI)"],
  ["#f85149", "#0d1117", 3.0, "signal-sell on bg-app (dark, UI)"],
  ["#f85149", "#161b22", 3.0, "signal-sell on bg-card (dark, UI)"],

  // Signal colors on light background
  ["#1a7f37", "#ffffff", 3.0, "signal-buy on white (light, UI)"],
  ["#cf222e", "#ffffff", 3.0, "signal-sell on white (light, UI)"],

  // Accent colors
  ["#58a6ff", "#0d1117", 3.0, "accent on bg-app (dark, UI)"],
  ["#0969da", "#ffffff", 3.0, "accent on white (light, UI)"],
];

let failures = 0;

for (const [fg, bg, minRatio, desc] of TOKEN_PAIRS) {
  const [fgR, fgG, fgB] = hexToRgb(fg);
  const [bgR, bgG, bgB] = hexToRgb(bg);
  const fgL = luminance(fgR, fgG, fgB);
  const bgL = luminance(bgR, bgG, bgB);
  const ratio = contrastRatio(fgL, bgL);

  if (ratio < minRatio) {
    console.error(`✗ FAIL: ${desc} — ${fg} on ${bg} = ${ratio.toFixed(2)}:1 (need ${minRatio}:1)`);
    failures++;
  } else {
    console.log(`✓ PASS: ${desc} — ${ratio.toFixed(2)}:1 ≥ ${minRatio}:1`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} color contrast failure(s). Fix token values.`);
  process.exit(1);
} else {
  console.log(`\nAll ${TOKEN_PAIRS.length} color pairs pass WCAG AA contrast requirements.`);
}
