/**
 * URL-safe Base64 encoding/decoding (RFC 4648 §5). Replaces `+` with `-`,
 * `/` with `_`, and strips `=` padding. Works with strings (UTF-8) and
 * `Uint8Array` payloads in any JS runtime that has `atob`/`btoa` or
 * `Buffer`.
 */

function bytesToBinary(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return s;
}

function binaryToBytes(binary: string): Uint8Array {
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i) & 0xff;
  return out;
}

function b64Encode(bytes: Uint8Array): string {
  if (typeof btoa === "function") return btoa(bytesToBinary(bytes));
  // Node fallback
  return (globalThis as unknown as { Buffer: { from(b: Uint8Array): { toString(enc: string): string } } })
    .Buffer.from(bytes).toString("base64");
}

function b64Decode(b64: string): Uint8Array {
  if (typeof atob === "function") return binaryToBytes(atob(b64));
  return (globalThis as unknown as { Buffer: { from(s: string, e: string): Uint8Array } })
    .Buffer.from(b64, "base64");
}

export function base64UrlEncodeBytes(bytes: Uint8Array): string {
  return b64Encode(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function base64UrlDecodeBytes(s: string): Uint8Array {
  const normalized = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return b64Decode(normalized + pad);
}

export function base64UrlEncode(s: string): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(s));
}

export function base64UrlDecode(s: string): string {
  return new TextDecoder().decode(base64UrlDecodeBytes(s));
}
