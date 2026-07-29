/**
 * Network guard for the `node` Vitest project.
 *
 * Mirrors `happy-dom-network.ts` so DOM-free suites get identical isolation:
 * dev-server origins resolve to 204, everything else fails fast instead of
 * paying a real DNS round-trip. Installed once as the default — suites that
 * stub `fetch` themselves intentionally take precedence.
 */
const PASSTHROUGH_ORIGIN = "http://localhost:3000";

const guardedFetch: typeof globalThis.fetch = async (input) => {
  const url =
    typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;

  if (new URL(url).origin === PASSTHROUGH_ORIGIN) {
    return new Response(null, { status: 204 });
  }

  throw new TypeError(`fetch failed: blocked outbound request to ${url}`, {
    cause: new Error("Unit tests must stub fetch; real network access is disabled."),
  });
};

globalThis.fetch = guardedFetch;
