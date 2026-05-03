/**
 * Keyboard Shortcut Manager — lightweight key-binding system.
 *
 * Registers global keyboard shortcuts and dispatches to handlers.
 * Ignores key events when the user is typing in an input/textarea.
 */

export interface Shortcut {
  readonly key: string; // e.g. "r", "/", "?", "Escape"
  readonly ctrl?: boolean;
  readonly shift?: boolean;
  readonly alt?: boolean;
  readonly description: string;
  readonly handler: () => void;
}

interface ShortcutRegistry {
  /** Register a shortcut. Returns an unregister function. */
  register(shortcut: Shortcut): () => void;
  /** Remove all registered shortcuts and detach the global listener. */
  destroy(): void;
  /** List all currently registered shortcuts (for help display). */
  list(): ReadonlyArray<{ combo: string; description: string }>;
}

function comboKey(key: string, ctrl?: boolean, shift?: boolean, alt?: boolean): string {
  const parts: string[] = [];
  if (ctrl) parts.push("Ctrl");
  if (alt) parts.push("Alt");
  if (shift) parts.push("Shift");
  parts.push(key.length === 1 ? key.toUpperCase() : key);
  return parts.join("+");
}

function isInputFocused(): boolean {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (document.activeElement instanceof HTMLElement && document.activeElement.isContentEditable)
    return true;
  return false;
}

export function createShortcutManager(): ShortcutRegistry {
  const shortcuts = new Map<string, Shortcut>();

  function onKeyDown(e: KeyboardEvent): void {
    if (isInputFocused()) return;

    const combo = comboKey(e.key, e.ctrlKey || e.metaKey, e.shiftKey, e.altKey);
    const shortcut = shortcuts.get(combo);
    if (shortcut) {
      e.preventDefault();
      shortcut.handler();
    }
  }

  document.addEventListener("keydown", onKeyDown);

  return {
    register(shortcut: Shortcut): () => void {
      const combo = comboKey(shortcut.key, shortcut.ctrl, shortcut.shift, shortcut.alt);
      shortcuts.set(combo, shortcut);
      return (): void => {
        shortcuts.delete(combo);
      };
    },

    destroy(): void {
      document.removeEventListener("keydown", onKeyDown);
      shortcuts.clear();
    },

    list(): ReadonlyArray<{ combo: string; description: string }> {
      return [...shortcuts.entries()].map(([combo, s]) => ({ combo, description: s.description }));
    },
  };
}
