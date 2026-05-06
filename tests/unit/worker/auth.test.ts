/**
 * Unit tests for worker/routes/auth.ts (P6)
 * Covers: handleAuthChallenge, handleAuthRegister, handleAuthAuthenticate,
 *         handleSyncGet, handleSyncPut.
 */
import { describe, it, expect, vi } from "vitest";
import {
  handleAuthChallenge,
  handleAuthRegister,
  handleAuthAuthenticate,
  handleSyncGet,
  handleSyncPut,
  parseChallenge,
  parseOrigin,
} from "../../../worker/routes/auth";

// ── Test helpers ─────────────────────────────────────────────────────────────

function toBase64Url(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function makeClientDataJSON(challenge: string, origin = "https://crosstide.pages.dev"): string {
  const obj = { type: "webauthn.create", challenge, origin };
  return toBase64Url(JSON.stringify(obj));
}

function makeAuthClientData(challenge: string): string {
  const obj = { type: "webauthn.get", challenge, origin: "https://crosstide.pages.dev" };
  return toBase64Url(JSON.stringify(obj));
}

function makeKv(initial: Record<string, string> = {}): {
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
} {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    get: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    put: vi.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    delete: vi.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
  };
}

interface DbRow {
  [key: string]: unknown;
}

function makeDb(rows: DbRow[] = []): {
  prepare: ReturnType<typeof vi.fn>;
  _rows: DbRow[];
} {
  const _rows = [...rows];
  function makeStmt(sql: string, _bindings: unknown[] = []) {
    return {
      bind: (...args: unknown[]) => makeStmt(sql, args),
      first: vi.fn(() => {
        // Simple: return the first row in the pool
        return Promise.resolve(_rows[0] ?? null);
      }),
      run: vi.fn(() => Promise.resolve({ results: [], success: true, meta: {} })),
      all: vi.fn(() => Promise.resolve({ results: _rows, success: true, meta: {} })),
    };
  }
  return {
    prepare: vi.fn((sql: string) => makeStmt(sql)),
    _rows,
  };
}

// ── parseChallenge / parseOrigin ──────────────────────────────────────────────

describe("parseChallenge", () => {
  it("extracts challenge from valid clientDataJSON", () => {
    const cdj = makeClientDataJSON("abc123");
    expect(parseChallenge(cdj)).toBe("abc123");
  });

  it("returns null for invalid base64url", () => {
    expect(parseChallenge("!!!not-base64!!!")).toBeNull();
  });
});

describe("parseOrigin", () => {
  it("extracts origin from valid clientDataJSON", () => {
    const cdj = makeClientDataJSON("ch", "https://example.com");
    expect(parseOrigin(cdj)).toBe("https://example.com");
  });

  it("returns null for malformed JSON", () => {
    expect(parseOrigin(toBase64Url("{bad json}"))).toBeNull();
  });
});

// ── handleAuthChallenge ───────────────────────────────────────────────────────

describe("handleAuthChallenge", () => {
  it("returns a base64url challenge and expiresAt", async () => {
    const kv = makeKv();
    const res = await handleAuthChallenge({ QUOTE_CACHE: kv as never });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { challenge: string; expiresAt: number };
    expect(typeof body.challenge).toBe("string");
    expect(body.challenge.length).toBeGreaterThan(10);
    expect(body.expiresAt).toBeGreaterThan(Date.now());
  });

  it("stores the challenge in KV with TTL", async () => {
    const kv = makeKv();
    await handleAuthChallenge({ QUOTE_CACHE: kv as never });
    expect(kv.put).toHaveBeenCalledOnce();
    const [key, value, opts] = kv.put.mock.calls[0] as [string, string, { expirationTtl?: number }];
    expect(key).toMatch(/^auth:challenge:/);
    expect(value).toBe("1");
    expect(opts?.expirationTtl).toBe(300);
  });

  it("works without KV (returns challenge anyway)", async () => {
    const res = await handleAuthChallenge({});
    expect(res.status).toBe(200);
    const body = (await res.json()) as { challenge: string };
    expect(typeof body.challenge).toBe("string");
  });
});

// ── handleAuthRegister ────────────────────────────────────────────────────────

