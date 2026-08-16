/**
 * HTTP client for the CrossTide Worker API, shared by all MCP tool handlers
 * (roadmap E04). Extracted from `index.ts` so it can be unit tested without
 * triggering that file's unconditional `main()`/stdio-transport startup.
 */

function apiBase(): string {
  return process.env.CROSSTIDE_API_URL ?? "http://localhost:8787";
}

/**
 * Optional bearer token for non-localhost CROSSTIDE_API_URL deployments.
 * Unset by default — the stdio transport's trust boundary already covers the
 * common localhost case; this only matters once CROSSTIDE_API_URL points at a
 * remote Worker that itself requires authentication.
 */
export function authHeaders(): Record<string, string> {
  const token = process.env.CROSSTIDE_API_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function callApi(path: string): Promise<unknown> {
  const url = `${apiBase()}${path}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "CrossTide-MCP/0.1.0", ...authHeaders() },
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export async function postApi(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "CrossTide-MCP/0.1.0",
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}
