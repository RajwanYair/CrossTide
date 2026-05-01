import { describe, it, expect } from "vitest";
import {
  encodeShareState,
  decodeShareState,
  buildShareUrl,
  readShareUrl,
  type ShareState,
} from "../../../src/core/share-state";

describe("share-state", () => {
  it("roundtrips a populated state", () => {
    const s: ShareState = {
      symbol: "AAPL",
      range: "1y",
      card: "chart",
      filters: ["oversold", "breakout"],
    };
    const tok = encodeShareState(s);
    expect(decodeShareState(tok)).toEqual(s);
  });

  it("roundtrips empty state", () => {
    expect(decodeShareState(encodeShareState({}))).toEqual({});
  });

  it("decodeShareState returns null for empty token", () => {
    expect(decodeShareState("")).toBeNull();
  });

  it("decodeShareState returns null for garbage", () => {
    expect(decodeShareState("!!not-base64!!")).toBeNull();
  });

  it("decodeShareState rejects wrong version", () => {
    const bad = JSON.stringify({ v: 99, s: {} });
    let bin = "";
    const bytes = new TextEncoder().encode(bad);
    for (const b of bytes) bin += String.fromCharCode(b);
    const tok = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(decodeShareState(tok)).toBeNull();
  });

  it("buildShareUrl appends token query param", () => {
    const url = buildShareUrl("/chart", { symbol: "MSFT" });
    expect(url).toMatch(/^\/chart\?s=/);
  });

  it("readShareUrl extracts state", () => {
    const url = buildShareUrl("/chart", { symbol: "GOOG", range: "5d" });
    expect(readShareUrl(url)).toEqual({ symbol: "GOOG", range: "5d" });
  });

  it("readShareUrl returns null when no token", () => {
    expect(readShareUrl("/chart")).toBeNull();
  });

  it("base64url has no + / =", () => {
    const tok = encodeShareState({ symbol: "??>>><<" });
    expect(tok).not.toMatch(/[+/=]/);
  });
});