describe("handleAuthRegister", () => {
  it("returns 503 when DB is missing", async () => {
    const challenge = "validchallenge";
    const kv = makeKv({ [`auth:challenge:${challenge}`]: "1" });
    const cdj = makeClientDataJSON(challenge);
    const body = {
      credentialId: "cid1",
      rawId: "cid1",
      attestationObject: "ao",
      clientDataJSON: cdj,
      userHandle: "uh",
    };
    const req = new Request("https://x/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const res = await handleAuthRegister(req, { QUOTE_CACHE: kv as never });
    expect(res.status).toBe(503);
  });

  it("rejects invalid JSON body", async () => {
    const db = makeDb();
    const req = new Request("https://x/api/auth/register", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await handleAuthRegister(req, { DB: db as never });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/invalid json/i);
  });

  it("rejects missing required fields", async () => {
    const db = makeDb();
    const req = new Request("https://x/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ credentialId: "x" }), // missing required fields
      headers: { "Content-Type": "application/json" },
    });
    const res = await handleAuthRegister(req, { DB: db as never });
    expect(res.status).toBe(400);
  });

  it("rejects expired/unknown challenge when KV present", async () => {
    const db = makeDb([]);
    const kv = makeKv({}); // no challenge stored
    const cdj = makeClientDataJSON("unknown-challenge");
    const body = {
      credentialId: "cid2",
      rawId: "cid2",
      attestationObject: "ao",
      clientDataJSON: cdj,
      userHandle: "uh",
    };
    const req = new Request("https://x/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const res = await handleAuthRegister(req, { DB: db as never, QUOTE_CACHE: kv as never });
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/challenge/i);
  });

  it("registers successfully and returns 201", async () => {
    const challenge = "testchal123";
    const kv = makeKv({ [`auth:challenge:${challenge}`]: "1" });
    const db = makeDb([]); // no existing credential
    // Override first() to return null (no duplicate)
    const stmt = {
      bind: vi.fn(),
      first: vi.fn(() => Promise.resolve(null)),
      run: vi.fn(() => Promise.resolve({ success: true })),
    };
    stmt.bind.mockReturnValue(stmt);
    db.prepare.mockReturnValue(stmt);

    const cdj = makeClientDataJSON(challenge);
    const body = {
      credentialId: "cid-success",
      rawId: "cid-success",
      attestationObject: "ao",
      clientDataJSON: cdj,
      userHandle: "uh1",
    };
    const req = new Request("https://x/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const res = await handleAuthRegister(req, { DB: db as never, QUOTE_CACHE: kv as never });
    expect(res.status).toBe(201);
    const json = (await res.json()) as { ok: boolean; credentialId: string };
    expect(json.ok).toBe(true);
    expect(json.credentialId).toBe("cid-success");
  });

  it("rejects duplicate credentialId with 409", async () => {
    const challenge = "dupchallenge";
    const kv = makeKv({ [`auth:challenge:${challenge}`]: "1" });
    const db = makeDb([{ credential_id: "existing-cid" }]);
    const stmt = {
      bind: vi.fn(),
      first: vi.fn(() => Promise.resolve({ credential_id: "existing-cid" })),
      run: vi.fn(),
    };
    stmt.bind.mockReturnValue(stmt);
    db.prepare.mockReturnValue(stmt);

    const cdj = makeClientDataJSON(challenge);
    const body = {
      credentialId: "existing-cid",
      rawId: "existing-cid",
      attestationObject: "ao",
      clientDataJSON: cdj,
      userHandle: "uh",
    };
    const req = new Request("https://x/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const res = await handleAuthRegister(req, { DB: db as never, QUOTE_CACHE: kv as never });
    expect(res.status).toBe(409);
  });
});

// ── handleAuthAuthenticate ────────────────────────────────────────────────────

describe("handleAuthAuthenticate", () => {
  it("returns 503 when DB is missing", async () => {
    const cdj = makeAuthClientData("ch");
    const body = {
      credentialId: "c",
      authenticatorData: "ad",
      clientDataJSON: cdj,
      signature: "sig",
    };
    const req = new Request("https://x/api/auth/authenticate", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const res = await handleAuthAuthenticate(req, {});
    expect(res.status).toBe(503);
  });

  it("rejects when challenge not found in KV", async () => {
    const kv = makeKv({});
    const db = makeDb();
    const cdj = makeAuthClientData("bad-challenge");
    const body = {
      credentialId: "c",
      authenticatorData: "ad",
      clientDataJSON: cdj,
      signature: "sig",
    };
    const req = new Request("https://x/api/auth/authenticate", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const res = await handleAuthAuthenticate(req, { DB: db as never, QUOTE_CACHE: kv as never });
    expect(res.status).toBe(401);
  });

  it("rejects unknown credential with 401", async () => {
    const challenge = "authchal";
    const kv = makeKv({ [`auth:challenge:${challenge}`]: "1" });
    const db = makeDb([]);
    const stmt = { bind: vi.fn(), first: vi.fn(() => Promise.resolve(null)), run: vi.fn() };
    stmt.bind.mockReturnValue(stmt);
    db.prepare.mockReturnValue(stmt);

    const cdj = makeAuthClientData(challenge);
    const body = {
      credentialId: "unknown",
      authenticatorData: "ad",
      clientDataJSON: cdj,
      signature: "sig",
    };
    const req = new Request("https://x/api/auth/authenticate", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const res = await handleAuthAuthenticate(req, { DB: db as never, QUOTE_CACHE: kv as never });
    expect(res.status).toBe(401);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/not found/i);
  });

  it("returns 200 ok for known credential with empty public key (dev mode)", async () => {
    const challenge = "devchal";
    const kv = makeKv({ [`auth:challenge:${challenge}`]: "1" });
    const db = makeDb();
    // Return a credential with empty public_key (dev skip)
    const credStmt = {
      bind: vi.fn(),
      first: vi.fn(() => Promise.resolve({ credential_id: "c1", public_key: "", sign_count: 0 })),
      run: vi.fn(() => Promise.resolve({ success: true })),
    };
    credStmt.bind.mockReturnValue(credStmt);
    db.prepare.mockReturnValue(credStmt);

    const cdj = makeAuthClientData(challenge);
    const body = {
      credentialId: "c1",
      authenticatorData: "ad",
      clientDataJSON: cdj,
      signature: "sig",
    };
    const req = new Request("https://x/api/auth/authenticate", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const res = await handleAuthAuthenticate(req, { DB: db as never, QUOTE_CACHE: kv as never });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; credentialId: string };
    expect(json.ok).toBe(true);
  });
});

// ── handleSyncGet ─────────────────────────────────────────────────────────────

describe("handleSyncGet", () => {
  it("returns 400 when credentialId is missing", async () => {
    const db = makeDb();
    const res = await handleSyncGet(new URL("https://x/api/sync"), { DB: db as never });
    expect(res.status).toBe(400);
  });

  it("returns null blob when credential has no sync data", async () => {
    const db = makeDb();
    const stmt = { bind: vi.fn(), first: vi.fn(() => Promise.resolve(null)) };
    stmt.bind.mockReturnValue(stmt);
    db.prepare.mockReturnValue(stmt);
    const url = new URL("https://x/api/sync?credentialId=cid1");
    const res = await handleSyncGet(url, { DB: db as never });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { encryptedBlob: null; version: number };
    expect(json.encryptedBlob).toBeNull();
    expect(json.version).toBe(0);
  });

  it("returns stored encrypted blob", async () => {
    const db = makeDb();
    const stmt = {
      bind: vi.fn(),
      first: vi.fn(() =>
        Promise.resolve({ encrypted_blob: "enc-data", version: 3, updated_at: 1000 }),
      ),
    };
    stmt.bind.mockReturnValue(stmt);
    db.prepare.mockReturnValue(stmt);
    const url = new URL("https://x/api/sync?credentialId=cid2");
    const res = await handleSyncGet(url, { DB: db as never });
    const json = (await res.json()) as { encryptedBlob: string; version: number };
    expect(json.encryptedBlob).toBe("enc-data");
    expect(json.version).toBe(3);
  });
});

// ── handleSyncPut ─────────────────────────────────────────────────────────────

describe("handleSyncPut", () => {
  it("returns 400 for invalid JSON", async () => {
    const db = makeDb();
    const req = new Request("https://x/api/sync", {
      method: "PUT",
      body: "bad",
      headers: { "Content-Type": "application/json" },
    });
    const res = await handleSyncPut(req, { DB: db as never });
    expect(res.status).toBe(400);
  });

  it("returns 404 when credential does not exist", async () => {
    const db = makeDb();
    const credStmt = { bind: vi.fn(), first: vi.fn(() => Promise.resolve(null)) };
    credStmt.bind.mockReturnValue(credStmt);
    db.prepare.mockReturnValue(credStmt);
    const body = { credentialId: "no-cred", encryptedBlob: "blob", version: 1 };
    const req = new Request("https://x/api/sync", {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const res = await handleSyncPut(req, { DB: db as never });
    expect(res.status).toBe(404);
  });

  it("returns 409 on version conflict", async () => {
    const db = makeDb();
    let callCount = 0;
    const stmt = {
      bind: vi.fn(),
      first: vi.fn(() => {
        callCount++;
        // First call: credential check → found; second call: existing version → 5
        return Promise.resolve(callCount === 1 ? { credential_id: "c1" } : { version: 5 });
      }),
      run: vi.fn(),
    };
    stmt.bind.mockReturnValue(stmt);
    db.prepare.mockReturnValue(stmt);

    const body = { credentialId: "c1", encryptedBlob: "blob", version: 2 }; // version 2 < server 5
    const req = new Request("https://x/api/sync", {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const res = await handleSyncPut(req, { DB: db as never });
    expect(res.status).toBe(409);
  });

  it("stores blob and returns ok on success", async () => {
    const db = makeDb();
    let callCount = 0;
    const stmt = {
      bind: vi.fn(),
      first: vi.fn(() => {
        callCount++;
        return Promise.resolve(callCount === 1 ? { credential_id: "c1" } : null);
      }),
      run: vi.fn(() => Promise.resolve({ success: true })),
    };
    stmt.bind.mockReturnValue(stmt);
    db.prepare.mockReturnValue(stmt);

    const body = { credentialId: "c1", encryptedBlob: "new-blob", version: 1 };
    const req = new Request("https://x/api/sync", {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const res = await handleSyncPut(req, { DB: db as never });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; version: number };
    expect(json.ok).toBe(true);
    expect(json.version).toBe(1);
  });
});
