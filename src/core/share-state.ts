/**
 * URL state encoder/decoder — share-friendly serialization for the small
 * pieces of app state that participate in deep links (selected ticker,
 * timeframe, active card, screener filters).
 *
 * Encoding: query-string param `s` carries a base64url-encoded JSON blob.
 * The wrapper version-tags the payload so future schemas can be migrated
 * without breaking older share URLs.
 */

const VERSION = 1;
const PARAM = "s";

export interface ShareState {
  readonly symbol?: string;
  readonly range?: "1d" | "5d" | "1m" | "3m" | "1y" | "5y";
  readonly card?: string;
  readonly filters?: readonly string[];
}

interface Envelope {
  readonly v: number;
  readonly s: ShareState;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  // btoa is available in browsers and modern Node (>=16). Test environment
  // (jsdom) provides it.
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(s: string): Uint8Array {
  const pad = (4 - (s.length % 4)) % 4;
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeShareState(state: ShareState): string {
  const env: Envelope = { v: VERSION, s: state };
  const json = JSON.stringify(env);
  const bytes = new TextEncoder().encode(json);
  return bytesToBase64Url(bytes);
}

export function decodeShareState(token: string): ShareState | null {
  if (!token) return null;
  try {
    const bytes = base64UrlToBytes(token);
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("v" in parsed) ||
      !("s" in parsed)
    ) {
      return null;
    }
    const env = parsed as Envelope;
    if (env.v !== VERSION) return null;
    return env.s ?? null;
  } catch {
    return null;
  }
}

export function buildShareUrl(base: string, state: ShareState): string {
  const token = encodeShareState(state);
  const url = new URL(base, "http://placeholder/");
  url.searchParams.set(PARAM, token);
  return base.startsWith("http") ? url.toString() : url.pathname + url.search;
}

export function readShareUrl(url: string): ShareState | null {
  const u = new URL(url, "http://placeholder/");
  const token = u.searchParams.get(PARAM);
  return token ? decodeShareState(token) : null;
}
