---
applyTo: "src/styles/**,src/**/*.css"
description: "Use when: editing any CSS or style file in the project."
---

# CSS Conventions — CrossTide

## Layer Order

CSS is organized with `@layer` in this strict order:

```text
reset → tokens → base → layout → components → cards → utilities → overrides
```

New rules must go into the appropriate layer. Never add rules outside a `@layer` block.

## Custom Properties

- **All colors** via CSS custom properties defined in `src/styles/tokens.css`. Never hardcode hex, `rgb()`, or `hsl()` values inline.
- **All spacing** via `--space-*` scale. Never hardcode `px` values for margins/padding unless it is a single-pixel border.
- **All radii** via `--radius-*` tokens.
- Theme variants use `[data-theme="dark"]` / `[data-theme="light"]` selectors inside the `tokens` layer.

## Nesting

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

## CSS @scope

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

## Typography

- Font stack: `"Inter", system-ui, sans-serif` for UI; `"JetBrains Mono", monospace` for code/numbers.
- Never use `font-size` in `px` inside components — use `rem` or `em`.
- All font-weight values must use numeric keywords (`400`, `600`, `700`), not named keywords.

## Responsive Breakpoints

- Mobile-first media queries: `min-width: 480px` (small), `min-width: 768px` (tablet), `min-width: 1024px` (desktop).
- All responsive overrides go in the `utilities` layer or in a `@media` block inside the relevant component rule.

## Animation

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

## No `!important`

Never use `!important`. If overrides are needed, increase specificity via nesting or restructure the layer order.

## LWC Charts

LWC v5 chart components (`<lwc-chart>`) use shadow DOM — pierce with `::part()` pseudo-elements, not `:deep()` or `/deep/`.

## Stylelint

`npm run lint:css` must exit 0 with 0 errors and 0 warnings. No inline `/* stylelint-disable */` comments.
