# API And Contract Versioning Policy

> **Owner:** Architecture maintainers · **Related:** [`docs/PACKAGE_CONTRACTS.md`](PACKAGE_CONTRACTS.md),
> [`docs/DEPRECATION_POLICY.md`](DEPRECATION_POLICY.md)

`docs/PACKAGE_CONTRACTS.md` labels several surfaces "versioned contract" without
defining what that means in practice. This document is that definition — it
records the current, real versioning state of each public surface (not an
aspirational one) and the policy each surface follows going forward. It closes
roadmap item E01.

## Current State Per Surface

| Surface | Current version source | Independently versioned today? |
|---|---|---|
| OpenAPI spec (`worker/routes/openapi.ts`) | Static `info.version: "1.0.0"`, never bumped | **No** — has not moved since the spec was written |
| Worker response envelopes (`createMarketDataEnvelope`) | `schemaVersion: "1"` constant in the envelope type | **Partially** — the envelope itself is versioned, the OpenAPI document describing it is not |
| MCP tools (`mcp-server/src/tool-manifest.ts`) | `mcp-server/package.json` → `"version": "0.1.0"` | **Yes**, but no per-tool version field exists — a client can only tell "the whole server changed," not which tool |
| Embeddable widgets (`src/ui/widget.ts`) | `WIDGET_CONTRACT_VERSION = "1.0.0"`, exposed as `.version` and `data-widget-version` | **Yes** (added in this pass — see `CHANGELOG.md`) |
| `@crosstide/domain` package | `packages/domain/package.json` → `"version"` | **No** — this file is not in the version-bump location table in `.github/skills/release/SKILL.md`, so it has never been bumped independently of a copy-paste at package creation time |

The domain package row is the most significant finding here: `docs/PACKAGE_CONTRACTS.md`
calls it a "versioned package contract," but nothing in the release process
actually versions it. Until E02 (npm publish) is unblocked this has no external
consequence, but the claim should not be repeated as verified until the release
skill bumps it.

## Policy Going Forward

Each surface follows plain SemVer, scoped to what actually changed:

1. **OpenAPI spec** — bump `info.version` on any additive route/field (minor) or
   breaking change (major). A route or field removal follows
   `docs/DEPRECATION_POLICY.md` first.
2. **Worker envelope `schemaVersion`** — bump only on a breaking envelope shape
   change (field removal or type change), not on new optional fields. Every
   consumer (`src/core/api-types.ts`, MCP tools, widgets) must be updated in the
   same change as a `schemaVersion` bump.
3. **MCP tools** — the server version in `mcp-server/package.json` covers the
   whole tool set for now. A per-tool version field is deferred until a second
   MCP client actually needs to detect single-tool drift (see
   `tests/unit/mcp/tool-manifest.test.ts` for the schema-drift guard that
   currently substitutes for this).
4. **Widgets** — `WIDGET_CONTRACT_VERSION` bumps on any attribute add/rename/remove,
   per `docs/DEPRECATION_POLICY.md`'s two-minor-release widget notice window.
5. **`@crosstide/domain`** — once E02 (npm publish) is unblocked, this package
   moves to independent SemVer versioning, separate from the app's `package.json`
   version. Until then, the action item below prevents further silent drift.

## Action Item Tracked Here

Add a row for `packages/domain/package.json` to the version-bump location table
in `.github/skills/release/SKILL.md` **only once the package is actually
published** (E02) — bumping it before publication with no consumer would be
churn with no observable benefit. Tracking the decision here instead of
silently leaving the file stale is the point of this policy.

## Acceptance Evidence

- This document is linked from `docs/OWNERSHIP.md` and `docs/PACKAGE_CONTRACTS.md`.
- Any change to `worker/routes/openapi.ts`'s `info.version`, `schemaVersion`, or
  `WIDGET_CONTRACT_VERSION` is reviewed against the bump rules above in the same
  pull request that changes the underlying contract.
