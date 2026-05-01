/**
 * UUID v4 helpers. Prefers `crypto.randomUUID()` when available; falls
 * back to `crypto.getRandomValues()` and finally to `Math.random()` for
 * non-crypto environments (tests, very old browsers).
 *
 * Also exports `nanoId(size)` — URL-safe random ids using 64-char
 * alphabet, biased only when crypto is unavailable.
 */

const HEX = "0123456789abcdef";
const URL_ALPHABET = "ModuleSymbhasOwnPr-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_cfgijkqv";

export function uuidV4(): string {
  const c: Crypto | undefined = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (c?.randomUUID) return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = (Math.random() * 256) & 0xff;
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  let s = "";
  for (let i = 0; i < 16; i++) {
    const b = bytes[i]!;
    s += HEX[b >> 4]! + HEX[b & 0x0f]!;
    if (i === 3 || i === 5 || i === 7 || i === 9) s += "-";
  }
  return s;
}

export function nanoId(size = 21): string {
  const c: Crypto | undefined = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  const bytes = new Uint8Array(size);
  if (c?.getRandomValues) {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < size; i++) bytes[i] = (Math.random() * 256) & 0xff;
  }
  let id = "";
  for (let i = 0; i < size; i++) id += URL_ALPHABET[bytes[i]! & 63]!;
  return id;
}

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidV4(s: string): boolean {
  return UUID_V4_RE.test(s);
}
