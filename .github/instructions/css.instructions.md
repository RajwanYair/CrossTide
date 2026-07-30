---
applyTo: "src/styles/**,src/**/*.css"
description: "Use when: editing any CSS or style file in the project."
---

# 🎨 CSS Conventions — CrossTide

## 🧱 Layer Order

The cascade order is declared once, at the top of `src/styles/tokens.css`:

```css
@layer tokens, themes, base, layout, components, a11y;
```

A layer not named there sorts **after** all named layers (`responsive.css` uses
`layout-responsive`, which is why its overrides win). New rules must go into an
existing layer — never add rules outside a `@layer` block, and do not invent a
new layer name without adding it to the declaration.

### 📎 Which stylesheets ship

`index.html` is the only place a stylesheet is registered, and
`tests/unit/a11y-audit.test.ts` fails if any file in `src/styles/` is not listed
there. Adding a `.css` file without linking it is therefore a test failure, not a
silent no-op — this guard exists because `a11y.css` was orphaned for several
releases while `.skip-link`, `.sr-only` and `.btn-icon` shipped unstyled.

## 🎛️ Custom Properties

- **All colors** via CSS custom properties defined in `src/styles/tokens.css`. Never hardcode hex, `rgb()`, or `hsl()` values inline.
- **All spacing** via `--space-*` scale. Never hardcode `px` values for margins/padding unless it is a single-pixel border.
- **All radii** via `--radius-*` tokens.
- Theme variants use `[data-theme="dark"]` / `[data-theme="light"]` selectors inside the `tokens` layer.

## 🪆 Nesting

- Use native CSS nesting with `&`. Do NOT use preprocessor syntax or PostCSS nesting.
- Maximum 3 levels of nesting. Flatten deeper structures.

```css
.card {
  padding: var(--space-4);
  & .card__title {
    font-weight: 700;
  }
  &:hover {
    box-shadow: var(--shadow-md);
  }
}
```

## 🔭 CSS @scope

Use `@scope` for card-level style isolation to prevent styles bleeding between route cards:

```css
@scope ([data-card="chart"]) {
  .toolbar {
    display: flex;
    gap: var(--space-2);
  }
  .legend-item {
    border-radius: var(--radius-full);
  }
}
```

All card-scoped rules must be wrapped in a `@scope` block. Do not use bare `[data-card]` attribute selectors outside `@scope`.

## 🔤 Typography

- Font stack: `"Inter", system-ui, sans-serif` for UI; `"JetBrains Mono", monospace` for code/numbers.
- Never use `font-size` in `px` inside components — use `rem` or `em`.
- All font-weight values must use numeric keywords (`400`, `600`, `700`), not named keywords.

## 📱 Responsive Breakpoints

- Mobile-first media queries: `min-width: 480px` (small), `min-width: 768px` (tablet), `min-width: 1024px` (desktop).
- All responsive overrides go in the `utilities` layer or in a `@media` block inside the relevant component rule.

## 🎬 Animation

- Use `prefers-reduced-motion` media query to disable animations:

  ```css
  @media (prefers-reduced-motion: reduce) {
    .animated-element {
      animation: none;
      transition: none;
    }
  }
  ```

- Only `transform` and `opacity` are safe to animate on the GPU (avoid animating `width`, `height`, `top`, `left`).

## 🚫 No `!important`

Never use `!important`. If overrides are needed, increase specificity via nesting or restructure the layer order.

## 📈 LWC Charts

LWC v5 chart components (`<lwc-chart>`) use shadow DOM — pierce with `::part()` pseudo-elements, not `:deep()` or `/deep/`.

## 🧹 Stylelint

`npm run lint:css` must exit 0 with 0 errors and 0 warnings. No inline `/* stylelint-disable */` comments.

`comment-empty-line-before` fires on a comment placed directly above a rule with
no blank line. Fold the explanation into the existing `/* ── Section ── */` header
rather than adding a second comment block.

## ♿ Contrast & Target Size (WCAG 2.2 AA)

`tests/e2e/wcag-audit.spec.ts` runs axe across all 23 routes and fails on any
serious/critical violation. It is the authority — the README badge claims **AA**,
not AAA.

- Text needs **≥ 4.5:1** against its *computed* background. A translucent
  foreground blends with the surface and loses contrast, so keep label colors
  fully opaque on colored tiles.
- Interactive targets need **≥ 24×24 CSS px**. `<summary>` lays out at line-height
  only and needs an explicit `min-height`.
- **Never hardcode a hex for signal colors.** `--signal-buy` / `--signal-sell` /
  `--signal-neutral` are swapped by the color-blind palettes, so a hardcoded
  foreground silently breaks under a palette change. Blend the signal color away
  from the surface instead:

  ```css
  .badge-buy {
    background: color-mix(in sRGB, var(--signal-buy) 20%, transparent);
    color: color-mix(in sRGB, var(--signal-buy), var(--badge-fg-blend) var(--badge-fg-blend-amt));
  }
  ```

  `--badge-fg-blend` is `#fff`/30% in dark and `#000`/35% in light.

After changing any color token or tile background, re-run
`./node_modules/.bin/playwright test tests/e2e/wcag-audit.spec.ts --project=chromium`.
