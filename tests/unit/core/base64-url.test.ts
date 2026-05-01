import { describe, it, expect } from "vitest";
import {
  base64UrlEncode, base64UrlDecode,
  base64UrlEncodeBytes, base64UrlDecodeBytes,
} from "../../../src/core/base64-url";

describe("base64Url string roundtrip", () => {
  it("ASCII", () => {
    expect(base64UrlDecode(base64UrlEncode("hello"))).toBe("hello");
  });
  it("Unicode", () => {
    expect(base64UrlDecode(base64UrlEncode("héllo 🌊"))).toBe("héllo 🌊");
  });
  it("empty string", () => {
    expect(base64UrlEncode("")).toBe("");
    expect(base64UrlDecode("")).toBe("");
  });
});

describe("base64Url byte roundtrip", () => {
  it("random bytes survive", () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    const decoded = base64UrlDecodeBytes(base64UrlEncodeBytes(bytes));
    expect(Array.from(decoded)).toEqual(Array.from(bytes));
  });
  it("strips padding from output", () => {
    expect(base64UrlEncode("a")).not.toContain("=");
    expect(base64UrlEncode("ab")).not.toContain("=");
  });
  it("uses url-safe alphabet", () => {
    // input chosen to produce + and / in standard base64
    const bytes = new Uint8Array([0xfb, 0xff, 0xbf]);
    const enc = base64UrlEncodeBytes(bytes);
    expect(enc).not.toContain("+");
    expect(enc).not.toContain("/");
  });
});
