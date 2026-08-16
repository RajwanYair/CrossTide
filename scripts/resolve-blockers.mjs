/**
 * Interactive resolver for CrossTide's external blockers.
 *
 * Walks every credential, cloud-provisioning, and CI-secret gap recorded in
 * `docs/ROADMAP.md` ("External Blockers") and `docs/OPERATIONS.md`
 * ("Verification Snapshot"), checks its current status with read-only
 * commands, and — only with explicit confirmation — runs the official CLI
 * (wrangler / npm / gh / flyctl) to resolve it.
 *
 * This script never reads, stores, generates, or transmits a secret itself.
 * Every credential-entering step spawns the vendor's own CLI with the
 * terminal's stdio inherited, so login prompts, browser OAuth flows, and
 * `gh secret set` input happen directly between you and that CLI — this
 * script only decides which command to run and where to write the
 * non-secret IDs (KV/D1/R2 resource IDs) that command prints back.
 *
 * Items with no CLI-automatable fix (recruiting real users, publishing a
 * live public demo, a data source that does not exist yet) are reported as
 * "Manual — not automatable" with a pointer to the doc that owns the decision.
 *
 * Run: npm run resolve-blockers
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";

const ROOT = resolve(import.meta.dirname, "..");
const WRANGLER_TOML = resolve(ROOT, "worker/wrangler.toml");
// The repo root `wrangler.toml` is a Pages project (static-site deploy); the
// actual Worker — with the KV/D1/R2 bindings and secrets these checks target
// — is configured by worker/wrangler.toml. Every wrangler invocation below
// must run from `worker/`, or wrangler silently resolves the wrong project
// and commands like `secret list`/`secret put` fail with a "Workers-specific
// command in a Pages project" error.
const WORKER_DIR = resolve(ROOT, "worker");
const isWin = process.platform === "win32";

// Windows requires shell interpretation to execute .cmd shims (wrangler.cmd,
// npm.cmd, gh's PATHEXT resolution). Every argument passed through this
// script is a static, hardcoded string (never user input), so the DEP0190
// "unescaped args" warning does not apply to our usage — silence it rather
// than let it interleave with interactive CLI output below.
process.noDeprecation = true;

const rl = createInterface({ input: process.stdin, output: process.stdout });

async function ask(question) {
  const answer = await rl.question(question);
  return answer.trim();
}

async function confirm(question) {
  const answer = await ask(`${question} [y/N] `);
  return /^y(es)?$/iu.test(answer);
}

/** Local wrangler binary — never invoked via npx (see docs/OPERATIONS.md). */
function wranglerBin() {
  return join(ROOT, "node_modules", ".bin", isWin ? "wrangler.cmd" : "wrangler");
}

/** Run a command and capture output without letting it touch the terminal. */
function capture(cmd, args, { cwd = ROOT } = {}) {
  const result = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    shell: isWin,
    // Cloudflare/GitHub CLIs can be slow behind a proxy — generous but finite,
    // so a genuinely hung process (e.g. an unexpected credential prompt) still
    // releases the terminal instead of blocking this script forever.
    timeout: 60_000,
  });
  return {
    ok: result.status === 0,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    missing: result.error?.code === "ENOENT",
  };
}

/**
 * Run a command with the terminal handed over to it. Used for every step
 * that needs interactive input (OAuth login, secret paste, 2FA) — this
 * script never reads that input itself.
 */
function runInteractive(cmd, args, { cwd = ROOT } = {}) {
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    shell: isWin,
  });
  return result.status === 0;
}

/** Read-only wrangler invocation, always scoped to the Worker project. */
function wrangler(args) {
  return capture(wranglerBin(), args, { cwd: WORKER_DIR });
}

/** Interactive wrangler invocation, always scoped to the Worker project. */
function wranglerInteractive(args) {
  return runInteractive(wranglerBin(), args, { cwd: WORKER_DIR });
}

function toolAvailable(cmd) {
  return !capture(cmd, ["--version"]).missing;
}

/**
 * Pull the most useful single line out of a failed command's output instead
 * of guessing a cause. CLIs like wrangler print the real reason (account
 * feature not enabled, expired token, rate limit) on an `[ERROR]` line —
 * surfacing it beats a blanket "(not authenticated?)" that is wrong as often
 * as it is right.
 */
