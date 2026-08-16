# Deprecation And Migration Policy

> **Owner:** Repository maintainers · **Applies to:** Worker routes, providers,
> domain indicators, published packages, widgets, and configuration surfaces.

This policy defines how CrossTide retires a supported surface without breaking
consumers without notice. It exists because Worker routes, the `@crosstide/domain`
package, embeddable widgets, and MCP tools each have external consumers who cannot
read commit history to discover a breaking change.

## Scope

A surface is covered by this policy once it is documented as **Shipped** in
[`docs/CAPABILITY_MATRIX.md`](CAPABILITY_MATRIX.md). Preview, fixture-only, and
dormant surfaces (see the matrix) may change or disappear without a deprecation
window, but should still get a CHANGELOG entry.

| Surface | Consumer | Deprecation signal |
|---|---|---|
| Worker route (`worker/routes/*.ts`) | Browser app, widgets, MCP server, external API callers | `Deprecation` + `Sunset` HTTP response headers, `openapi.ts` entry marked `deprecated: true` |
| Provider adapter (`src/providers/*.ts`) | Internal provider chain | ADR recording the replacement chain order; no direct external consumer |
| Domain indicator/calculator (`src/domain/*.ts`) | `@crosstide/domain` package consumers, internal cards | `@deprecated` JSDoc tag (flows into `docs/INDICATORS.md` via `npm run gen:indicator-docs`) |
| Published package export (`packages/*/package.json`) | External npm consumers | SemVer major bump + `CHANGELOG.md` entry under that package |
| Widget custom element / attribute (`src/ui/widget.ts`) | External host pages | `docs-site` widget page notice + console warning on first mount |
| Config surface (`wrangler.toml`, `.env` keys, CLI flags) | Self-hosters, forks | `docs/DEVELOPMENT.md` / `docs/OPERATIONS.md` notice + startup warning where feasible |

## Removal Horizon

| Surface | Minimum notice period | Notes |
|---|---|---|
| Worker route or field | 1 minor release | Routes are free to add fields; removing or renaming a field is breaking |
| Published package API (`@crosstide/domain`) | 1 major version | Follows SemVer; a major bump is itself the notice |
| Widget attribute or custom element | 2 minor releases | External host pages update on their own schedule, not CrossTide's |
| Config key or CLI flag | 1 minor release | Self-hosters need a working config across an upgrade |

"Minor release" and "major version" refer to the CrossTide `package.json` version;
see [`.github/SECURITY.md`](../.github/SECURITY.md) for the currently supported line.

## Process

1. **Mark deprecated in the same change that decides removal.** Add `@deprecated`
   JSDoc, an OpenAPI `deprecated: true` flag, or a widget console warning — whichever
   applies to the surface — pointing at the replacement.
2. **Record it in `CHANGELOG.md`** under a `### Deprecated` heading for that release,
   naming the surface, the reason, and the planned removal release.
3. **Wait out the minimum notice period** in the table above before removing the
   surface. A P0 security fix may remove a surface immediately; document the
   exception in the same CHANGELOG entry.
4. **Remove and record.** The removal release gets a `### Removed` CHANGELOG entry
   linking back to the original deprecation entry.

## Migration Guide Template

Every deprecation notice links a short migration note using this shape:

```markdown
### Deprecated: `<surface name>`

**Why:** <one sentence reason>
**Replacement:** <new surface, or "none">
**Removal:** planned for v<X.Y.0>
**Migration:** <the one or two steps a consumer takes to move off the old surface>
```

## Acceptance Evidence

- Every breaking change merged after this policy exists has a `Deprecated` or
  `Removed` CHANGELOG entry that matches this template.
- `tests/unit/worker/openapi-drift.test.ts` fails if a route is removed from
  `worker/index.ts` while still documented as non-deprecated in `openapi.ts`.
