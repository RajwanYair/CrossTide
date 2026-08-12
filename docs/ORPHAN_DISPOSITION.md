# Orphan Disposition Record

> Review owner: architecture maintainers · Review date: 11 September 2026
>
> This record classifies hard orphans without deleting them. A disposition becomes
> implementation work only after its consumer and acceptance evidence are agreed.

| Module | Current role | Proposed disposition | Intended consumer | Acceptance evidence | Review date |
|---|---|---|---|---|---|
| `src/cards/error-boundary.ts` | Card failure isolation primitive | MERGE | Shared card mount/router lifecycle | Canonical implementation lives in `src/cards`; UI imports remain compatible and boundary tests pass | 2026-09-11 |
| `src/core/ai-disclaimer.ts` | Financial-analysis limitation text | DEFER | Future accepted AI producer | ADR-0018 records that current result surfaces are deterministic; activation requires consent, disclosure, and UI evidence | 2026-09-11 |
| `src/core/layout-presets.ts` | Persisted dashboard layout definitions | WIRE | Settings card preset controls | Presets round-trip through reload, malformed data is discarded, and blank renames are rejected | 2026-09-11 |
| `src/core/multi-timeframe-panel.ts` | Multi-timeframe analysis composition | DEFER | Product workflow decision for chart analysis | Product-boundary ADR decides whether this becomes a supported chart workflow | 2026-09-11 |
| `src/core/plugin-contracts.ts` | Extension contract types | DEFER | Future versioned plugin package or MCP/widget extension contract | `docs/PACKAGE_CONTRACTS.md` classifies plugin contracts as experimental; promotion requires a versioned consumer and security review | 2026-09-11 |
| `src/core/plugin-integrity.ts` | Extension integrity verification | DEFER | Security threat-model decision | Threat model determines whether a signed plugin boundary is supported | 2026-09-11 |
| `src/core/webauthn.ts` | Optional passkey helpers | DEFER | Account and persistence product decision | Privacy and account model explicitly accepts or rejects passkey support | 2026-09-11 |

## Rules

- `WIRE` requires a real application consumer and a focused unit or browser test.
- `MERGE` requires one canonical implementation, compatibility imports where needed,
  and focused tests for the retained contract.
- `PROMOTE` requires a versioned public contract and an external-consumer fixture.
- `DEFER` requires an owner, review date, and a decision link; it does not authorize
  deletion or public support claims.
