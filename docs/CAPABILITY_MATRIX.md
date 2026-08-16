# CrossTide Capability Matrix

> Canonical support classification for public documentation. Update this file when
> a route, package, provider, or deployment mode changes. The registry and generated
> checks remain authoritative for counts.

| Surface | Classification | Evidence | Customer-facing limitation |
|---|---|---|---|
| Registered route cards | Shipped | `src/cards/registry.ts` and card E2E matrix | Individual providers may still return stale or unavailable data |
| Technical indicator calculators | Package-only | `src/domain/index.ts` and `packages/domain` | Not every calculator has a first-class card |
| Quote, chart, search, and fundamentals Worker routes | Shipped | Worker route tests and OpenAPI contract | Requires a configured Worker for production data |
| Heatmap across all asset classes | Preview | Heatmap card and provider coverage tests | Coverage and freshness vary by asset class |
| Cloudflare KV, D1, R2, and Durable Objects deployment | Blocked | `worker/wrangler.toml` contains environment placeholders | Forks must provision their own resources |
| Local fixture mode | Shipped | Preview fixtures and local development scripts | Fixtures are not live market data |
| `@crosstide/domain` publication | Blocked | Package build exists; publication credentials are unavailable | Consumers cannot install a verified registry release yet |
| MCP server | Preview | `mcp-server/README.md` and MCP tool manifest | Public Worker endpoint and production authorization are not verified |
| Offline PWA shell and cached workflows | Shipped | Service worker and browser tests | Live provider requests remain unavailable offline |
| External-user usability evidence | Blocked | Recruitment/consent/session protocol defined in [`docs/USER_FEEDBACK_PLAN.md`](USER_FEEDBACK_PLAN.md); no round has run yet | Product claims remain maintainer-verified until testing occurs |

## Hosting Modes

| Hosting mode | Classification | Verified capability | Boundary |
|---|---|---|---|
| Local Vite development | Shipped | `npm run dev` serves the PWA with fixture data and configurable Worker routing | The development server is not a production API or uptime guarantee |
| GitHub Pages static hosting | Preview | Static shell, service worker, and client routes can be published by the Pages workflow | Live market-data requests require an allowed Worker endpoint; Pages alone is not a data backend |
| Docker self-hosting | Preview | `Dockerfile`, `docker-compose.yml`, local KV/D1 bindings, persistence volume, and `/api/health` check are provided | Clean-machine Docker build, persistence, and shutdown evidence is still pending on a Docker-capable host |
| Cloudflare Worker + Pages | Blocked | Production deployment configuration, OpenAPI routes, KV/D1 bindings, and smoke workflow exist | Target KV/D1 resources, credentials, migrations, and production smoke evidence are required |

### Fork Portability Boundaries

| Mode | Frontend shell | Worker API | Durable persistence | Live provider data | External account required |
|---|---|---|---|---|---|
| Local Vite development | Yes | Optional local Worker or configured endpoint | No guarantee | Only through the configured Worker/provider chain | No |
| Docker self-hosting | Yes | Local Wrangler Worker | Local D1/KV volume | Only through configured provider paths | No |
| GitHub Pages | Yes | No; static hosting only | No | Requires an allowed external Worker endpoint | GitHub repository/workflow only |
| Cloudflare Worker + Pages | Yes | Yes | Cloudflare KV/D1/DO resources | Yes, subject to configured provider secrets and upstream availability | Cloudflare account and bindings |

Forks may choose any mode, but must not describe a static Pages deployment as a live
data backend or expose provider credentials in browser configuration. A fork changing
the Worker endpoint, persistence layer, or provider chain must update this matrix and
the relevant environment example before release.

## Classification Rules

- **Shipped** means the route or consumer is reachable, documented, tested, and has
  designed failure states in its supported environment.
- **Preview** means a usable path exists, but compatibility, production, or external
  validation is incomplete.
- **Fixture-only** means behavior is demonstrated only with deterministic local data.
- **Package-only** means a contract is exported for consumers but is not a first-class
  application workflow.
- **Dormant** means code exists without an approved supported consumer; it is not a
  deletion instruction.
- **Blocked** means an external dependency, credential, or decision prevents support.
