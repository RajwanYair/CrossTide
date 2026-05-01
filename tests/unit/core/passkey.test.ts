import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isPasskeySupported,
  registerPasskey,
  authenticatePasskey,
  storePasskeyId,
  getStoredPasskeyId,
  clearPasskeyId,
  bufferToBase64Url,
  base64UrlToBuffer,
} from "../../../src/core/passkey";

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function makeAttestationResponse(rawId: ArrayBuffer): PublicKeyCredential {
  const attestation = new Uint8Array([1, 2, 3]).buffer;
  const clientData = new TextEncoder().encode('{"type":"webauthn.create"}').buffer;
  return {
    id: bufferToBase64Url(rawId),
    rawId,
    type: "public-key",
    authenticatorAttachment: null,
    getClientExtensionResults: vi.fn(() => ({})),
    response: {
      attestationObject: attestation,
      clientDataJSON: clientData,
      getAuthenticatorData: vi.fn(() => new ArrayBuffer(0)),
      getPublicKey: vi.fn(() => null),
      getPublicKeyAlgorithm: vi.fn(() => -7),
      getTransports: vi.fn(() => []),
    } as unknown as AuthenticatorAttestationResponse,
    toJSON: vi.fn(() => ({})),
  } as unknown as PublicKeyCredential;
}

function makeAssertionResponse(rawId: ArrayBuffer): PublicKeyCredential {
  const authData = new Uint8Array([10, 20, 30]).buffer;
  const clientData = new TextEncoder().encode('{"type":"webauthn.get"}').buffer;
  const sig = new Uint8Array([99, 88, 77]).buffer;
  return {
    id: bufferToBase64Url(rawId),
    rawId,
    type: "public-key",
    authenticatorAttachment: null,
    getClientExtensionResults: vi.fn(() => ({})),
    response: {
      authenticatorData: authData,
      clientDataJSON: clientData,
      signature: sig,
      userHandle: null,
    } as unknown as AuthenticatorAssertionResponse,
    toJSON: vi.fn(() => ({})),
  } as unknown as PublicKeyCredential;
}

// ──────────────────────────────────────────────────────────────
// Feature detection
// ──────────────────────────────────────────────────────────────

