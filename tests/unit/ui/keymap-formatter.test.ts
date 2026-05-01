import { describe, it, expect } from "vitest";
import { formatKeymap } from "../../../src/ui/keymap-formatter";

describe("keymap-formatter", () => {
  it("Mod+K on mac -> ⌘K", () => {
    expect(formatKeymap("Mod+K", { platform: "mac" })).toBe("⌘K");
  });

  it("Mod+K on other -> Ctrl+K", () => {
    expect(formatKeymap("Mod+K", { platform: "other" })).toBe("Ctrl+K");
  });

  it("orders modifiers per Apple HIG on mac", () => {
    expect(formatKeymap("Shift+Mod+P", { platform: "mac" })).toBe("⇧⌘P");
    expect(formatKeymap("Ctrl+Alt+Shift+Mod+A", { platform: "mac" })).toBe("⌃⌥⇧⌘A");
  });

  it("preserves declared order on non-mac", () => {
    expect(formatKeymap("Shift+Mod+P", { platform: "other" })).toBe("Shift+Ctrl+P");
  });

  it("arrow keys -> arrow glyphs on both", () => {
    expect(formatKeymap("Alt+ArrowUp", { platform: "mac" })).toBe("⌥↑");
    expect(formatKeymap("Alt+ArrowUp", { platform: "other" })).toBe("Alt+↑");
  });

  it("special keys map to platform labels", () => {
    expect(formatKeymap("Enter", { platform: "mac" })).toBe("↵");
    expect(formatKeymap("Enter", { platform: "other" })).toBe("Enter");
    expect(formatKeymap("Escape", { platform: "other" })).toBe("Esc");
  });

  it("uppercases single-letter keys", () => {
    expect(formatKeymap("Mod+a", { platform: "other" })).toBe("Ctrl+A");
  });

  it("custom separator", () => {
    expect(formatKeymap("Mod+K", { platform: "other", separator: " + " })).toBe("Ctrl + K");
    expect(formatKeymap("Mod+K", { platform: "mac", separator: "-" })).toBe("⌘-K");
  });

  it("empty / whitespace input -> empty string", () => {
    expect(formatKeymap("", { platform: "other" })).toBe("");
    expect(formatKeymap("  +  ", { platform: "other" })).toBe("");
  });

  it("unknown multi-char token kept as-is", () => {
    expect(formatKeymap("Mod+F1", { platform: "other" })).toBe("Ctrl+F1");
  });
});
