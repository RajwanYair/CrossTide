import { describe, it, expect, vi } from "vitest";
import {
  handleStoreKey,
  handleListKeys,
  handleDeleteKey,
  handleGetKey,
} from "../../../worker/routes/byok";

function makeEnv(db?: unknown) {
  return { DB: db } as Parameters<typeof handleStoreKey>[1];
}

function mockDb(overrides: Partial<{ run: unknown; all: unknown; first: unknown }> = {}) {
  const stmt = {
    bind: vi.fn().mockReturnThis(),
    run: vi.fn().mockResolvedValue(overrides.run ?? { success: true, meta: { changes: 1 } }),
    all: vi.fn().mockResolvedValue(overrides.all ?? { results: [] }),
    first: vi.fn().mockResolvedValue(overrides.first ?? null),
  };
  return { prepare: vi.fn().mockReturnValue(stmt) };
}

function makeRequest(method: string, body?: unknown, credentialId?: string): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (credentialId) headers["X-Credential-ID"] = credentialId;
  return new Request("http://localhost/api/keys", {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("handleStoreKey", () => {
  it("returns 503 when DB is not configured", async () => {
    const req = makeRequest(
      "POST",
      { provider: "finnhub", encrypted_key: "abc", iv: "123456789012" },
      "cred-1234567890",
    );
    const res = await handleStoreKey(req, makeEnv());
    expect(res.status).toBe(503);
  });

  it("returns 401 without credential header", async () => {
    const db = mockDb();
    const req = makeRequest("POST", {
      provider: "finnhub",
      encrypted_key: "abc",
      iv: "123456789012",
    });
    const res = await handleStoreKey(req, makeEnv(db));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid provider", async () => {
    const db = mockDb();
    const req = makeRequest(
      "POST",
      { provider: "invalid", encrypted_key: "abc", iv: "123456789012" },
      "cred-1234567890",
    );
    const res = await handleStoreKey(req, makeEnv(db));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("Invalid provider");
  });

  it("stores key successfully for valid request", async () => {
    const db = mockDb();
    const req = makeRequest(
      "POST",
      { provider: "finnhub", encrypted_key: "YWJjZGVm", iv: "MTIzNDU2Nzg5MDEy" },
      "cred-1234567890",
    );
    const res = await handleStoreKey(req, makeEnv(db));
    expect(res.status).toBe(201);
    const body = (await res.json()) as { ok: boolean; provider: string };
    expect(body.ok).toBe(true);
    expect(body.provider).toBe("finnhub");
  });

  it("rejects non-base64 encrypted_key", async () => {
    const db = mockDb();
    const req = makeRequest(
      "POST",
      { provider: "finnhub", encrypted_key: "invalid chars !@#$%", iv: "MTIzNDU2Nzg5MDEy" },
      "cred-1234567890",
    );
    const res = await handleStoreKey(req, makeEnv(db));
    expect(res.status).toBe(400);
  });
});

describe("handleListKeys", () => {
  it("returns 401 without credential", async () => {
    const db = mockDb();
    const req = makeRequest("GET", undefined);
    const res = await handleListKeys(req, makeEnv(db));
    expect(res.status).toBe(401);
  });

  it("returns empty list for new user", async () => {
    const db = mockDb({ all: { results: [] } });
    const req = makeRequest("GET", undefined, "cred-1234567890");
    const res = await handleListKeys(req, makeEnv(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { keys: unknown[] };
    expect(body.keys).toEqual([]);
  });

  it("returns stored keys metadata", async () => {
    const keys = [
      {
        id: 1,
        provider: "finnhub",
        label: "Free tier",
        created_at: 1700000000,
        updated_at: 1700000000,
      },
    ];
    const db = mockDb({ all: { results: keys } });
    const req = makeRequest("GET", undefined, "cred-1234567890");
    const res = await handleListKeys(req, makeEnv(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { keys: typeof keys };
    expect(body.keys).toHaveLength(1);
    expect(body.keys[0].provider).toBe("finnhub");
  });
});

describe("handleDeleteKey", () => {
  it("returns 400 for invalid ID", async () => {
    const db = mockDb();
    const req = makeRequest("DELETE", undefined, "cred-1234567890");
    const res = await handleDeleteKey("abc", req, makeEnv(db));
    expect(res.status).toBe(400);
  });

  it("returns 404 when key does not exist", async () => {
    const db = mockDb({ run: { success: true, meta: { changes: 0 } } });
    const req = makeRequest("DELETE", undefined, "cred-1234567890");
    const res = await handleDeleteKey("999", req, makeEnv(db));
    expect(res.status).toBe(404);
  });

  it("deletes key successfully", async () => {
    const db = mockDb({ run: { success: true, meta: { changes: 1 } } });
    const req = makeRequest("DELETE", undefined, "cred-1234567890");
    const res = await handleDeleteKey("1", req, makeEnv(db));
    expect(res.status).toBe(200);
  });
});

describe("handleGetKey", () => {
  it("returns 400 for missing provider param", async () => {
    const db = mockDb();
    const req = new Request("http://localhost/api/keys/get", {
      headers: { "X-Credential-ID": "cred-1234567890" },
    });
    const res = await handleGetKey(req, makeEnv(db));
    expect(res.status).toBe(400);
  });

  it("returns 404 when no key stored", async () => {
    const db = mockDb({ first: null });
    const req = new Request("http://localhost/api/keys/get?provider=finnhub", {
      headers: { "X-Credential-ID": "cred-1234567890" },
    });
    const res = await handleGetKey(req, makeEnv(db));
    expect(res.status).toBe(404);
  });

  it("returns encrypted key blob", async () => {
    const keyData = { encrypted_key: "YWJj", iv: "MTIz", provider: "finnhub" };
    const db = mockDb({ first: keyData });
    const req = new Request("http://localhost/api/keys/get?provider=finnhub", {
      headers: { "X-Credential-ID": "cred-1234567890" },
    });
    const res = await handleGetKey(req, makeEnv(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as typeof keyData;
    expect(body.provider).toBe("finnhub");
    expect(body.encrypted_key).toBe("YWJj");
  });
});
