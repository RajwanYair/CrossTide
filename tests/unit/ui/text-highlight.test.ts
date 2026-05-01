import { describe, it, expect } from "vitest";
import { highlightSubstring, highlightWords } from "../../../src/ui/text-highlight";

describe("highlightSubstring", () => {
  it("empty input -> []", () => {
    expect(highlightSubstring("", "x")).toEqual([]);
  });
  it("empty query -> single non-match segment", () => {
    expect(highlightSubstring("hello", "")).toEqual([{ text: "hello", match: false }]);
  });
  it("highlights single occurrence", () => {
    expect(highlightSubstring("hello world", "world")).toEqual([
      { text: "hello ", match: false },
      { text: "world", match: true },
    ]);
  });
  it("case-insensitive", () => {
    expect(highlightSubstring("Hello", "hel")).toEqual([
      { text: "Hel", match: true },
      { text: "lo", match: false },
    ]);
  });
  it("highlights multiple occurrences", () => {
    expect(highlightSubstring("aXaXa", "X")).toEqual([
      { text: "a", match: false },
      { text: "X", match: true },
      { text: "a", match: false },
      { text: "X", match: true },
      { text: "a", match: false },
    ]);
  });
  it("escapes regex metacharacters", () => {
    expect(highlightSubstring("a.b.c", ".")).toEqual([
      { text: "a", match: false },
      { text: ".", match: true },
      { text: "b", match: false },
      { text: ".", match: true },
      { text: "c", match: false },
    ]);
  });
});

describe("highlightWords", () => {
  it("matches any of multiple tokens", () => {
    const out = highlightWords("foo bar baz", "foo baz");
    expect(out).toEqual([
      { text: "foo", match: true },
      { text: " bar ", match: false },
      { text: "baz", match: true },
    ]);
  });
  it("empty query -> single non-match segment", () => {
    expect(highlightWords("foo", "   ")).toEqual([{ text: "foo", match: false }]);
  });
  it("longest token wins on overlap", () => {
    const out = highlightWords("abcdef", "ab abcd");
    expect(out[0]?.text).toBe("abcd");
  });
});
