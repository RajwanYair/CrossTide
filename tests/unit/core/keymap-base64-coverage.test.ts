/**
 * Coverage for keymap-formatter.ts (lines 109-114) and base64-url.ts (lines 23, 30).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { formatKeymap } from "../../../src/ui/keymap-formatter";
import { base64UrlEncodeBytes, base64UrlDecodeBytes } from "../../../src/domain/base64-url";

describe("keymap-formatter coverage — detectPlatform + mac modifiers sort (lines 109-114)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("detectPlatform uses userAgentData.platform on Mac", () => {
    // Mock navigator.userAgentData.platform = "macOS"
    Object.defineProperty(navigator, "userAgentData", {
      value: { platform: "macOS" },
      configurable: true,
      writable: true,
    });
    // Call formatKeymap without explicit platform → detectPlatform auto-detects
    const result = formatKeymap("Mod+K");
    expect(result).toBe("⌘K"); // Mac format

    delete (navigator as any).userAgentData;
  });

  it("detectPlatform falls back to navigator.platform", () => {
    // Ensure no userAgentData

    (navigator as any).userAgentData = undefined;
    Object.defineProperty(navigator, "platform", {
      value: "Win32",
      configurable: true,
      writable: true,
    });
    const result = formatKeymap("Mod+K");
    expect(result).toBe("Ctrl+K"); // Windows format
  });

  it("mac modifier sorting follows HIG order: Ctrl, Opt, Shift, Cmd (lines 101-104)", () => {
    // Out-of-order: Shift before Ctrl before Cmd
    const result = formatKeymap("Shift+Ctrl+Mod+K", { platform: "mac" });
    // HIG: ⌃ (ctrl=0), ⇧ (shift=2), ⌘ (mod=3), then key K
    expect(result).toBe("⌃⇧⌘K");
  });

  it("mac separator is empty by default", () => {
    const result = formatKeymap("Alt+Shift+Mod+P", { platform: "mac" });
    // HIG: ⌥ (alt=1), ⇧ (shift=2), ⌘ (mod=3), P
    expect(result).toBe("⌥⇧⌘P");
  });
});

describe("base64-url coverage — Buffer fallback (lines 23, 30)", () => {
  it("base64UrlEncodeBytes uses Buffer fallback when btoa unavailable (line 23)", () => {
    const origBtoa = globalThis.btoa;

    (globalThis as any).btoa = undefined;
    // Provide a Buffer mock
    const origBuffer = (globalThis as unknown as { Buffer?: unknown }).Buffer;

    (globalThis as any).Buffer = {
      from: (bytes: Uint8Array) => ({
        toString: (enc: string) => {
          if (enc === "base64") {
            // Manual base64 for simple test
            return origBtoa(String.fromCharCode(...bytes));
          }
          return "";
        },
      }),
    };

    const input = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const result = base64UrlEncodeBytes(input);
    expect(result).toBe("SGVsbG8"); // "Hello" in base64url (no padding)

    // Restore
    globalThis.btoa = origBtoa;

    (globalThis as any).Buffer = origBuffer;
  });

  it("base64UrlDecodeBytes uses Buffer fallback when atob unavailable (line 30)", () => {
    const origAtob = globalThis.atob;

    (globalThis as any).atob = undefined;
    const origBuffer = (globalThis as unknown as { Buffer?: unknown }).Buffer;

    (globalThis as any).Buffer = {
      from: (s: string, enc: string) => {
        if (enc === "base64") {
          const binary = origAtob(s);
          const out = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
          return out;
        }
        return new Uint8Array(0);
      },
    };

    const result = base64UrlDecodeBytes("SGVsbG8");
    expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]));

    // Restore
    globalThis.atob = origAtob;

    (globalThis as any).Buffer = origBuffer;
  });
});