describe("isPasskeySupported", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns false when PublicKeyCredential is undefined", () => {
    vi.stubGlobal("PublicKeyCredential", undefined);
    expect(isPasskeySupported()).toBe(false);
  });

  it("returns false when PublicKeyCredential is undefined (second check)", () => {
    // Explicitly confirm the typeof guard blocks undefined values
    vi.stubGlobal("PublicKeyCredential", undefined);
    expect(isPasskeySupported()).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────
// registerPasskey
// ──────────────────────────────────────────────────────────────

describe("registerPasskey", () => {
  const challenge = new Uint8Array([1, 2, 3, 4]).buffer;
  const userId = new TextEncoder().encode("user-123").buffer;
  const store: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("returns ok:false when passkey not supported", async () => {
    vi.stubGlobal("PublicKeyCredential", undefined);
    const result = await registerPasskey({
      challenge,
      rpId: "localhost",
      rpName: "CrossTide",
      userId,
      userName: "alice",
    });
    expect(result.ok).toBe(false);
  });

  it("returns ok:true and serialises credential on success", async () => {
    const rawId = new Uint8Array([5, 6, 7, 8]).buffer;
    const cred = makeAttestationResponse(rawId);

    vi.stubGlobal("PublicKeyCredential", class {});
    vi.stubGlobal("navigator", {
      credentials: { create: vi.fn(async () => cred) },
    });

    const result = await registerPasskey({
      challenge,
      rpId: "localhost",
      rpName: "CrossTide",
      userId,
      userName: "alice",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.credentialId).toBe(bufferToBase64Url(rawId));
      expect(result.value.attestationObject).toBeTruthy();
      expect(result.value.clientDataJSON).toBeTruthy();
    }
  });

  it("stores credential ID in localStorage on success", async () => {
    const rawId = new Uint8Array([9, 10, 11]).buffer;
    const cred = makeAttestationResponse(rawId);

    vi.stubGlobal("PublicKeyCredential", class {});
    vi.stubGlobal("navigator", {
      credentials: { create: vi.fn(async () => cred) },
    });

    await registerPasskey({
      challenge,
      rpId: "localhost",
      rpName: "CrossTide",
      userId,
      userName: "bob",
    });
    expect(getStoredPasskeyId()).toBe(bufferToBase64Url(rawId));
    clearPasskeyId();
  });

  it("returns ok:false when credentials.create throws", async () => {
    vi.stubGlobal("PublicKeyCredential", class {});
    vi.stubGlobal("navigator", {
      credentials: {
        create: vi.fn(async () => {
          throw new Error("User cancelled");
        }),
      },
    });
    const result = await registerPasskey({
      challenge,
      rpId: "localhost",
      rpName: "CrossTide",
      userId,
      userName: "alice",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("User cancelled");
    }
  });

  it("returns ok:false when credential type is not public-key", async () => {
    const fakeCred = { id: "x", rawId: new ArrayBuffer(0), type: "password" };
    vi.stubGlobal("PublicKeyCredential", class {});
    vi.stubGlobal("navigator", {
      credentials: { create: vi.fn(async () => fakeCred) },
    });
    const result = await registerPasskey({
      challenge,
      rpId: "localhost",
      rpName: "CrossTide",
      userId,
      userName: "alice",
    });
    expect(result.ok).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────
// authenticatePasskey
// ──────────────────────────────────────────────────────────────

describe("authenticatePasskey", () => {
  const challenge = new Uint8Array([50, 51, 52]).buffer;

  afterEach(() => vi.unstubAllGlobals());

  it("returns ok:false when passkey not supported", async () => {
    vi.stubGlobal("PublicKeyCredential", undefined);
    const result = await authenticatePasskey({ challenge, rpId: "localhost" });
    expect(result.ok).toBe(false);
  });

  it("returns ok:true and serialises assertion on success", async () => {
    const rawId = new Uint8Array([20, 21, 22]).buffer;
    const assertion = makeAssertionResponse(rawId);

    vi.stubGlobal("PublicKeyCredential", class {});
    vi.stubGlobal("navigator", {
      credentials: { get: vi.fn(async () => assertion) },
    });

    const result = await authenticatePasskey({ challenge, rpId: "localhost" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.credentialId).toBe(bufferToBase64Url(rawId));
      expect(result.value.signature).toBeTruthy();
      expect(result.value.authenticatorData).toBeTruthy();
    }
  });

  it("returns ok:false when credentials.get throws", async () => {
    vi.stubGlobal("PublicKeyCredential", class {});
    vi.stubGlobal("navigator", {
      credentials: {
        get: vi.fn(async () => {
          throw new Error("Timeout");
        }),
      },
    });
    const result = await authenticatePasskey({ challenge, rpId: "localhost" });
    expect(result.ok).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────
// Credential ID storage
// ──────────────────────────────────────────────────────────────

describe("storePasskeyId / getStoredPasskeyId / clearPasskeyId", () => {
  beforeEach(() => {
    // happy-dom's localStorage may not persist; provide a real in-memory mock
    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
      key: (i: number) => Object.keys(store)[i] ?? null,
      get length() {
        return Object.keys(store).length;
      },
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("stores and retrieves a credential ID", () => {
    storePasskeyId("abc-123");
    expect(getStoredPasskeyId()).toBe("abc-123");
    clearPasskeyId();
  });

  it("returns null after clear", () => {
    storePasskeyId("xyz");
    clearPasskeyId();
    expect(getStoredPasskeyId()).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────
// Base64url helpers
// ──────────────────────────────────────────────────────────────

describe("bufferToBase64Url / base64UrlToBuffer", () => {
  it("round-trips an ArrayBuffer", () => {
    const original = new Uint8Array([1, 2, 3, 200, 201, 202]);
    const encoded = bufferToBase64Url(original.buffer);
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
    const decoded = new Uint8Array(base64UrlToBuffer(encoded));
    expect(Array.from(decoded)).toEqual(Array.from(original));
  });

  it("bufferToBase64Url encodes empty buffer to empty string", () => {
    expect(bufferToBase64Url(new ArrayBuffer(0))).toBe("");
  });
});
