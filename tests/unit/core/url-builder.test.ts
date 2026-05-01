import { describe, it, expect } from "vitest";
import { urlBuilder } from "../../../src/core/url-builder";

describe("url-builder", () => {
  it("invalid base throws", () => {
    expect(() => urlBuilder("not a url")).toThrow();
  });

  it("base only", () => {
    expect(urlBuilder("https://api.example.com").toString()).toBe("https://api.example.com/");
  });

  it("appends path segments and trims slashes", () => {
    const u = urlBuilder("https://api.example.com/v1").path("/coins/").path("bitcoin").toString();
    expect(u).toBe("https://api.example.com/v1/coins/bitcoin");
  });

  it("query encodes special chars", () => {
    const u = urlBuilder("https://x.test").query("q", "a b&c").toString();
    expect(u).toBe("https://x.test/?q=a+b%26c");
  });

  it("undefined query values are dropped; null becomes empty", () => {
    const u = urlBuilder("https://x.test").query("a", undefined).query("b", null).toString();
    expect(u).toBe("https://x.test/?b=");
  });

  it("array query becomes repeated keys", () => {
    const u = urlBuilder("https://x.test").query("ids", [1, 2, 3]).toString();
    expect(u).toBe("https://x.test/?ids=1&ids=2&ids=3");
  });

  it("queryAll merges params, skipping undefined", () => {
    const u = urlBuilder("https://x.test").queryAll({ a: 1, b: undefined, c: true }).toString();
    expect(u).toBe("https://x.test/?a=1&c=true");
  });

  it("hash fragment", () => {
    expect(urlBuilder("https://x.test").hash("section").toString()).toBe("https://x.test/#section");
    expect(urlBuilder("https://x.test").hash("#section").toString()).toBe(
      "https://x.test/#section",
    );
  });

  it("immutability: each call returns a new builder", () => {
    const a = urlBuilder("https://x.test");
    const b = a.query("k", 1);
    expect(a.toString()).toBe("https://x.test/");
    expect(b.toString()).toBe("https://x.test/?k=1");
  });

  it("toURL returns a URL instance", () => {
    const u = urlBuilder("https://x.test").path("a").toURL();
    expect(u).toBeInstanceOf(URL);
    expect(u.pathname).toBe("/a");
  });
});
