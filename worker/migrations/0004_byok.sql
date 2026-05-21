-- CrossTide D1 Schema: BYOK — Bring Your Own Key (Q4)
--
-- Stores user-supplied API keys encrypted with AES-256-GCM.
-- The encryption key is derived from the user's passkey assertion,
-- so the server never sees plaintext API keys.
--
-- Tables:
--   user_api_keys — encrypted API key store

CREATE TABLE IF NOT EXISTS user_api_keys (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  credential_id  TEXT NOT NULL REFERENCES credentials(credential_id) ON DELETE CASCADE,
  -- Provider slug: 'finnhub', 'alpaca', 'polygon', 'tiingo', 'alpha-vantage'
  provider       TEXT NOT NULL,
  -- AES-256-GCM encrypted API key (base64-encoded ciphertext + IV + tag)
  encrypted_key  TEXT NOT NULL,
  -- 12-byte IV used for AES-GCM encryption (base64-encoded)
  iv             TEXT NOT NULL,
  -- Optional label for UI display (e.g. "My Finnhub Free")
  label          TEXT,
  created_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  -- Each user can only have one key per provider
  UNIQUE(credential_id, provider)
);
