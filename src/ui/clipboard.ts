/**
 * Clipboard helpers. Prefers `navigator.clipboard` (async, Permission API)
 * and falls back to a hidden `<textarea>` + `document.execCommand("copy")`
 * for older browsers / insecure contexts.
 *
 * Returns a `Result`-like { ok, error } shape so call-sites can show
 * toast feedback without try/catch noise.
 */

export interface ClipboardResult {
  readonly ok: boolean;
  readonly error?: string;
}

export async function copyToClipboard(text: string): Promise<ClipboardResult> {
  const nav: Navigator | undefined = typeof navigator !== "undefined" ? navigator : undefined;
  if (nav?.clipboard?.writeText) {
    try {
      await nav.clipboard.writeText(text);
      return { ok: true };
    } catch (e) {
      return fallbackCopy(text, e);
    }
  }
  return fallbackCopy(text);
}

export async function readClipboard(): Promise<string | null> {
  const nav: Navigator | undefined = typeof navigator !== "undefined" ? navigator : undefined;
  if (!nav?.clipboard?.readText) return null;
  try {
    return await nav.clipboard.readText();
  } catch {
    return null;
  }
}

function fallbackCopy(text: string, originalError?: unknown): ClipboardResult {
  if (typeof document === "undefined") {
    return { ok: false, error: messageFrom(originalError) ?? "no clipboard API" };
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  ta.setAttribute("readonly", "");
  document.body.appendChild(ta);
  try {
    ta.select();
    const ok = document.execCommand("copy");
    return ok ? { ok: true } : { ok: false, error: "execCommand returned false" };
  } catch (e) {
    return { ok: false, error: messageFrom(e) ?? "execCommand threw" };
  } finally {
    document.body.removeChild(ta);
  }
}

function messageFrom(e: unknown): string | undefined {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return undefined;
}
