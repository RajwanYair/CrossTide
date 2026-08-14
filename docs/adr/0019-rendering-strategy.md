# ADR-0019: Hybrid Rendering Strategy

- **Status:** Accepted
- **Date:** 2026-08-12
- **Owner:** Frontend maintainers
- **Related roadmap:** A05, A06, F02

## Context

CrossTide renders a dense, interactive PWA with route cards, forms, tables, and
financial charts. The repository already contains three practical rendering surfaces:
DOM and Web Components for application structure, canvas-based chart rendering through
Lightweight Charts, and hybrid cards that combine both. Replacing the surfaces without
measurement would risk accessibility, interaction, and migration regressions.

## Evidence

| Surface | Current strategy | Primary evidence | Main risk to measure |
|---|---|---|---|
| Route shell and cards | DOM plus Web Components | `src/cards/`, `src/ui/`, card E2E matrix | DOM update cost and lifecycle leaks |
| Data-dense charts | Canvas library inside DOM containers | chart cards and Lightweight Charts integration | canvas resize, input latency, and accessible alternatives |
| Loading and error states | DOM-owned state and text | card loading/error contracts | layout shift and stale state during navigation |

## Options

1. **DOM-first:** render charts and card content as DOM/SVG. Best inspectability and
   accessibility, but higher update cost for dense series.
2. **Canvas-first:** render most surfaces to canvas. Best drawing throughput, but weak
   semantics, text selection, and assistive-technology support.
3. **Hybrid:** keep structure, controls, loading, errors, and accessible summaries in
   DOM/Web Components while using canvas for dense chart pixels.

## Decision

Use the **hybrid strategy** as the canonical rendering boundary. DOM remains the
source of truth for structure, focus, labels, status, and user actions. Canvas remains
an implementation detail for dense visual series and must have a DOM title, summary,
status, and accessible data alternative where the workflow requires inspection.

## Measurement Protocol

Before changing this decision, compare representative watchlist, chart, and heatmap
workflows in a production build at the supported desktop and mobile viewports. Record
LCP, INP, CLS, scripting time, chart update time, memory after route disposal, keyboard
completion, and screen-reader-visible status. A rendering change needs a repeatable
benchmark, an accessibility check, and a migration estimate before adoption.

The repeatable Chromium benchmark is `npm run test:e2e:performance`. It exercises the
three workflows, records LCP, INP, CLS, longest main-thread task, heap memory when the
browser exposes it, route transition time, and serious/critical axe violations. The
cross-profile comparison is `npm run test:e2e:performance:profiles`; it runs serially
on Chromium, mobile Chrome landscape, and Android Galaxy so CPU contention does not
distort the measurements. Each Playwright report attaches
`hybrid-rendering-measurements.json` with the profile name.

## Consequences

- New cards must keep interactive controls and state in DOM/Web Components.
- Chart adapters must expose lifecycle disposal and an accessible summary boundary.
- Performance work should optimize measured hot paths rather than convert surfaces by
  framework preference.
- A future ADR may supersede this decision when benchmark and accessibility evidence
  favors another strategy.