function firstErrorLine(res) {
  const lines = `${res.stderr}\n${res.stdout}`
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const errorLine = lines.find((l) => /error/iu.test(l));
  return errorLine ?? lines.at(-1) ?? "command failed with no output";
}

function patchWranglerToml(replacements) {
  let content = readFileSync(WRANGLER_TOML, "utf8");
  for (const [placeholder, value] of Object.entries(replacements)) {
    content = content.replaceAll(placeholder, value);
  }
  writeFileSync(WRANGLER_TOML, content);
}

/** Pull the first `key = "value"` match out of wrangler's create-command output. */
function extractField(output, key) {
  const match = new RegExp(`${key}\\s*=\\s*"([^"]+)"`, "u").exec(output);
  return match?.[1];
}

// ── Blocker definitions ──────────────────────────────────────────────────────
//
// Each blocker's `check()` is read-only. `resolve()` only runs after an
// explicit confirmation and only invokes the official CLI for that surface.

const blockers = [
  {
    id: "cf-auth",
    title: "Cloudflare Wrangler authentication",
    roadmap: "P01–P03, D01, E01",
    check() {
      const res = wrangler(["whoami"]);
      if (res.missing) return { ok: false, detail: "wrangler is not installed in node_modules" };
      const ok = res.ok && /logged in/iu.test(res.stdout);
      // Never echo the full `whoami` output — it includes the account email,
      // account ID, and full token scope list.
      return {
        ok,
        detail: ok
          ? "Authenticated (run `wrangler whoami` directly for account details)"
          : "Not authenticated",
      };
    },
    async resolve() {
      console.log("Opening `wrangler login` — this opens your browser for Cloudflare OAuth.");
      if (!(await confirm("Continue?"))) return false;
      return wranglerInteractive(["login"]);
    },
  },
  {
    id: "cf-kv",
    title: "Cloudflare KV namespace (QUOTE_CACHE)",
    roadmap: "P01",
    check() {
      const toml = readFileSync(WRANGLER_TOML, "utf8");
      const placeholder = toml.includes("PLACEHOLDER_KV_NAMESPACE_ID");
      return {
        ok: !placeholder,
        detail: placeholder ? "worker/wrangler.toml still has a placeholder ID" : "Provisioned",
      };
    },
    async resolve() {
      console.log("This creates two real Cloudflare KV namespaces (production + preview).");
      if (!(await confirm("Create QUOTE_CACHE KV namespaces now?"))) return false;
      const prod = wrangler(["kv", "namespace", "create", "QUOTE_CACHE"]);
      const preview = wrangler(["kv", "namespace", "create", "QUOTE_CACHE", "--preview"]);
      console.log(prod.stdout || prod.stderr);
      console.log(preview.stdout || preview.stderr);
      const id = extractField(prod.stdout, "id");
      const previewId =
        extractField(preview.stdout, "preview_id") ?? extractField(preview.stdout, "id");
      if (!id || !previewId) {
        console.log(
          "Could not parse the new IDs automatically — copy them into worker/wrangler.toml by hand.",
        );
        return false;
      }
      patchWranglerToml({
        PLACEHOLDER_KV_NAMESPACE_ID: id,
        PLACEHOLDER_KV_PREVIEW_ID: previewId,
      });
      console.log("worker/wrangler.toml updated with the new KV namespace IDs.");
      return true;
    },
  },
  {
    id: "cf-d1",
    title: "Cloudflare D1 database (crosstide-db)",
    roadmap: "P01, P02",
    check() {
      const toml = readFileSync(WRANGLER_TOML, "utf8");
      const placeholder = toml.includes("PLACEHOLDER_D1_DATABASE_ID");
      return {
        ok: !placeholder,
        detail: placeholder ? "worker/wrangler.toml still has a placeholder ID" : "Provisioned",
      };
    },
    async resolve() {
      console.log("This creates a real Cloudflare D1 database named 'crosstide-db'.");
      if (!(await confirm("Create it now?"))) return false;
      const created = wrangler(["d1", "create", "crosstide-db"]);
      console.log(created.stdout || created.stderr);
      const id = extractField(created.stdout, "database_id");
      if (!id) {
        console.log(
          "Could not parse the new database_id automatically — copy it into worker/wrangler.toml by hand.",
        );
        return false;
      }
      patchWranglerToml({ PLACEHOLDER_D1_DATABASE_ID: id });
      console.log("worker/wrangler.toml updated with the new D1 database ID.");
      if (
        await confirm("Apply migrations now (wrangler d1 migrations apply crosstide-db --remote)?")
      ) {
        wranglerInteractive(["d1", "migrations", "apply", "crosstide-db", "--remote"]);
      } else {
        console.log(
          "Run `npm run` via the migrate-db skill later: see .github/skills/migrate-db/SKILL.md",
        );
      }
      return true;
    },
  },
  {
    id: "cf-r2",
    title: "Cloudflare R2 bucket (crosstide-ohlcv)",
    roadmap: "P01",
    check() {
      const res = wrangler(["r2", "bucket", "list"]);
      return {
        ok: res.ok && res.stdout.includes("crosstide-ohlcv"),
        detail: res.ok ? "checked via `wrangler r2 bucket list`" : firstErrorLine(res),
      };
    },
    async resolve() {
      if (
        !(await confirm("Create the crosstide-ohlcv and crosstide-ohlcv-preview R2 buckets now?"))
      )
        return false;
      const a = wranglerInteractive(["r2", "bucket", "create", "crosstide-ohlcv"]);
      const b = wranglerInteractive(["r2", "bucket", "create", "crosstide-ohlcv-preview"]);
      return a && b;
    },
  },
  {
    id: "cf-deploy-secrets",
    title: "GitHub Actions Cloudflare secrets (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)",
    roadmap: "P03, D01",
    check() {
      if (!toolAvailable("gh")) return { ok: false, detail: "GitHub CLI (gh) is not installed" };
      const res = capture("gh", ["secret", "list"]);
      const names = res.stdout;
      return {
        ok: names.includes("CLOUDFLARE_API_TOKEN") && names.includes("CLOUDFLARE_ACCOUNT_ID"),
        detail: res.ok ? "checked via `gh secret list`" : firstErrorLine(res),
      };
    },
    async resolve() {
      console.log(
        "Each `gh secret set` below hands the prompt to gh itself — paste the value there, not here.",
      );
      for (const name of ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"]) {
        if (await confirm(`Set repository secret ${name} now?`)) {
          runInteractive("gh", ["secret", "set", name]);
        }
      }
      return true;
    },
  },
  {
    id: "npm-auth",
    title: "npm registry authentication (for @crosstide/domain publish)",
    roadmap: "E02",
    check() {
      const res = capture("npm", ["whoami"]);
      return { ok: res.ok, detail: res.ok ? `Logged in as ${res.stdout.trim()}` : "Not logged in" };
    },
    async resolve() {
      console.log("Opening `npm login` — this prompts for your npm credentials directly.");
      if (!(await confirm("Continue?"))) return false;
      return runInteractive("npm", ["login"]);
    },
  },
  {
    id: "npm-publish-secret",
    title: "GitHub Actions npm publish secret (NPM_TOKEN)",
    roadmap: "E02",
    check() {
      if (!toolAvailable("gh")) return { ok: false, detail: "GitHub CLI (gh) is not installed" };
      const res = capture("gh", ["secret", "list"]);
      return {
        ok: res.stdout.includes("NPM_TOKEN"),
        detail: res.ok ? "checked via `gh secret list`" : firstErrorLine(res),
      };
    },
    async resolve() {
      console.log("Create a granular npm access token scoped to @crosstide publish rights first:");
      console.log("  https://www.npmjs.com/settings/<your-user>/tokens");
      if (await confirm("Set repository secret NPM_TOKEN now?")) {
        runInteractive("gh", ["secret", "set", "NPM_TOKEN"]);
      }
      return true;
    },
  },
  {
    id: "provider-keys",
    title: "Optional provider API keys (FINNHUB_KEY, MASSIVE_KEY, ALPHA_VANTAGE_KEY, FRED_KEY)",
    roadmap: "Provider failover, live streaming, macro routes",
    check() {
      // Optional fallbacks — never block a release, only report configured state.
      const res = wrangler(["secret", "list"]);
      const configured = ["FINNHUB_KEY", "MASSIVE_KEY", "ALPHA_VANTAGE_KEY", "FRED_KEY"].filter(
        (k) => res.stdout.includes(k),
      );
      if (!res.ok) {
        return { ok: false, optional: true, detail: firstErrorLine(res) };
      }
      return { ok: true, optional: true, detail: `${configured.length}/4 configured` };
    },
    async resolve() {
      for (const name of ["FINNHUB_KEY", "MASSIVE_KEY", "ALPHA_VANTAGE_KEY", "FRED_KEY"]) {
        if (await confirm(`Set Worker secret ${name} now (skip if you don't have one)?`)) {
          wranglerInteractive(["secret", "put", name]);
        }
      }
      return true;
    },
  },
  {
    id: "flyctl",
    title: "Fly.io / Uptime Kuma monitoring (flyctl)",
    roadmap: "P05, monitoring/fly.toml",
    check() {
      if (!toolAvailable("flyctl")) return { ok: false, detail: "flyctl is not installed" };
      const res = capture("flyctl", ["auth", "whoami"]);
      return { ok: res.ok, detail: res.ok ? res.stdout.trim() : "Installed but not authenticated" };
    },
    async resolve() {
      if (!toolAvailable("flyctl")) {
        console.log("Install flyctl first: https://fly.io/docs/flyctl/install/");
        return false;
      }
      if (!(await confirm("Run `flyctl auth login` now?"))) return false;
      return runInteractive("flyctl", ["auth", "login"]);
    },
  },
  {
    id: "external-users",
    title: "External-user usability evidence (T06, G01)",
    roadmap: "T06, U01, G01",
    manual: true,
    check() {
      return { ok: false, detail: "No script can recruit or consent real users" };
    },
    guidance:
      "See docs/USER_FEEDBACK_PLAN.md for the recruitment, consent, and session protocol. " +
      "This item closes only when five participants complete real, consented sessions.",
  },
  {
    id: "live-demo",
    title: "Public live demo / screenshots (G01)",
    roadmap: "G01",
    manual: true,
    check() {
      return { ok: false, detail: "Requires a hosting decision and recorded demo assets" };
    },
    guidance:
      "See docs/demos/README.md (recording pipeline is code-ready) and docs/CAPABILITY_MATRIX.md. " +
      "Decide a public hosting target, then run `npm run record:demos`.",
  },
  {
    id: "futures-data",
    title: "Live futures/FX/crypto heatmap data source (D01)",
    roadmap: "D01",
    manual: true,
    check() {
      return { ok: false, detail: "No futures data provider is integrated in this codebase yet" };
    },
    guidance:
      "Requires selecting and integrating a futures data vendor — a product/vendor decision, " +
      "not a credential gap. Stocks and crypto already have a provider path; see worker/routes/sector-heatmap.ts.",
  },
];

