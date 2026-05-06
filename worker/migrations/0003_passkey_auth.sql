-- CrossTide D1 Schema: Passkey Authentication (P6)
--
-- Tables:
--   credentials — WebAuthn credential public keys, keyed by credential ID
--   user_sync   — AES-GCM encrypted user data blobs, keyed by credential ID

-- ─── WebAuthn Credentials ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS credentials (
  credential_id  TEXT PRIMARY KEY,
  -- Base64url-encoded SubjectPublicKeyInfo (SPKI) for ES256 / RS256
  public_key     TEXT NOT NULL,
  -- Stored so the RP can validate rpIdHash in authenticatorData
  rp_id          TEXT NOT NULL DEFAULT 'crosstide.pages.dev',
  -- Signature counter — incremented by the authenticator on each assertion
  sign_count     INTEGER NOT NULL DEFAULT 0,
  -- Opaque user handle (base64url) — not PII, used for discoverable credentials
  user_handle    TEXT NOT NULL,
  created_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  last_used_at   INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ─── User Sync (E2EE) ────────────────────────────────────────────────────────
--
-- The server never receives plaintext user data.
-- The encrypted_blob is opaque to the server; only the client can decrypt it
-- using a key derived from the passkey assertion.

CREATE TABLE IF NOT EXISTS user_sync (
  credential_id  TEXT PRIMARY KEY REFERENCES credentials(credential_id) ON DELETE CASCADE,
  encrypted_blob BLOB NOT NULL,
  -- Monotonic version counter — client increments before each write
  version        INTEGER NOT NULL DEFAULT 1,
  updated_at     INTEGER NOT NULL DEFAULT (unixepoch())
);
