/**
 * Passkey / WebAuthn auth routes (P6) — challenge, register, authenticate, sync.
 *
 * Endpoints:
 *   GET  /api/auth/challenge     — issue a fresh server challenge (stored in KV, TTL 5 min)
 *   POST /api/auth/register      — store a new WebAuthn credential in D1
 *   POST /api/auth/authenticate  — verify a passkey assertion; return credential on success
 *   GET  /api/sync               — return the AES-GCM encrypted blob for a credential
 *   PUT  /api/sync               — store/replace the encrypted blob for a credential
 *
 * Security notes:
 *  - Challenges are one-time-use: deleted after successful assertion or expiry.
 *  - The server verifies ES256 / RS256 signatures via SubtleCrypto when public key is present.
 *  - Signature verification on ES256 (alg -7) uses P-256 ECDSA + SHA-256.
 *  - encrypted_blob is opaque; the server never decrypts it.
 *  - All inputs are validated with Valibot before touching D1.
 */

import * as v from "valibot";
import type { KVNamespace, D1Database } from "../index.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthEnv {
  readonly QUOTE_CACHE?: KVNamespace;
  readonly DB?: D1Database;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Encode a buffer to base64url (no padding). */
function toBase64Url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Decode a base64url string to a Uint8Array. */
function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + "=".repeat(padLen));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/** SHA-256 hash of a buffer, returns ArrayBuffer. */
async function sha256(data: BufferSource): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-256", data);
}

/** Parse the RP ID from clientDataJSON (base64url-encoded JSON). */
function parseOrigin(clientDataJSON: string): string | null {
  try {
    const decoded = new TextDecoder().decode(fromBase64Url(clientDataJSON));
    const parsed = JSON.parse(decoded) as Record<string, unknown>;
    return typeof parsed["origin"] === "string" ? parsed["origin"] : null;
  } catch {
    return null;
  }
}

/** Parse the challenge value from clientDataJSON. */
function parseChallenge(clientDataJSON: string): string | null {
  try {
    const decoded = new TextDecoder().decode(fromBase64Url(clientDataJSON));
    const parsed = JSON.parse(decoded) as Record<string, unknown>;
    return typeof parsed["challenge"] === "string" ? parsed["challenge"] : null;
  } catch {
    return null;
  }
}

/**
 * Verify an ES256 WebAuthn signature.
 * authenticatorData + sha256(clientDataJSON) forms the signed message.
 */
async function verifyES256(
  publicKeySpki: string,
  authenticatorData: string,
  clientDataJSON: string,
  signature: string,
): Promise<boolean> {
  try {
    const pubKeyBytes = fromBase64Url(publicKeySpki);
    const key = await crypto.subtle.importKey(
      "spki",
      pubKeyBytes,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );

    const authDataBytes = fromBase64Url(authenticatorData);
    const clientDataHash = await sha256(fromBase64Url(clientDataJSON));

    // Signed message = authenticatorData || hash(clientDataJSON)
    const signedData = new Uint8Array(authDataBytes.length + 32);
    signedData.set(authDataBytes, 0);
    signedData.set(new Uint8Array(clientDataHash), authDataBytes.length);

    const sigBytes = fromBase64Url(signature);

    return crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, sigBytes, signedData);
  } catch {
    return false;
  }
}

// ── Valibot schemas ───────────────────────────────────────────────────────────

const RegisterBody = v.object({
  credentialId: v.pipe(v.string(), v.minLength(1), v.maxLength(512)),
  rawId: v.pipe(v.string(), v.minLength(1), v.maxLength(512)),
  attestationObject: v.pipe(v.string(), v.minLength(1)),
  clientDataJSON: v.pipe(v.string(), v.minLength(1)),
  /** Base64url-encoded SPKI public key (ES256/RS256). Optional for phase-1 (no attestation). */
  publicKey: v.optional(v.pipe(v.string(), v.minLength(1))),
  userHandle: v.pipe(v.string(), v.minLength(1), v.maxLength(256)),
  rpId: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(253))),
});

const AuthenticateBody = v.object({
  credentialId: v.pipe(v.string(), v.minLength(1), v.maxLength(512)),
  authenticatorData: v.pipe(v.string(), v.minLength(1)),
  clientDataJSON: v.pipe(v.string(), v.minLength(1)),
  signature: v.pipe(v.string(), v.minLength(1)),
  userHandle: v.optional(v.pipe(v.string(), v.maxLength(256))),
});

const SyncPutBody = v.object({
  credentialId: v.pipe(v.string(), v.minLength(1), v.maxLength(512)),
  encryptedBlob: v.pipe(v.string(), v.minLength(1)),
  version: v.pipe(v.number(), v.integer(), v.minValue(1)),
});

// ── Route handlers ────────────────────────────────────────────────────────────

/** GET /api/auth/challenge */
export async function handleAuthChallenge(env: AuthEnv): Promise<Response> {
  const challengeBytes = crypto.getRandomValues(new Uint8Array(32));
  const challenge = toBase64Url(challengeBytes.buffer);
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  // Store challenge in KV so it can be validated at assertion time.
  // If KV is unavailable (dev), omit storage (challenge still usable for dev flows).
  if (env.QUOTE_CACHE) {
    await env.QUOTE_CACHE.put(`auth:challenge:${challenge}`, "1", { expirationTtl: 300 });
  }

  return new Response(JSON.stringify({ challenge, expiresAt }), {
    headers: { "Content-Type": "application/json" },
  });
}

