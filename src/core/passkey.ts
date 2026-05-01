/**
 * WebAuthn passkey helpers — register and authenticate using the
 * navigator.credentials API (Passkeys / FIDO2).
 *
 * Design:
 *  - `isPasskeySupported()` guards all calls
 *  - `registerPasskey(options)` wraps `navigator.credentials.create()`,
 *    serialises the credential, and persists the credential ID to localStorage
 *  - `authenticatePasskey(options)` wraps `navigator.credentials.get()`
 *    and returns the serialised assertion for server-side verification
 *  - `storePasskeyId(id)` / `getStoredPasskeyId()` manage the local credential
 *    ID (used to pre-populate the `allowCredentials` list on sign-in)
 *  - All operations return a Result<T> to avoid unhandled promise rejections
 *  - The module is intentionally server-agnostic: challenge and rpId are
 *    supplied by the caller; the returned payloads must be verified server-side
 */

const STORAGE_KEY = "crosstide-passkey-id";

// ──────────────────────────────────────────────────────────────
// Feature detection
// ──────────────────────────────────────────────────────────────

/** Returns true when the browser supports WebAuthn / Passkeys. */
export function isPasskeySupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "credentials" in navigator &&
    navigator.credentials != null &&
    typeof PublicKeyCredential !== "undefined" &&
    PublicKeyCredential != null
  );
}

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface RegisterPasskeyOptions {
  /** Binary challenge from the server (random, ≥ 16 bytes). */
  challenge: ArrayBuffer;
  /** Relying Party identifier (usually the domain). */
  rpId: string;
  /** Human-readable site name. */
  rpName: string;
  /** Unique user ID (opaque bytes, not a username). */
  userId: ArrayBuffer;
  /** Display name shown in the passkey prompt. */
  userName: string;
  /** Display name for the user account. */
  userDisplayName?: string;
}

export interface RegisterPasskeyResult {
  /** Base64url-encoded credential ID. */
  credentialId: string;
  /** Base64url-encoded raw credential ID (same as `credentialId` for most authenticators). */
  rawId: string;
  /** Base64url-encoded attestation object (send to server for verification). */
  attestationObject: string;
  /** Base64url-encoded client data JSON. */
  clientDataJSON: string;
}

export interface AuthenticatePasskeyOptions {
  /** Binary challenge from the server. */
  challenge: ArrayBuffer;
  /** Relying Party identifier. */
  rpId: string;
  /** Previously registered credential IDs to allow (leave empty to allow any). */
  allowCredentialIds?: string[];
}

export interface AuthenticatePasskeyResult {
  credentialId: string;
  rawId: string;
  /** Base64url-encoded authenticator data. */
  authenticatorData: string;
  /** Base64url-encoded client data JSON. */
  clientDataJSON: string;
  /** Base64url-encoded signature. */
  signature: string;
  /** Base64url-encoded user handle (may be empty). */
  userHandle: string;
}

// ──────────────────────────────────────────────────────────────
// Register
// ──────────────────────────────────────────────────────────────

/**
 * Create a new passkey (WebAuthn registration ceremony).
 * On success the credential ID is persisted to localStorage automatically.
 */
export async function registerPasskey(
  opts: RegisterPasskeyOptions,
): Promise<
  | { ok: true; value: RegisterPasskeyResult }
  | { ok: false; error: string }
> {
  if (!isPasskeySupported()) {
    return { ok: false, error: "WebAuthn not supported in this browser" };
  }

  let credential: Credential | null;
  try {
    credential = await navigator.credentials.create({
      publicKey: {
        challenge: opts.challenge,
        rp: { id: opts.rpId, name: opts.rpName },
        user: {
          id: opts.userId,
          name: opts.userName,
          displayName: opts.userDisplayName ?? opts.userName,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },  // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          residentKey: "required",
          userVerification: "preferred",
        },
        timeout: 60_000,
        attestation: "none",
      },
    });
  } catch (err) {
    return { ok: false, error: `credentials.create failed: ${String(err)}` };
  }

  if (credential?.type !== "public-key") {
    return { ok: false, error: "Unexpected credential type returned" };
  }

  const pkc = credential as PublicKeyCredential;
  const response = pkc.response as AuthenticatorAttestationResponse;

  const credentialId = bufferToBase64Url(pkc.rawId);
  storePasskeyId(credentialId);

  return {
    ok: true,
    value: {
      credentialId,
      rawId: bufferToBase64Url(pkc.rawId),
      attestationObject: bufferToBase64Url(response.attestationObject),
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
    },
  };
}

// ──────────────────────────────────────────────────────────────
// Authenticate
// ──────────────────────────────────────────────────────────────

/**
 * Assert a passkey (WebAuthn authentication ceremony).
 */
export async function authenticatePasskey(
  opts: AuthenticatePasskeyOptions,
): Promise<
  | { ok: true; value: AuthenticatePasskeyResult }
  | { ok: false; error: string }
> {
  if (!isPasskeySupported()) {
    return { ok: false, error: "WebAuthn not supported in this browser" };
  }

  const allowCredentials: PublicKeyCredentialDescriptor[] =
    (opts.allowCredentialIds ?? []).map((id) => ({
      type: "public-key" as const,
      id: base64UrlToBuffer(id),
    }));

  let assertion: Credential | null;
  try {
    assertion = await navigator.credentials.get({
      publicKey: {
        challenge: opts.challenge,
        rpId: opts.rpId,
        allowCredentials,
        userVerification: "preferred",
        timeout: 60_000,
      },
    });
  } catch (err) {
    return { ok: false, error: `credentials.get failed: ${String(err)}` };
  }

  if (assertion?.type !== "public-key") {
    return { ok: false, error: "Unexpected assertion type returned" };
  }

  const pkc = assertion as PublicKeyCredential;
  const response = pkc.response as AuthenticatorAssertionResponse;

  return {
    ok: true,
    value: {
      credentialId: bufferToBase64Url(pkc.rawId),
      rawId: bufferToBase64Url(pkc.rawId),
      authenticatorData: bufferToBase64Url(response.authenticatorData),
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      signature: bufferToBase64Url(response.signature),
      userHandle: response.userHandle ? bufferToBase64Url(response.userHandle) : "",
    },
  };
}

// ──────────────────────────────────────────────────────────────
// Credential ID persistence
// ──────────────────────────────────────────────────────────────

/** Persist a base64url credential ID to localStorage. */
export function storePasskeyId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* localStorage unavailable (e.g. private mode with storage blocked) */
  }
}

/** Retrieve the previously stored credential ID, or null. */
export function getStoredPasskeyId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Remove the stored credential ID (e.g. on sign-out). */
export function clearPasskeyId(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// ──────────────────────────────────────────────────────────────
// Base64url helpers (exported for tests)
// ──────────────────────────────────────────────────────────────

/** Convert an ArrayBuffer to a URL-safe base64 string (no padding). */
export function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Convert a URL-safe base64 string to an ArrayBuffer. */
export function base64UrlToBuffer(b64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
