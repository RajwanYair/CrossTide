# Package And Runtime Contracts

> Owner: architecture maintainers · Review trigger: package export, barrel, widget,
> MCP, or Worker API change.

CrossTide has multiple consumers. This document separates stable public contracts
from application wiring and experimental code so an export is not mistaken for a
supported feature. Actual per-surface version state and bump policy are recorded
in [`docs/API_VERSIONING.md`](API_VERSIONING.md) rather than duplicated here.

## Public Contracts

| Contract | Entry point | Intended consumers | Stability |
|---|---|---|---|
| Application shell | `src/main.ts` | SPA runtime | Runtime entry point; not a library API |
| Domain calculations and types | `packages/domain` and `src/domain/index.ts` | Node, browser, Worker, Web Worker | Package contract; not yet independently versioned (see `docs/API_VERSIONING.md`) |
| Core portable utilities | `src/core/index.ts` exports listed in `package.json` | Application and approved package consumers | Stable only when documented here |
| Card modules | `src/cards/index.ts` | Application card registry and approved integrations | Runtime entry point; card lifecycle is not a stable package API |
| UI utilities | `src/ui/index.ts` | SPA runtime and approved integrations | Runtime entry point; DOM contracts are not stable package APIs |
| Worker HTTP API | `worker/routes/openapi.ts` and `/openapi.json` | Browser, widgets, MCP, external clients | OpenAPI document exists but `info.version` is static; envelope `schemaVersion` is the versioned part |
| Embeddable widgets | `widget.mjs` custom elements | Host pages | Versioned via `WIDGET_CONTRACT_VERSION` / `data-widget-version` |
| MCP tools | `mcp-server/src/tool-manifest.ts` | MCP clients | Tool schema contract; versioned at the server level only |

### Package Export Inventory

The application package intentionally exposes only the following source entry
points:

```text
crosstide        -> ./src/main.ts
crosstide/core   -> ./src/core/index.ts
crosstide/domain -> ./src/domain/index.ts
```

The publishable domain package exposes the runtime-neutral entry points below:

```text
@crosstide/domain         -> ./dist/index.js
@crosstide/domain/browser -> ./dist/browser.js
@crosstide/domain/package.json
```

The `check:public-exports` gate validates this inventory and every declared
target file. Adding or removing an entry requires updating this table and its
consumer example in the same change.

## Runtime-Only Exports

These modules support the CrossTide application and are not automatically public
because they are reachable from a barrel:

- Card mount and route lifecycle implementations under `src/cards/`.
- UI router, theme, toast, modal, and DOM delegation modules under `src/ui/`.
- Provider adapters and environment-specific fetch configuration.
- Worker route handlers, bindings, and deployment-specific middleware.
- Internal test fixtures, preview data, and generated artifacts.

Runtime-only code may be refactored freely when its application contract and tests
remain intact. External consumers must use an explicitly documented entry point.

## Experimental Contracts

The following require a separate acceptance decision before public support claims:

- Plugin contracts and integrity verification.
- WebAuthn and authenticated user account flows.
- Multi-timeframe and advanced research panels without a supported card route.
- ONNX, WebLLM, WASM, and other optional acceleration or local-model paths.

Experimental code remains in the repository while it is evaluated. Its presence is
not evidence of compatibility, security review, or product support.

## Contract Rules

1. Every public contract has an owner, versioning policy, example consumer, and
   focused contract test.
2. Every breaking change has a migration note and deprecation horizon.
3. Generated OpenAPI and API types are regenerated in the same change.
4. Barrel reachability is inventory evidence, not a public-support declaration.