// ── Runner ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("CrossTide blocker resolver — see docs/ROADMAP.md § External Blockers\n");
  const results = [];

  for (const blocker of blockers) {
    console.log(`\n── ${blocker.title} (${blocker.roadmap}) ──`);
    const status = blocker.check();
    const icon = status.ok ? "✅" : status.optional ? "➖" : "❌";
    console.log(`${icon} ${status.detail}`);

    if (status.ok) {
      results.push({ ...blocker, ok: true });
      continue;
    }

    if (blocker.manual) {
      console.log(`   Manual — not automatable. ${blocker.guidance}`);
      results.push({ ...blocker, ok: false, manual: true });
      continue;
    }

    if (await confirm("Resolve this now?")) {
      const resolved = await blocker.resolve();
      results.push({ ...blocker, ok: Boolean(resolved) });
    } else {
      results.push({ ...blocker, ok: false, skipped: true });
    }
  }

  console.log("\n── Summary ──");
  for (const r of results) {
    const icon = r.ok ? "✅" : r.manual ? "⏸️ " : r.skipped ? "⏭️ " : "❌";
    console.log(`${icon} ${r.title}`);
  }
  console.log(
    "\nRe-run `npm run resolve-blockers` any time to re-check status. " +
      "Update docs/OPERATIONS.md's Verification Snapshot date after a real change.",
  );

  rl.close();
}

await main();
