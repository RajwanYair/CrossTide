/**
 * BYOK (Bring Your Own Key) routes — Q4.
 *
 * Endpoints:
 *   POST /api/keys       — store an encrypted API key
 *   GET  /api/keys       — list stored keys (metadata only, no plaintext)
 *   DELETE /api/keys/:id  — remove a stored key
 *
 * Security model:
 *   - Keys are encrypted client-side with AES-256-GCM before transmission.
 *   - The server stores only ciphertext + IV; it cannot decrypt.
 *   - Authentication via passkey credential_id in request header.
 *   - Provider whitelist prevents arbitrary data injection.
 */

import type { Env, D1Database } from "../index.js";

const VALID_PROVIDERS = new Set([
  "finnhub",
  "alpaca",
  "polygon",
  "tiingo",
  "alpha-vantage",
  "coingecko",
]);

const CREDENTIAL_HEADER = "X-Credential-ID";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StoreKeyBody {
  provider: string;
  encrypted_key: string;
  iv: string;
  label?: string;
}

interface StoredKeyMeta {
  id: number;
  provider: string;
  label: string | null;
  created_at: number;
  updated_at: number;
}

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function handleStoreKey(req: Request, env: Env): Promise<Response> {
  if (!env.DB) return json({ error: "Database not configured" }, 503);

  const credentialId = req.headers.get(CREDENTIAL_HEADER);
  if (!credentialId || credentialId.length < 10) {
    return json({ error: "Missing or invalid credential" }, 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!isStoreKeyBody(body)) {
    return json({ error: "Invalid request body" }, 400);
  }

  if (!VALID_PROVIDERS.has(body.provider)) {
    return json({ error: `Invalid provider. Valid: ${[...VALID_PROVIDERS].join(", ")}` }, 400);
  }

  // Validate base64 format (simple check: only base64 chars)
  if (!isBase64(body.encrypted_key) || !isBase64(body.iv)) {
    return json({ error: "encrypted_key and iv must be base64-encoded" }, 400);
  }

  // IV should be 12 bytes = 16 base64 chars
  if (body.iv.length < 12 || body.iv.length > 24) {
    return json({ error: "IV length invalid (expected 12 bytes base64)" }, 400);
  }

  const label = body.label ? String(body.label).slice(0, 100) : null;

  try {
    await upsertKey(env.DB, credentialId, body.provider, body.encrypted_key, body.iv, label);
    return json({ ok: true, provider: body.provider }, 201);
  } catch (err) {
    return json({ error: "Failed to store key", detail: (err as Error).message }, 500);
  }
}

export async function handleListKeys(req: Request, env: Env): Promise<Response> {
  if (!env.DB) return json({ error: "Database not configured" }, 503);

  const credentialId = req.headers.get(CREDENTIAL_HEADER);
  if (!credentialId || credentialId.length < 10) {
    return json({ error: "Missing or invalid credential" }, 401);
  }

  try {
    const keys = await listKeys(env.DB, credentialId);
    return json({ keys }, 200);
  } catch (err) {
    return json({ error: "Failed to list keys", detail: (err as Error).message }, 500);
  }
}

export async function handleDeleteKey(id: string, req: Request, env: Env): Promise<Response> {
  if (!env.DB) return json({ error: "Database not configured" }, 503);

  const credentialId = req.headers.get(CREDENTIAL_HEADER);
  if (!credentialId || credentialId.length < 10) {
    return json({ error: "Missing or invalid credential" }, 401);
  }

  const numId = Number(id);
  if (!Number.isFinite(numId) || numId < 1) {
    return json({ error: "Invalid key ID" }, 400);
  }

  try {
    const deleted = await deleteKey(env.DB, credentialId, numId);
    if (!deleted) return json({ error: "Key not found" }, 404);
    return json({ ok: true }, 200);
  } catch (err) {
    return json({ error: "Failed to delete key", detail: (err as Error).message }, 500);
  }
}

/**
 * Retrieve the encrypted key blob for a given provider.
 * Used internally by other routes to decrypt with the user's session key.
 */
export async function handleGetKey(req: Request, env: Env): Promise<Response> {
  if (!env.DB) return json({ error: "Database not configured" }, 503);

  const credentialId = req.headers.get(CREDENTIAL_HEADER);
  if (!credentialId || credentialId.length < 10) {
    return json({ error: "Missing or invalid credential" }, 401);
  }

  const url = new URL(req.url);
  const provider = url.searchParams.get("provider");
  if (!provider || !VALID_PROVIDERS.has(provider)) {
    return json({ error: "Invalid or missing provider param" }, 400);
  }

  try {
    const key = await getKey(env.DB, credentialId, provider);
    if (!key) return json({ error: "No key stored for this provider" }, 404);
    return json(key, 200);
  } catch (err) {
    return json({ error: "Failed to get key", detail: (err as Error).message }, 500);
  }
}

// ── D1 queries ────────────────────────────────────────────────────────────────

async function upsertKey(
  db: D1Database,
  credentialId: string,
  provider: string,
  encryptedKey: string,
  iv: string,
  label: string | null,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO user_api_keys (credential_id, provider, encrypted_key, iv, label)
       VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT(credential_id, provider)
       DO UPDATE SET encrypted_key = ?3, iv = ?4, label = ?5, updated_at = unixepoch()`,
    )
    .bind(credentialId, provider, encryptedKey, iv, label)
    .run();
}

async function listKeys(db: D1Database, credentialId: string): Promise<StoredKeyMeta[]> {
  const result = await db
    .prepare(
      `SELECT id, provider, label, created_at, updated_at
       FROM user_api_keys WHERE credential_id = ?1 ORDER BY provider`,
    )
    .bind(credentialId)
    .all<StoredKeyMeta>();
  return result.results;
}

async function deleteKey(db: D1Database, credentialId: string, id: number): Promise<boolean> {
  const result = await db
    .prepare(`DELETE FROM user_api_keys WHERE id = ?1 AND credential_id = ?2`)
    .bind(id, credentialId)
    .run();
  return (result.meta as Record<string, unknown>)["changes"] !== 0;
}

async function getKey(
  db: D1Database,
  credentialId: string,
  provider: string,
): Promise<{ encrypted_key: string; iv: string; provider: string } | null> {
  const row = await db
    .prepare(
      `SELECT encrypted_key, iv, provider FROM user_api_keys
       WHERE credential_id = ?1 AND provider = ?2`,
    )
    .bind(credentialId, provider)
    .first<{ encrypted_key: string; iv: string; provider: string }>();
  return row;
}

// ── Validation helpers ────────────────────────────────────────────────────────

function isStoreKeyBody(v: unknown): v is StoreKeyBody {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj["provider"] === "string" &&
    typeof obj["encrypted_key"] === "string" &&
    typeof obj["iv"] === "string"
  );
}

function isBase64(s: string): boolean {
  return /^[A-Za-z0-9+/=_-]+$/.test(s) && s.length > 0;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
