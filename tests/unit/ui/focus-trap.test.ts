import { describe, it, expect } from "vitest";
import {
  getFocusableElements,
  nextFocusable,
  type FocusableElement,
  type FocusableHost,
} from "../../../src/ui/focus-trap";

interface MockEl extends FocusableElement {
  readonly id: string;
}

const mk = (id: string, tabIndex = 0, attrs: Record<string, string> = {}): MockEl => ({
  id,
  tabIndex,
  hasAttribute: (name): boolean => name in attrs,
  getAttribute: (name): string | null => attrs[name] ?? null,
});

const host = (els: MockEl[]): FocusableHost => ({
  querySelectorAll: (): ArrayLike<FocusableElement> => els,
});

describe("focus-trap", () => {
  it("returns elements in DOM order, skipping tabIndex<0", () => {
    const a = mk("a"),
      b = mk("b", -1),
      c = mk("c");
    expect(getFocusableElements<MockEl>(host([a, b, c])).map((e) => e.id)).toEqual(["a", "c"]);
  });

  it("skips disabled and aria-hidden", () => {
    const a = mk("a"),
      b = mk("b", 0, { disabled: "" }),
      c = mk("c", 0, { "aria-hidden": "true" }),
      d = mk("d");
    expect(getFocusableElements<MockEl>(host([a, b, c, d])).map((e) => e.id)).toEqual(["a", "d"]);
  });

  it("nextFocusable wraps forward at end", () => {
    const a = mk("a"),
      b = mk("b"),
      c = mk("c");
    expect(nextFocusable([a, b, c], c, 1)?.id).toBe("a");
    expect(nextFocusable([a, b, c], a, 1)?.id).toBe("b");
  });

  it("nextFocusable wraps backward at start", () => {
    const a = mk("a"),
      b = mk("b"),
      c = mk("c");
    expect(nextFocusable([a, b, c], a, -1)?.id).toBe("c");
    expect(nextFocusable([a, b, c], b, -1)?.id).toBe("a");
  });

  it("nextFocusable picks first/last when current is null", () => {
    const a = mk("a"),
      b = mk("b");
    expect(nextFocusable([a, b], null, 1)?.id).toBe("a");
    expect(nextFocusable([a, b], null, -1)?.id).toBe("b");
  });

  it("nextFocusable handles current not in list -> first/last", () => {
    const a = mk("a"),
      b = mk("b");
    const stranger = mk("z");
    expect(nextFocusable([a, b], stranger, 1)?.id).toBe("a");
    expect(nextFocusable([a, b], stranger, -1)?.id).toBe("b");
  });

  it("empty list -> null", () => {
    expect(nextFocusable([] as MockEl[], null, 1)).toBeNull();
  });

  it("default direction is forward", () => {
    const a = mk("a"),
      b = mk("b");
    expect(nextFocusable([a, b], a)?.id).toBe("b");
  });
});