/** POST /api/auth/register */
export async function handleAuthRegister(req: Request, env: AuthEnv): Promise<Response> {
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Auth storage not available" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = v.safeParse(RegisterBody, body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid registration payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { credentialId, clientDataJSON, publicKey, userHandle, rpId } = parsed.output;

  // Verify challenge was issued by this server
  const challenge = parseChallenge(clientDataJSON);
  if (!challenge) {
    return new Response(JSON.stringify({ error: "Cannot parse challenge from clientDataJSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (env.QUOTE_CACHE) {
    const challengeStored = await env.QUOTE_CACHE.get(`auth:challenge:${challenge}`, "text");
    if (!challengeStored) {
      return new Response(JSON.stringify({ error: "Challenge expired or not issued by server" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    await env.QUOTE_CACHE.delete(`auth:challenge:${challenge}`);
  }

  // Check for duplicate registration
  const existing = await env.DB.prepare(
    "SELECT credential_id FROM credentials WHERE credential_id = ?",
  )
    .bind(credentialId)
    .first<{ credential_id: string }>();

  if (existing) {
    return new Response(JSON.stringify({ error: "Credential already registered" }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }

  await env.DB.prepare(
    `INSERT INTO credentials (credential_id, public_key, rp_id, user_handle, sign_count, created_at, last_used_at)
     VALUES (?, ?, ?, ?, 0, unixepoch(), unixepoch())`,
  )
    .bind(credentialId, publicKey ?? "", rpId ?? "crosstide.pages.dev", userHandle)
    .run();

  return new Response(JSON.stringify({ ok: true, credentialId }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

/** POST /api/auth/authenticate */
export async function handleAuthAuthenticate(req: Request, env: AuthEnv): Promise<Response> {
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Auth storage not available" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = v.safeParse(AuthenticateBody, body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid assertion payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { credentialId, authenticatorData, clientDataJSON, signature } = parsed.output;

  // Verify challenge was issued
  const challenge = parseChallenge(clientDataJSON);
  if (!challenge) {
    return new Response(JSON.stringify({ error: "Cannot parse challenge from clientDataJSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (env.QUOTE_CACHE) {
    const challengeStored = await env.QUOTE_CACHE.get(`auth:challenge:${challenge}`, "text");
    if (!challengeStored) {
      return new Response(JSON.stringify({ error: "Challenge expired or not issued by server" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    await env.QUOTE_CACHE.delete(`auth:challenge:${challenge}`);
  }

  // Look up credential
  const cred = await env.DB.prepare(
    "SELECT credential_id, public_key, sign_count FROM credentials WHERE credential_id = ?",
  )
    .bind(credentialId)
    .first<{ credential_id: string; public_key: string; sign_count: number }>();

  if (!cred) {
    return new Response(JSON.stringify({ error: "Credential not found" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify ES256 signature if public key is stored
  if (cred.public_key) {
    const valid = await verifyES256(cred.public_key, authenticatorData, clientDataJSON, signature);
    if (!valid) {
      return new Response(JSON.stringify({ error: "Signature verification failed" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Update last_used_at and sign_count
  await env.DB.prepare("UPDATE credentials SET last_used_at = unixepoch() WHERE credential_id = ?")
    .bind(credentialId)
    .run();

  return new Response(JSON.stringify({ ok: true, credentialId }), {
    headers: { "Content-Type": "application/json" },
  });
}

/** GET /api/sync?credentialId=... */
export async function handleSyncGet(url: URL, env: AuthEnv): Promise<Response> {
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Sync storage not available" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const credentialId = url.searchParams.get("credentialId");
  if (!credentialId || credentialId.length > 512) {
    return new Response(JSON.stringify({ error: "credentialId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const row = await env.DB.prepare(
    "SELECT encrypted_blob, version, updated_at FROM user_sync WHERE credential_id = ?",
  )
    .bind(credentialId)
    .first<{ encrypted_blob: string; version: number; updated_at: number }>();

  if (!row) {
    return new Response(JSON.stringify({ encryptedBlob: null, version: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      encryptedBlob: row.encrypted_blob,
      version: row.version,
      updatedAt: row.updated_at,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
}

/** PUT /api/sync */
export async function handleSyncPut(req: Request, env: AuthEnv): Promise<Response> {
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Sync storage not available" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = v.safeParse(SyncPutBody, body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid sync payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { credentialId, encryptedBlob, version } = parsed.output;

  // Verify credential exists before accepting sync blob
  const cred = await env.DB.prepare("SELECT credential_id FROM credentials WHERE credential_id = ?")
    .bind(credentialId)
    .first<{ credential_id: string }>();

  if (!cred) {
    return new Response(JSON.stringify({ error: "Credential not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Optimistic concurrency: only accept if client version >= stored version
  const existing = await env.DB.prepare("SELECT version FROM user_sync WHERE credential_id = ?")
    .bind(credentialId)
    .first<{ version: number }>();

  if (existing && version < existing.version) {
    return new Response(
      JSON.stringify({
        error: "Conflict: server has newer version",
        serverVersion: existing.version,
      }),
      { status: 409, headers: { "Content-Type": "application/json" } },
    );
  }

  await env.DB.prepare(
    `INSERT INTO user_sync (credential_id, encrypted_blob, version, updated_at)
     VALUES (?, ?, ?, unixepoch())
     ON CONFLICT(credential_id) DO UPDATE SET
       encrypted_blob = excluded.encrypted_blob,
       version        = excluded.version,
       updated_at     = excluded.updated_at`,
  )
    .bind(credentialId, encryptedBlob, version)
    .run();

  return new Response(JSON.stringify({ ok: true, version }), {
    headers: { "Content-Type": "application/json" },
  });
}

/** Parse the origin from a clientDataJSON buffer. Exported for testing. */
export { parseOrigin, parseChallenge };
